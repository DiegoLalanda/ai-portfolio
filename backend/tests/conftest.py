"""Los tests offline no embeddean con Gemini."""

import os

os.environ.setdefault("EMBEDDING_PROVIDER", "hash")
