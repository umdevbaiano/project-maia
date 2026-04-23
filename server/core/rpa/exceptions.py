"""
Maia Platform — RPA Exceptions
Custom exception classes for gracefully handling automation failures, 
site offline errors, and timeouts.
"""

class RPAException(Exception):
    """Base exception for all RPA errors."""
    def __init__(self, message: str, screenshot_path: str = None):
        super().__init__(message)
        self.screenshot_path = screenshot_path

class PortalOfflineError(RPAException):
    """Raised when the target court portal is down or unreachable."""
    pass

class CaptchaTimeoutError(RPAException):
    """Raised when the bot fails to solve a CAPTCHA within the time limit."""
    pass

class CertificateAuthError(RPAException):
    """Raised when A1/A3 certificate injection or auth fails."""
    pass

class LocatorNotFoundError(RPAException):
    """Raised when a specific web element could not be found within timeout."""
    pass
