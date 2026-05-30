class LuckyDrawError(Exception):
    code = 'LUCKY_DRAW_ERROR'
    message = 'A lucky draw error occurred'
    http_status = 400
    details = None

    def __init__(self, message=None, details=None):
        self.message = message or self.__class__.message
        self.details = details or {}


class LuckyDrawNotFoundError(LuckyDrawError):
    code = 'LUCKY_DRAW_NOT_FOUND'
    message = 'Lucky draw not found'
    http_status = 404


class LuckyDrawNotOpenError(LuckyDrawError):
    code = 'LUCKY_DRAW_NOT_OPEN'
    message = 'Lucky draw is not open for entries'


class LuckyDrawFullError(LuckyDrawError):
    code = 'LUCKY_DRAW_FULL'
    message = 'Lucky draw has reached maximum participants'


class LuckyDrawAlreadyEnteredError(LuckyDrawError):
    code = 'LUCKY_DRAW_ALREADY_ENTERED'
    message = 'You have already entered this lucky draw'


class LuckyDrawEndedError(LuckyDrawError):
    code = 'LUCKY_DRAW_ENDED'
    message = 'Lucky draw entry period has ended'


class LuckyDrawAlreadyDrawnError(LuckyDrawError):
    code = 'LUCKY_DRAW_ALREADY_DRAWN'
    message = 'Lucky draw has already been drawn'


class LuckyDrawInsufficientXpError(LuckyDrawError):
    code = 'LUCKY_DRAW_INSUFFICIENT_XP'
    message = 'Insufficient XP balance to enter'


class LuckyDrawNoEntriesError(LuckyDrawError):
    code = 'LUCKY_DRAW_NO_ENTRIES'
    message = 'Cannot draw — no participants'


class LuckyDrawInvalidStateError(LuckyDrawError):
    code = 'LUCKY_DRAW_INVALID_STATE'
    message = 'Lucky draw cannot be modified in its current state'
