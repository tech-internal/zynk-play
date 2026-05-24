class XPError(Exception):
    code = 'XP_ERROR'
    message = 'An XP error occurred'
    http_status = 400
    details = None

    def __init__(self, message=None, details=None):
        self.message = message or self.__class__.message
        self.details = details or {}


class XPEventNotFoundError(XPError):
    code = 'XP_EVENT_NOT_FOUND'
    message = 'Event code does not exist in registry'
    http_status = 404


class XPRuleNotFoundError(XPError):
    code = 'XP_RULE_NOT_FOUND'
    message = 'No active rule configured for this event'
    http_status = 404


class XPDailyCapReachedError(XPError):
    code = 'XP_DAILY_CAP_REACHED'
    message = 'Daily cap reached for this event'
    http_status = 429


class XPCooldownActiveError(XPError):
    code = 'XP_COOLDOWN_ACTIVE'
    message = 'Cooldown active — too soon since last trigger'
    http_status = 429


class XPLifetimeCapReachedError(XPError):
    code = 'XP_LIFETIME_CAP_REACHED'
    message = 'Lifetime cap reached for this event'
    http_status = 429


class XPDuplicateRequestError(XPError):
    code = 'XP_DUPLICATE_REQUEST'
    message = 'Idempotency key already processed'
    http_status = 200


class XPInsufficientBalanceError(XPError):
    code = 'XP_INSUFFICIENT_BALANCE'
    message = 'Insufficient XP balance'
    http_status = 400


class XPInvalidRedemptionError(XPError):
    code = 'XP_INVALID_REDEMPTION'
    message = 'Invalid redemption item or cost mismatch'
    http_status = 400
