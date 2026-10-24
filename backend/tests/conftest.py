"""Los tests offline no embeddean con Gemini y usan SQLite efímero."""

import os
import tempfile

os.environ.setdefault("EMBEDDING_PROVIDER", "hash")
os.environ.setdefault(
    "CHECKPOINT_PATH",
    os.path.join(tempfile.gettempdir(), "portfolio-pytest-checkpoints.sqlite"),
)
