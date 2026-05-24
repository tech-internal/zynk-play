"""XP tier thresholds and multipliers per TDD section 6.3."""

XP_TIERS = (
    ('bronze', 'Bronze', 0, 4999, 1.0, 90),
    ('silver', 'Silver', 5000, 14999, 1.25, 120),
    ('gold', 'Gold', 15000, 49999, 1.5, 150),
    ('platinum', 'Platinum', 50000, 149999, 1.75, 180),
    ('diamond', 'Diamond', 150000, None, 2.0, 365),
)

TIER_ORDER = [t[0] for t in XP_TIERS]


def tier_for_total_xp(total_xp_earned: int) -> str:
    result = 'bronze'
    for tier_id, _label, low, high, _mult, _days in XP_TIERS:
        if total_xp_earned >= low and (high is None or total_xp_earned <= high):
            result = tier_id
    return result


def tier_multiplier(tier_id: str) -> float:
    for tier_id_row, _label, _low, _high, mult, _days in XP_TIERS:
        if tier_id_row == tier_id:
            return mult
    return 1.0


def next_tier_info(tier_id: str) -> tuple[str | None, int | None]:
    """Return (next_tier_id, xp_to_next) or (None, None) at max tier."""
    idx = TIER_ORDER.index(tier_id) if tier_id in TIER_ORDER else 0
    if idx >= len(TIER_ORDER) - 1:
        return None, None
    next_id = TIER_ORDER[idx + 1]
    for tier_id_row, _label, low, _high, _mult, _days in XP_TIERS:
        if tier_id_row == next_id:
            return next_id, low
    return None, None
