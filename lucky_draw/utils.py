from entertainment_platform.models import User


def mask_display_name(user: User) -> str:
    """Return a privacy-safe display name for announcements."""
    if user.username:
        if len(user.username) <= 3:
            return f'{user.username[0]}***'
        return f'{user.username[:2]}***{user.username[-1]}'

    if user.full_name:
        parts = user.full_name.strip().split()
        if parts:
            return parts[0]

    phone = user.phone_number or ''
    if len(phone) >= 7:
        return f'{phone[:3]}****{phone[-4:]}'
    if phone:
        return f'{phone[0]}***'
    return 'Anonymous'
