"""Rúbrica offline y medición live opt-in. No llama a Gemini salvo con --live."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent


def main() -> int:
    if "--live" in sys.argv:
        cmd = [sys.executable, "-m", "pytest", "-m", "live", "-s", "--tb=short"]
        print("Medición live contra Gemini (requiere GEMINI_API_KEY en .env).")
    else:
        cmd = [sys.executable, "-m", "pytest", "-m", "not live", "-q", "--tb=short"]
        print("Rúbrica offline (golden set + grafo, sin red).")
    return subprocess.call(cmd, cwd=BACKEND)


if __name__ == "__main__":
    raise SystemExit(main())
