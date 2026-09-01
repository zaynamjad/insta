"""
FastAPI backend that wraps the Instaloader-based Instagram Stories scraper.

Exposes:
  GET  /health                    — liveness check
  GET  /api/stories/{username}    — returns profile + stories JSON

Authenticated via a shared secret in the `Authorization: Bearer <secret>` header.
The Instaloader session is restored from a base64-encoded `INSTA_SESSION_B64`
env var on startup so the container doesn't need a persistent filesystem.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import instaloader
from instaloader import Profile, StoryItem
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

API_SECRET = os.getenv("API_SECRET_KEY", "")
INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME", "")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD", "")
INSTA_SESSION_B64 = os.getenv("INSTA_SESSION_B64", "")

SESSION_DIR = Path(__file__).resolve().parent
REQUEST_DELAY: float = 2.0

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("insta_api")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Instagram Stories API",
    version="1.0.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["Authorization", "Content-Type"],
)

# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

async def verify_api_key(authorization: str = Header(default="")):
    """Validates the Bearer token against API_SECRET_KEY."""
    if not API_SECRET:
        # If no secret is configured, allow all requests (dev mode)
        return
    token = authorization.replace("Bearer ", "").strip()
    if token != API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")

# ---------------------------------------------------------------------------
# Instaloader singleton
# ---------------------------------------------------------------------------

class InstaSession:
    """Manages a single Instaloader instance across the app lifetime."""

    def __init__(self) -> None:
        self._loader: instaloader.Instaloader | None = None
        self._ready = False

    @property
    def loader(self) -> instaloader.Instaloader:
        if not self._loader or not self._ready:
            self._init()
        return self._loader  # type: ignore[return-value]

    def _init(self) -> None:
        self._loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            quiet=True,
        )

        session_file = SESSION_DIR / f"{INSTAGRAM_USERNAME}.session"

        # Strategy 1: Restore session from base64 env var
        if INSTA_SESSION_B64 and not session_file.exists():
            try:
                raw = base64.b64decode(INSTA_SESSION_B64)
                session_file.write_bytes(raw)
                logger.info("Restored session file from INSTA_SESSION_B64.")
            except Exception as exc:
                logger.warning("Failed to restore session from env var: %s", exc)

        # Strategy 2: Load existing session file
        if session_file.exists():
            try:
                self._loader.load_session_from_file(
                    INSTAGRAM_USERNAME, str(session_file)
                )
                self._loader.test_login()
                logger.info("Resumed saved session for @%s.", INSTAGRAM_USERNAME)
                self._ready = True
                return
            except Exception:
                logger.warning("Saved session invalid — trying fresh login.")

        # Strategy 3: Fresh login
        if INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD:
            try:
                self._loader.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
                self._loader.save_session_to_file(str(session_file))
                logger.info("Logged in as @%s (session saved).", INSTAGRAM_USERNAME)
                self._ready = True
                return
            except Exception as exc:
                logger.error("Login failed: %s", exc)
                raise RuntimeError(f"Cannot authenticate with Instagram: {exc}")

        raise RuntimeError(
            "No session file, no INSTA_SESSION_B64, and no credentials configured."
        )


_session = InstaSession()

# ---------------------------------------------------------------------------
# Story extraction helpers
# ---------------------------------------------------------------------------

def extract_mentions(item: StoryItem) -> list[str]:
    mentions: list[str] = []
    try:
        if hasattr(item, "caption_mentions"):
            mentions.extend(item.caption_mentions)
    except Exception:
        pass
    caption = getattr(item, "caption", None) or ""
    mentions.extend(re.findall(r"@(\w+)", caption))
    return sorted(set(mentions))


def extract_hashtags(item: StoryItem) -> list[str]:
    hashtags: list[str] = []
    try:
        if hasattr(item, "caption_hashtags"):
            hashtags.extend(item.caption_hashtags)
    except Exception:
        pass
    caption = getattr(item, "caption", None) or ""
    hashtags.extend(re.findall(r"#(\w+)", caption))
    return sorted(set(hashtags))


def story_type(item: StoryItem) -> str:
    return "video" if item.is_video else "image"


def media_url(item: StoryItem) -> str:
    try:
        return (item.video_url if item.is_video else item.url) or ""
    except Exception:
        return ""


def story_to_dict(item: StoryItem, username: str) -> dict[str, Any]:
    """Serialize a StoryItem to the shape expected by the Next.js frontend."""
    return {
        "id": str(item.mediaid),
        "type": story_type(item),
        "mediaUrl": media_url(item),
        "thumbnailUrl": item.url if item.is_video else None,
        "timestamp": item.date_utc.replace(tzinfo=timezone.utc).isoformat(),
        "duration": 15 if item.is_video else 5,
        "caption": getattr(item, "caption", None) or "",
        "mentions": extract_mentions(item),
        "hashtags": extract_hashtags(item),
    }


# ---------------------------------------------------------------------------
# Profile fetching (public web scrape for metadata)
# ---------------------------------------------------------------------------

def fetch_profile_metadata(loader: instaloader.Instaloader, username: str) -> dict[str, Any] | None:
    """Fetch basic profile info using Instaloader."""
    try:
        profile = Profile.from_username(loader.context, username)
    except instaloader.ProfileNotExistsException:
        return None
    except instaloader.ConnectionException as exc:
        raise HTTPException(status_code=502, detail=f"Connection error: {exc}")

    return {
        "username": profile.username,
        "profileImage": profile.profile_pic_url or None,
        "fullName": profile.full_name or None,
        "bio": profile.biography or None,
        "followers": profile.followers,
        "following": profile.followees,
        "posts": profile.mediacount,
        "isVerified": profile.is_verified,
        "isPublic": not profile.is_private,
        "is_private": profile.is_private,
        "userid": profile.userid,
        "followed_by_viewer": profile.followed_by_viewer,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/stories/{username}", dependencies=[Depends(verify_api_key)])
async def get_stories(username: str):
    """Fetch profile info and current stories for a public Instagram user."""
    username = username.strip().lstrip("@").lower()

    if not re.match(r"^[a-z0-9._]{1,30}$", username):
        raise HTTPException(status_code=400, detail="Invalid username format.")

    loader = _session.loader

    # Fetch profile metadata
    profile_data = fetch_profile_metadata(loader, username)
    if profile_data is None:
        return {
            "status": "not_found",
            "username": username,
        }

    if profile_data["is_private"] and not profile_data["followed_by_viewer"]:
        return {
            "status": "private",
            "profile": {
                "username": profile_data["username"],
                "profileImage": profile_data["profileImage"],
                "fullName": profile_data["fullName"],
                "bio": profile_data["bio"],
                "followers": profile_data["followers"],
                "following": profile_data["following"],
                "posts": profile_data["posts"],
                "isVerified": profile_data["isVerified"],
                "isPublic": False,
                "stories": [],
            },
        }

    # Fetch stories
    stories_data: list[dict[str, Any]] = []
    try:
        stories = loader.get_stories(userids=[profile_data["userid"]])
        for story in stories:
            for item in story.get_items():
                stories_data.append(story_to_dict(item, username))
    except instaloader.LoginRequiredException:
        logger.error("Session expired during story fetch.")
        raise HTTPException(status_code=503, detail="Session expired. Please re-authenticate.")
    except instaloader.ConnectionException as exc:
        if "429" in str(exc):
            raise HTTPException(status_code=429, detail="Rate limited by Instagram. Try again later.")
        logger.error("Connection error fetching stories: %s", exc)
        # Return profile without stories rather than failing entirely
        stories_data = []

    profile_response = {
        "username": profile_data["username"],
        "profileImage": profile_data["profileImage"],
        "fullName": profile_data["fullName"],
        "bio": profile_data["bio"],
        "followers": profile_data["followers"],
        "following": profile_data["following"],
        "posts": profile_data["posts"],
        "isVerified": profile_data["isVerified"],
        "isPublic": not profile_data["is_private"],
        "stories": stories_data,
    }

    if len(stories_data) == 0:
        return {"status": "no_stories", "profile": profile_response}

    return {"status": "ok", "profile": profile_response}


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    """Eagerly initialize the Instaloader session on boot."""
    try:
        _ = _session.loader
        logger.info("FastAPI startup complete — Instaloader session ready.")
    except Exception as exc:
        logger.error("Failed to initialize Instaloader on startup: %s", exc)
