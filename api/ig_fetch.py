"""
Instaloader provider, deployed as a Vercel Python function at /api/ig_fetch (not named instaloader.py: that would shadow the package it imports).

Deliberately small and stateless: one validated request in, one structured JSON
answer out. No sessions, cookies, logins or files are used, and nothing is
retried — a failure is reported as a machine-readable category so the Next.js
router can decide whether to fall back to HikerAPI. Anonymous Stories and
Highlights are not offered at all (Instagram requires a login for them).

Request  : POST {"feature": "profile" | "posts", "username": str, "limit": int}
Auth     : header `x-instaloader-secret` must equal env INSTALOADER_SECRET
Response : {"ok": true, "data": {...}} or {"ok": false, "error": {"category": str}}
"""

import hmac
import itertools
import json
import os
import re
import time
from http.server import BaseHTTPRequestHandler

try:  # a missing/incompatible dependency must degrade to "disabled", never crash
    import instaloader
    from instaloader import Instaloader, Profile
    from instaloader import exceptions as ie
except Exception:  # pragma: no cover - depends on the deployment bundle
    instaloader = None

USERNAME_RE = re.compile(r"^(?!.*\.\.)[a-z0-9._]{1,30}$")
MAX_BODY_BYTES = 2_000
MAX_POSTS = 12  # one page: the first page ships inside the profile response, so no extra queries
SUPPORTED_FEATURES = ("profile", "posts")

# HTTP status for each error category. Instagram-side refusals are reported as
# categories, not passed through, so the router can classify them.
STATUS = {
    "invalid_input": 400,
    "unauthorized": 401,
    "not_found": 404,
    "unsupported": 422,
    "login_required": 403,
    "rate_limited": 429,
    "upstream_error": 502,
    "disabled": 503,
    "timeout": 504,
}


class _WouldSleep(Exception):
    """Raised instead of sleeping: a serverless call must never wait out a rate limit."""


if instaloader is not None:

    class _NoSleepRateController(instaloader.RateController):
        def sleep(self, secs):  # noqa: D401 - overrides the library hook
            raise _WouldSleep()


def _enabled() -> bool:
    return (
        instaloader is not None
        and os.environ.get("INSTALOADER_ENABLED", "").lower() == "true"
        and bool(os.environ.get("INSTALOADER_SECRET"))
    )


def _timeout_seconds() -> float:
    try:
        return max(1.0, min(float(os.environ.get("INSTALOADER_TIMEOUT_MS", "5000")) / 1000.0, 20.0))
    except ValueError:
        return 5.0


def _client(timeout: float):
    return Instaloader(
        quiet=True,
        sleep=False,
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        max_connection_attempts=1,  # no internal retry loop
        request_timeout=timeout,
        rate_controller=lambda ctx: _NoSleepRateController(ctx),
        resume_prefix=None,
        iphone_support=False,  # the iPhone API path needs a login
    )


def _iso(dt):
    return dt.isoformat() + "Z" if dt is not None and dt.tzinfo is None else (dt.isoformat() if dt else None)


def _media_item(node_is_video, display_url, video_url):
    media_url = video_url if node_is_video and video_url else display_url
    if not media_url:
        return None
    return {
        "type": "video" if node_is_video and video_url else "image",
        "url": media_url,
        "thumbnail": display_url,
    }


def _post_payload(post):
    items = []
    if post.typename == "GraphSidecar":
        for node in post.get_sidecar_nodes():
            item = _media_item(node.is_video, node.display_url, node.video_url if node.is_video else None)
            if item:
                items.append(item)
    else:
        item = _media_item(post.is_video, post.url, post.video_url if post.is_video else None)
        if item:
            items.append(item)
    if not items:
        return None

    product_type = None
    try:
        product_type = post._node.get("product_type")
    except Exception:
        pass
    return {
        "id": str(post.mediaid),
        "shortcode": post.shortcode,
        "caption": post.caption,
        "timestamp": _iso(post.date_utc),
        "likes": post.likes,
        "comments": post.comments,
        "is_reel": product_type == "clips",
        "items": items,
    }


