# Instagram Stories Scraper

A production-ready Python scraper that downloads Instagram Stories using [Instaloader](https://instaloader.github.io/). Designed for easy integration with **n8n**, **Supabase**, or any custom API.

---

## Features

| Feature | Details |
|---|---|
| **Session caching** | Logs in once, reuses the session file on subsequent runs |
| **De-duplication** | Tracks processed story IDs in `scraped_stories.json` — never downloads the same story twice |
| **Rich metadata** | Captures username, story ID, timestamp, type (image/video), media URL, caption, @mentions, #hashtags |
| **Media download** | Saves images & videos to `downloads/{username}/` |
| **Rate-limit safety** | Configurable delay between profile requests |
| **Error handling** | Graceful handling for login failure, private accounts, checkpoints, 429 rate-limits, connection drops |
| **Modular class API** | `InstagramStoryScraper` can be imported and called from n8n code nodes, FastAPI routes, or Supabase Edge Functions |

---

## Project Structure

```
InstaAnom/
├── instagram_scraper.py   # Main scraper (class + CLI)
├── requirements.txt       # Python dependencies
├── .env                   # Your real credentials (git-ignored)
├── .env.example           # Template for new developers
├── .gitignore             # Ignores .env, sessions, downloads, __pycache__
├── README.md              # This file
├── downloads/             # Auto-created — story media lands here
├── scraped_stories.json   # Auto-created — de-duplication history
└── latest_results.json    # Auto-created — last run's output
```

---

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure credentials

Copy the example and fill in your password:

```bash
cp .env.example .env
```

Edit `.env`:

```
INSTAGRAM_USERNAME=company87085
INSTAGRAM_PASSWORD=your_password_here
```

### 3. Run the scraper

```bash
python instagram_scraper.py
```

You'll be prompted to enter one or more target usernames (comma-separated). You can also pass them as CLI arguments:

```bash
python instagram_scraper.py target_user1 target_user2
```

---

## Integration API

The `InstagramStoryScraper` class is designed for programmatic use:

```python
from instagram_scraper import InstagramStoryScraper

scraper = InstagramStoryScraper()

# Scrape stories — returns a list of dicts
results = scraper.scrape_stories(["natgeo", "bbcnews"])

for story in results:
    print(story["username"], story["story_type"], story["media_url"])
```

### Return format

Each story dict contains:

```json
{
  "username": "natgeo",
  "story_id": "3456789012345",
  "shortcode": "CxYz...",
  "posted_at": "2026-08-29T10:30:00+00:00",
  "story_type": "video",
  "media_url": "https://...",
  "caption": "",
  "mentions": ["photographer"],
  "hashtags": ["nature"],
  "scraped_at": "2026-08-29T14:15:00+00:00"
}
```

---

## Session Management

On first run, the scraper logs into Instagram and saves a session file (`company87085.session`). Subsequent runs load the session automatically — no re-login required.

If the session expires or Instagram invalidates it, delete the `.session` file and re-run:

```bash
del company87085.session        # Windows
rm company87085.session          # macOS / Linux
python instagram_scraper.py
```

---

## Handling Instagram Challenges

If Instagram triggers a **checkpoint / challenge** (e.g., "Was this you?" prompt):

1. Open Instagram in your browser and complete the verification.
2. Delete the `.session` file.
3. Re-run the scraper.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `INSTAGRAM_USERNAME` | ✅ | Instagram login username |
| `INSTAGRAM_PASSWORD` | ✅ | Instagram login password |

---

## Notes

- This scraper uses **Instaloader only** — no Selenium or browser automation.
- Instagram actively rate-limits automated access. The built-in delay (`REQUEST_DELAY = 3.0s`) is conservative; increase it if you hit 429 errors.
- Stories are ephemeral (24 hours). Run the scraper periodically (e.g., via cron or n8n) to capture them before they expire.
