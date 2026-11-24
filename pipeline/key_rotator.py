import os
import sys
import time
import itertools
from google import genai
from google.genai import types

class AllKeysQuotaExhaustedError(Exception):
    """Raised when all available Gemini API keys have exhausted their quota / rate limits (429)."""
    pass

def is_quota_error(e: Exception) -> bool:
    msg = str(e).lower()
    return "429" in msg or "resource_exhausted" in msg or "quota" in msg or "too many requests" in msg or "rate limit" in msg

def is_transient_error(e: Exception) -> bool:
    msg = str(e).lower()
    return "503" in msg or "504" in msg or "deadline_exceeded" in msg or "unavailable" in msg or "500" in msg or "high demand" in msg or "temporary" in msg or "timeout" in msg

class KeyRotator:
    def __init__(self, env_path: str = None):
        keys_str = os.getenv('GEMINI_API_KEYS', '')
        
        # Check current dir .env or parent dir .env
        candidates = [env_path, '.env', os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'), os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')]
        for c in candidates:
            if not keys_str and c and os.path.exists(c):
                with open(c, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.startswith('GEMINI_API_KEYS='):
                            keys_str = line.strip().split('=', 1)[1]
                            break

        self.keys = [k.strip() for k in keys_str.split(',') if k.strip()]
        if not self.keys:
            single = os.getenv('GEMINI_API_KEY', '')
            if single:
                self.keys = [single]
        
        self._pool = itertools.cycle(self.keys) if self.keys else None
        self.total_keys = len(self.keys)
        print(f"[KEY ROTATOR] Initialized with {self.total_keys} active Gemini API key(s).")

    def get_client(self, timeout_ms=60000):
        if not self.keys or not self._pool:
            raise RuntimeError("No Gemini API keys found. Please set GEMINI_API_KEYS or GEMINI_API_KEY in your environment or .env file.")
        next_key = next(self._pool)
        return genai.Client(
            api_key=next_key,
            http_options=types.HttpOptions(
                api_version='v1beta',
                timeout=timeout_ms,
                retry_options=types.HttpRetryOptions(attempts=1)
            )
        )

    def execute_with_retry(self, fn, max_total_attempts=None):
        if not self.keys:
            raise RuntimeError("No Gemini API keys configured.")
        
        attempts_left = max_total_attempts or max(len(self.keys) * 3, 5)
        consecutive_quota_errors = 0
        
        while attempts_left > 0:
            client = self.get_client()
            try:
                return fn(client)
            except Exception as e:
                attempts_left -= 1
                if is_quota_error(e):
                    consecutive_quota_errors += 1
                    print(f"  [KEY ROTATOR] Quota limit encountered on key. Rotating to next key ({attempts_left} attempts remaining)...")
                    if consecutive_quota_errors >= len(self.keys):
                        time.sleep(2)
                    continue
                elif is_transient_error(e):
                    print(f"  [KEY ROTATOR] Transient network/service error ({e}). Retrying in 1s...")
                    time.sleep(1.0)
                    continue
                else:
                    raise e
        
        raise AllKeysQuotaExhaustedError("All Gemini API keys or retry limits were exhausted.")
