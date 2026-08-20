from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        # Determine the error message
        if isinstance(exc, ValidationError) or isinstance(exc, DjangoValidationError):
            message = "Validation failed."
            errors = response.data
        else:
            message = "An error occurred."
            # response.data might be a string or a dict. Try to extract 'detail' if present.
            if isinstance(response.data, dict):
                message = response.data.get('detail', message)
                errors = response.data
            else:
                errors = {"detail": response.data}
                
        # Format the response to match our standard format
        custom_response_data = {
            "success": False,
            "message": message,
            "data": {},
            "errors": errors
        }
        response.data = custom_response_data
    else:
        # If response is None, it means it's an unhandled exception (like 500)
        # We don't want to handle 500 here if Django is configured to use standard 500 pages,
        # but for an API we might want to return JSON anyway.
        # But for now we just return None to let Django's middleware handle it (or DRF's 500 view).
        pass

    return response
