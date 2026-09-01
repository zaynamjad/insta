"""
Instagram Stories Scraper — powered by Instaloader.

This module exposes a reusable `InstagramStoryScraper` class and a thin CLI
entry-point so it can be used both as a standalone script and as a library
imported by n8n / Supabase / FastAPI integrations.

Environment variables (loaded from `.env` via python-dotenv):
    INSTAGRAM_USERNAME  – login username
    INSTAGRAM_PASSWORD  – login password
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import instaloader
from instaloader import Profile, StoryItem
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Load .env from the same directory as this script
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
SESSION_DIR = BASE_DIR  # session file lives next to the script
HISTORY_FILE = BASE_DIR / "scraped_stories.json"

# Delay (seconds) between successive profile requests to reduce rate-limit risk
REQUEST_DELAY: float = 3.0

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("instagram_scraper")


# ---------------------------------------------------------------------------
# History tracker — avoids re-downloading the same story
# ---------------------------------------------------------------------------

class HistoryTracker:
    """Persists processed story IDs to a JSON file."""

    def __init__(self, path: Path = HISTORY_FILE) -> None:
        self.path = path
        self._data: dict[str, list[str]] = {}
        self._load()

    # -- persistence --------------------------------------------------------

    def _load(self) -> None:
        if self.path.exists():
            try:
                with open(self.path, "r", encoding="utf-8") as fh:
                    self._data = json.load(fh)
            except (json.JSONDecodeError, OSError):
                logger.warning("History file corrupt — starting fresh.")
                self._data = {}

    def save(self) -> None:
        with open(self.path, "w", encoding="utf-8") as fh:
            json.dump(self._data, fh, indent=2, ensure_ascii=False)

    # -- queries / mutations ------------------------------------------------

    def is_seen(self, username: str, story_id: str) -> bool:
        return story_id in self._data.get(username, [])

    def mark_seen(self, username: str, story_id: str) -> None:
        self._data.setdefault(username, []).append(story_id)


# ---------------------------------------------------------------------------
# Core scraper class
# ---------------------------------------------------------------------------

class InstagramStoryScraper:
    """
    High-level wrapper around Instaloader for scraping Instagram Stories.

    Designed to be instantiated once and reused across calls — the session
    is cached on disk so repeated runs don't trigger a fresh login.

    Public API (suitable for integration with n8n / Supabase / FastAPI):
        scraper = InstagramStoryScraper()
        stories = scraper.scrape_stories(["target_user_1", "target_user_2"])
    """

    def __init__(
        self,
        username: str | None = None,
        password: str | None = None,
        *,
        downloads_dir: Path = DOWNLOADS_DIR,
        request_delay: float = REQUEST_DELAY,
    ) -> None:
        self.username = username or os.getenv("INSTAGRAM_USERNAME", "")
        self.password = password or os.getenv("INSTAGRAM_PASSWORD", "")
        self.downloads_dir = downloads_dir
        self.request_delay = request_delay
        self.history = HistoryTracker()

        if not self.username or not self.password:
            raise EnvironmentError(
                "INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD must be set in .env "
                "or passed explicitly."
            )

        # Configure Instaloader instance
        self._loader = instaloader.Instaloader(
            download_pictures=True,
            download_videos=True,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            post_metadata_txt_pattern="",
            storyitem_metadata_txt_pattern="",
            dirname_pattern=str(self.downloads_dir / "{profile}"),
            filename_pattern="{mediaid}_{typename}",
            quiet=True,
        )

        self._login()

    # -- session / auth -----------------------------------------------------

    @property
    def _session_file(self) -> Path:
        return SESSION_DIR / f"{self.username}.session"

    def _login(self) -> None:
        """Login or resume a saved session."""
        session_path = self._session_file

        if session_path.exists():
            try:
                self._loader.load_session_from_file(
                    self.username, str(session_path)
                )
                # Quick connectivity check
                self._loader.test_login()
                logger.info("Resumed saved session for @%s.", self.username)
                return
            except Exception:
                logger.warning(
                    "Saved session invalid — performing fresh login."
                )

        try:
            self._loader.login(self.username, self.password)
            self._loader.save_session_to_file(str(session_path))
            logger.info("Logged in as @%s (session saved).", self.username)
        except instaloader.TwoFactorAuthRequiredException:
            # Prompt for 2FA code when running interactively
            code = input("Enter 2FA code: ").strip()
            self._loader.two_factor_login(code)
            self._loader.save_session_to_file(str(session_path))
            logger.info("2FA login successful for @%s.", self.username)
        except instaloader.BadCredentialsException:
            logger.error("Login failed — invalid username or password.")
            raise
        except instaloader.ConnectionException as exc:
            if "checkpoint" in str(exc).lower() or "challenge" in str(exc).lower():
                logger.error(
                    "Instagram checkpoint/challenge required. "
                    "Open Instagram in a browser, complete the challenge, "
                    "then re-run this script."
                )
            raise

    # -- story extraction helpers -------------------------------------------

    @staticmethod
    def _extract_mentions(item: StoryItem) -> list[str]:
        """Return a list of @mentioned usernames."""
        mentions: list[str] = []
        try:
            if hasattr(item, "caption_mentions"):
                mentions.extend(item.caption_mentions)
        except Exception:
            pass
        # Also parse from caption text
        caption = getattr(item, "caption", None) or ""
        mentions.extend(re.findall(r"@(\w+)", caption))
        return sorted(set(mentions))

    @staticmethod
    def _extract_hashtags(item: StoryItem) -> list[str]:
        """Return a list of #hashtags."""
        hashtags: list[str] = []
        try:
            if hasattr(item, "caption_hashtags"):
                hashtags.extend(item.caption_hashtags)
        except Exception:
            pass
        caption = getattr(item, "caption", None) or ""
        hashtags.extend(re.findall(r"#(\w+)", caption))
        return sorted(set(hashtags))

    @staticmethod
    def _story_type(item: StoryItem) -> str:
        if item.is_video:
            return "video"
        return "image"

    @staticmethod
    def _media_url(item: StoryItem) -> str:
        try:
            if item.is_video:
                return item.video_url or ""
            return item.url or ""
        except Exception:
            return ""

    def _story_to_dict(self, item: StoryItem, username: str) -> dict[str, Any]:
        """Serialize a single StoryItem to a flat dictionary."""
        return {
            "username": username,
            "story_id": str(item.mediaid),
            "shortcode": getattr(item, "shortcode", None),
            "posted_at": item.date_utc.replace(tzinfo=timezone.utc).isoformat(),
            "story_type": self._story_type(item),
            "media_url": self._media_url(item),
            "caption": getattr(item, "caption", None) or "",
            "mentions": self._extract_mentions(item),
            "hashtags": self._extract_hashtags(item),
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        }

    # -- public API ---------------------------------------------------------

    def scrape_stories(
        self,
        target_usernames: list[str],
    ) -> list[dict[str, Any]]:
        """
        Scrape current Stories for each target username.

        Returns a list of story-data dicts (one per story item).
        Stories that have been scraped before (tracked in the history file)
        are skipped automatically.
        """
        all_results: list[dict[str, Any]] = []

        for idx, target in enumerate(target_usernames):
            target = target.strip().lstrip("@")
            if not target:
                continue

            if idx > 0:
                logger.info("Waiting %.1fs before next request…", self.request_delay)
                time.sleep(self.request_delay)

            logger.info("Processing @%s …", target)

            try:
                profile = Profile.from_username(self._loader.context, target)
            except instaloader.ProfileNotExistsException:
                logger.error("@%s does not exist — skipping.", target)
                continue
            except instaloader.ConnectionException as exc:
                logger.error("Connection error for @%s: %s", target, exc)
                continue

            if profile.is_private and not profile.followed_by_viewer:
                logger.warning(
                    "@%s is private and you don't follow them — skipping.",
                    target,
                )
                continue

            # Fetch stories
            try:
                stories = self._loader.get_stories(userids=[profile.userid])
            except instaloader.LoginRequiredException:
                logger.error("Session expired — please delete the .session file and re-run.")
                raise
            except instaloader.QueryReturnedBadRequestException:
                logger.error("Bad request for @%s — Instagram may be rate-limiting.", target)
                continue
            except instaloader.ConnectionException as exc:
                if "429" in str(exc) or "rate" in str(exc).lower():
                    logger.error(
                        "Rate-limited by Instagram. Wait a few minutes and try again."
                    )
                    raise
                logger.error("Connection error fetching stories for @%s: %s", target, exc)
                continue

            user_story_count = 0

            for story in stories:
                for item in story.get_items():
                    story_id = str(item.mediaid)

                    if self.history.is_seen(target, story_id):
                        logger.debug("Story %s already processed — skipping.", story_id)
                        continue

                    # Download media
                    try:
                        self._loader.download_storyitem(item, target=Path(self.downloads_dir / target))
                        logger.info(
                            "  ✓ Downloaded %s story %s",
                            self._story_type(item),
                            story_id,
                        )
                    except Exception as exc:
                        logger.warning(
                            "  ✗ Failed to download story %s: %s", story_id, exc
                        )

                    data = self._story_to_dict(item, target)
                    all_results.append(data)
                    self.history.mark_seen(target, story_id)
                    user_story_count += 1

            if user_story_count == 0:
                logger.info("  No new stories for @%s.", target)
            else:
                logger.info("  Collected %d new story/stories for @%s.", user_story_count, target)

        # Persist history
        self.history.save()
        logger.info("Done — %d total new stories scraped.", len(all_results))
        return all_results


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------

def main() -> None:
    """Interactive CLI: prompts for target usernames and scrapes their stories."""
    print("=" * 60)
    print("  Instagram Stories Scraper  (Instaloader)")
    print("=" * 60)

    # Collect target usernames
    if len(sys.argv) > 1:
        targets = sys.argv[1:]
    else:
        raw = input(
            "\nEnter target username(s), separated by commas:\n> "
        ).strip()
        if not raw:
            print("No usernames provided. Exiting.")
            return
        targets = [u.strip() for u in raw.split(",") if u.strip()]

    print()

    try:
        scraper = InstagramStoryScraper()
    except EnvironmentError as exc:
        logger.error(str(exc))
        return
    except instaloader.BadCredentialsException:
        return
    except Exception as exc:
        logger.error("Unexpected error during login: %s", exc)
        return

    results = scraper.scrape_stories(targets)

    if results:
        # Dump a summary JSON for easy piping / n8n consumption
        output_path = BASE_DIR / "latest_results.json"
        with open(output_path, "w", encoding="utf-8") as fh:
            json.dump(results, fh, indent=2, ensure_ascii=False)
        print(f"\n📄 Results saved to {output_path}")
    else:
        print("\nNo new stories found.")


if __name__ == "__main__":
    main()
