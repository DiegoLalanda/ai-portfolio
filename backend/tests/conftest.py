"""Los tests offline no embeddean con Gemini y usan SQLite efímero."""

import os
import tempfile

os.environ.setdefault("EMBEDDING_PROVIDER", "hash")
os.environ.setdefault(
    "CHECKPOINT_PATH",
    os.path.join(tempfile.gettempdir(), "portfolio-pytest-checkpoints.sqlite"),
)
os.environ.setdefault("PHOENIX_COLLECTOR_ENDPOINT", "")
os.environ.setdefault("TRACE_JSONL", "true")

from app.observability.tracing import configure_tracing

configure_tracing()