def _profile_payload(profile):
    return {
        "user_id": str(profile.userid),
        "username": profile.username,
        "full_name": profile.full_name or None,
        "biography": profile.biography or None,
        "profile_pic_url": profile.profile_pic_url or None,
        "followers": profile.followers,
        "following": profile.followees,
        "posts": profile.mediacount,
        "is_private": bool(profile.is_private),
        "is_verified": bool(profile.is_verified),
        "category": profile.business_category_name or None,
        "external_url": profile.external_url or None,
    }


def _classify(err):
    """Maps a library failure to a category — never exposes the message to the caller."""
    if isinstance(err, _WouldSleep):
        return "rate_limited"
    if isinstance(err, ie.ProfileNotExistsException):
        return "not_found"
    if isinstance(err, (ie.LoginRequiredException, ie.PrivateProfileNotFollowedException)):
        return "login_required"
    if isinstance(err, ie.TooManyRequestsException):
        return "rate_limited"
    if isinstance(err, ie.QueryReturnedNotFoundException):
        return "not_found"
    text = str(err)
    if "429" in text:
        return "rate_limited"
    if "401" in text or "403" in text or "login" in text.lower():
        return "login_required"
    if "timed out" in text.lower() or "timeout" in text.lower():
        return "timeout"
    return "upstream_error"


def run(feature, username, limit):
    """Returns (http_status, body). Pure of HTTP details so it can be unit tested."""
    if not _enabled():
        return 503, {"ok": False, "error": {"category": "disabled"}}
    if feature not in SUPPORTED_FEATURES:
        return 422, {"ok": False, "error": {"category": "unsupported"}}
    if not isinstance(username, str) or not USERNAME_RE.match(username):
        return 400, {"ok": False, "error": {"category": "invalid_input"}}

    limit = limit if isinstance(limit, int) and 0 < limit <= MAX_POSTS else MAX_POSTS
    started = time.monotonic()
    try:
        loader = _client(_timeout_seconds())
        profile = Profile.from_username(loader.context, username)
        data = {"profile": _profile_payload(profile)}

        if feature == "posts":
            posts = []
            # Private profiles expose no posts; the profile alone answers the question.
            if not profile.is_private:
                for post in itertools.islice(profile.get_posts(), limit):
                    payload = _post_payload(post)
                    if payload:
                        posts.append(payload)
            data["posts"] = posts

        data["duration_ms"] = int((time.monotonic() - started) * 1000)
        return 200, {"ok": True, "data": data}
    except Exception as err:  # noqa: BLE001 - every library failure becomes a category
        category = _classify(err)
        # Server-side log only: the class and a short message, never sent to the caller.
        print("ig_fetch failure", feature, category, type(err).__name__, str(err)[:160])
        return STATUS[category], {"ok": False, "error": {"category": category}}


class handler(BaseHTTPRequestHandler):
    def _send(self, status, body):
        payload = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        expected = os.environ.get("INSTALOADER_SECRET", "")
        given = self.headers.get("x-instaloader-secret", "")
        if not expected or not hmac.compare_digest(expected, given):
            return self._send(401, {"ok": False, "error": {"category": "unauthorized"}})

        length = int(self.headers.get("content-length") or 0)
        if length <= 0 or length > MAX_BODY_BYTES:
            return self._send(400, {"ok": False, "error": {"category": "invalid_input"}})
        try:
            body = json.loads(self.rfile.read(length))
        except Exception:
            return self._send(400, {"ok": False, "error": {"category": "invalid_input"}})
        if not isinstance(body, dict):
            return self._send(400, {"ok": False, "error": {"category": "invalid_input"}})

        status, out = run(body.get("feature"), body.get("username"), body.get("limit"))
        self._send(status, out)

    def do_GET(self):
        self._send(405, {"ok": False, "error": {"category": "invalid_input"}})
