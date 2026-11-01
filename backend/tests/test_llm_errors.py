from app.llm.errors import is_rate_limit_error


def test_is_rate_limit_error_detects_resource_exhausted():
    class FakeRpcError(Exception):
        code = "StatusCode.RESOURCE_EXHAUSTED"

    assert is_rate_limit_error(FakeRpcError("quota"))


def test_is_rate_limit_error_detects_message():
    assert is_rate_limit_error(RuntimeError("RESOURCE_EXHAUSTED: quota exceeded"))
