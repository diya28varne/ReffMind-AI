import os
import sys
from pathlib import Path

# Serverless defaults — demo works without watsonx or local Chroma
os.environ.setdefault("DEMO_MODE", "true")
os.environ.setdefault("VERCEL", "1")

REFMIND = Path(__file__).resolve().parent.parent / "refmind"
BACKEND = REFMIND / "backend"
sys.path.insert(0, str(BACKEND))

from mangum import Mangum  # noqa: E402

from app.main import app  # noqa: E402


class StripApiPrefix:
    """Vercel routes /api/* here; FastAPI routes are at /*."""

    def __init__(self, asgi_app):
        self.app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path.startswith("/api"):
                scope = dict(scope)
                scope["path"] = path[4:] or "/"
        await self.app(scope, receive, send)


handler = StripApiPrefix(Mangum(app, lifespan="off"))
