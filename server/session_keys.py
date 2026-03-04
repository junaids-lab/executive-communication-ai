import threading
import time
import uuid

SESSION_TTL = 86400

_store: dict[str, dict] = {}
_lock = threading.Lock()


def create_session() -> str:
    session_id = uuid.uuid4().hex
    return session_id


def set_api_key(session_id: str, api_key: str) -> None:
    with _lock:
        _store[session_id] = {
            "api_key": api_key,
            "created_at": time.time(),
        }


def get_api_key(session_id: str) -> str | None:
    with _lock:
        entry = _store.get(session_id)
        if entry is None:
            return None
        if time.time() - entry["created_at"] > SESSION_TTL:
            del _store[session_id]
            return None
        return entry["api_key"]


def remove_api_key(session_id: str) -> bool:
    with _lock:
        return _store.pop(session_id, None) is not None


def has_api_key(session_id: str) -> bool:
    return get_api_key(session_id) is not None


def cleanup_expired() -> int:
    now = time.time()
    removed = 0
    with _lock:
        expired = [sid for sid, entry in _store.items() if now - entry["created_at"] > SESSION_TTL]
        for sid in expired:
            del _store[sid]
            removed += 1
    return removed
