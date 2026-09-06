"""Application configuration, read from the environment."""

import os

from dotenv import find_dotenv, load_dotenv

# Loaded here as well as in core.supabase_client so this module works no
# matter which of the two Python imports first.
load_dotenv(find_dotenv())


def _flag(name: str, default: str = "False") -> bool:
    return os.environ.get(name, default).strip().lower() in ("true", "1", "t", "yes")


# Flask's debugger executes arbitrary code submitted from the browser, so it
# stays off unless explicitly enabled for local development.
FLASK_DEBUG = _flag("FLASK_DEBUG")