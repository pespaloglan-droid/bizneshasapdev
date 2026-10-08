"""Time source with clock-rollback protection.

Uses Unix epoch seconds (UTC). A `last_known` watermark is persisted
between runs. If the wall clock is ever observed BEFORE the watermark
minus tolerance, a rollback attack is flagged.
"""

from __future__ import annotations

import datetime as _dt
import time as _time

ROLLBACK_TOLERANCE_SECS: int = 300  # 5 minutes


class TrustedTimeResult:
    """Result of a trusted-time sample."""

    __slots__ = ("now", "from_ntp", "rollback_detected")

    def __init__(self, now: int, from_ntp: bool, rollback_detected: bool) -> None:
        self.now = now
        self.from_ntp = from_ntp
        self.rollback_detected = rollback_detected

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"TrustedTimeResult(now={self.now}, from_ntp={self.from_ntp}, "
            f"rollback_detected={self.rollback_detected})"
        )


class TrustedClock:
    """Lightweight trusted clock.

    Args:
        last_known: persisted watermark (epoch secs) or None on first run.
    """

    def __init__(self, last_known: int | None = None) -> None:
        self._last_known = last_known
        self._ntp_time: int | None = None

    def set_ntp_time(self, epoch_secs: int) -> None:
        """Feed an NTP-sourced time (epoch secs UTC)."""
        self._ntp_time = epoch_secs

    def sample(self) -> TrustedTimeResult:
        """Sample the trusted time. Priority: NTP > local clock."""
        local = now_epoch()
        base = self._ntp_time if self._ntp_time is not None else local
        rollback = (
            self._last_known is not None
            and base < self._last_known - ROLLBACK_TOLERANCE_SECS
        )
        if self._last_known is None or base > self._last_known:
            self._last_known = base
        return TrustedTimeResult(now=base, from_ntp=self._ntp_time is not None, rollback_detected=rollback)


def now_epoch() -> int:
    """Current Unix epoch seconds (UTC)."""
    return int(_time.time())


def parse_epoch(iso: str) -> int | None:
    """Parse an ISO-8601 UTC timestamp into epoch seconds.

    Supports ``2027-12-31T23:59:59Z`` and ``2027-12-31T23:59:59+00:00``.
    """
    s = iso.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = _dt.datetime.fromisoformat(s)
        if dt.tzinfo is None:
            return None
        return int(dt.timestamp())
    except ValueError:
        return None


def format_epoch(epoch: int) -> str:
    """Format epoch seconds as ISO-8601 UTC (``2027-12-31T23:59:59Z``)."""
    return _dt.datetime.fromtimestamp(epoch, tz=_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")