"""Mide latencia wall-clock de POST /chat (LangGraph + Gemini). Uso: python scripts/bench_chat_latency.py"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
QUESTIONS = [
    ("simple", "¿Quién es Diego?"),
    ("facts", "¿Qué proyectos de IA hiciste?"),
    ("narrative", "¿Cómo está armada la arquitectura del portfolio agentico?"),
]


def post_chat(question: str) -> tuple[float, int, str]:
    body = json.dumps({"question": question}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE}/api/v1/chat",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            elapsed = time.perf_counter() - started
            return elapsed, resp.status, raw[:80]
    except urllib.error.HTTPError as error:
        elapsed = time.perf_counter() - started
        detail = error.read().decode("utf-8", errors="replace")[:200]
        return elapsed, error.code, detail


def main() -> int:
    print(f"Benchmark {BASE}/api/v1/chat\n")
    rows: list[tuple[str, float, int]] = []
    for label, question in QUESTIONS:
        elapsed, status, snippet = post_chat(question)
        rows.append((label, elapsed, status))
        print(f"  {label:10} {elapsed:6.1f}s  HTTP {status}  {question[:50]!r}")
        if status != 200:
            print(f"             -> {snippet}")
    wall_max = max(r[1] for r in rows)
    print(f"\nmax wall: {wall_max:.1f}s")
    # Sugerencia: router ~30% del total en la práctica; compositor ~70%; margen 1.4x
    router_s = max(18.0, round(wall_max * 0.35 + 5, 0))
    composer_s = max(35.0, round(wall_max * 0.75 + 10, 0))
    print(f"suggested LLM_TIMEOUT_ROUTER_S={int(router_s)}")
    print(f"suggested LLM_TIMEOUT_COMPOSER_S={int(composer_s)}")
    return 0 if all(r[2] == 200 for r in rows) else 1


if __name__ == "__main__":
    sys.exit(main())
