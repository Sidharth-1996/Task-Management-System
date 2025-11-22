"""
Custom Middleware for Authentication and Role-Based Access Control
Provides logging, monitoring, and additional security checks
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse

# Set up logger
logger = logging.getLogger(__name__)


class RoleBasedAccessControlMiddleware(MiddlewareMixin):
    """
    Middleware for role-based access control logging and monitoring.
    Logs authentication attempts and role-based access patterns.
    """
    
    def process_request(self, request):
        """
        Process request before view is called.
        Logs authentication status and user role for API requests.
        """
        # Only process API requests (not admin or static files)
        if request.path.startswith('/api/'):
            # Check if user is authenticated
            if hasattr(request, 'user') and request.user.is_authenticated:
                # Log authenticated API access with role
                logger.info(
                    f"API Access - User: {request.user.username} "
                    f"(Role: {request.user.role}) - Path: {request.path} - Method: {request.method}"
                )
            else:
                # Log unauthenticated API access attempts
                logger.warning(
                    f"Unauthenticated API Access Attempt - Path: {request.path} - Method: {request.method}"
                )
        
        return None
    
    def process_response(self, request, response):
        """
        Process response after view is called.
        Adds security headers and logs response status for API requests.
        """
        # Only process API requests
        if request.path.startswith('/api/'):
            # Add security headers
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-Frame-Options'] = 'DENY'
            response['X-XSS-Protection'] = '1; mode=block'
            
            # Log API responses (excluding successful GET requests to reduce noise)
            if response.status_code >= 400 or request.method != 'GET':
                if hasattr(request, 'user') and request.user.is_authenticated:
                    logger.warning(
                        f"API Response - User: {request.user.username} "
                        f"(Role: {request.user.role}) - Path: {request.path} - "
                        f"Method: {request.method} - Status: {response.status_code}"
                    )
                else:
                    logger.warning(
                        f"API Response - Unauthenticated - Path: {request.path} - "
                        f"Method: {request.method} - Status: {response.status_code}"
                    )
        
        return response
    
    def process_exception(self, request, exception):
        """
        Process exceptions that occur during request processing.
        Logs exceptions for monitoring and debugging.
        """
        if request.path.startswith('/api/'):
            if hasattr(request, 'user') and request.user.is_authenticated:
                logger.error(
                    f"API Exception - User: {request.user.username} "
                    f"(Role: {request.user.role}) - Path: {request.path} - "
                    f"Method: {request.method} - Exception: {str(exception)}",
                    exc_info=True
                )
            else:
                logger.error(
                    f"API Exception - Unauthenticated - Path: {request.path} - "
                    f"Method: {request.method} - Exception: {str(exception)}",
                    exc_info=True
                )
        
        return None


class JWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to enhance JWT authentication.
    Validates token presence and logs authentication failures.
    """
    
    def process_request(self, request):
        """
        Process request to validate JWT token presence for protected endpoints.
        Note: Actual JWT validation is handled by DRF's JWTAuthentication class.
        This middleware provides additional logging and monitoring.
        """
        # Only process API requests
        if request.path.startswith('/api/'):
            # Skip authentication endpoints
            if request.path in ['/api/token/', '/api/token/refresh/', '/api/accounts/signup/']:
                return None
            
            # Check for Authorization header
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if not auth_header.startswith('Bearer '):
                # No token provided for protected endpoint
                logger.warning(
                    f"Missing JWT Token - Path: {request.path} - Method: {request.method}"
                )
        
        return None

