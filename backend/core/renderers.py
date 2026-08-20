from rest_framework.renderers import JSONRenderer

class CustomJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        # Determine success based on HTTP status code
        status_code = renderer_context['response'].status_code if renderer_context else 200
        success = 200 <= status_code < 300

        # Sometimes data might be None
        if data is None:
            data = {}

        # If it's already wrapped (e.g. from an exception handler), don't wrap it again
        if isinstance(data, dict) and 'success' in data and 'message' in data and 'data' in data:
            # We assume it's correctly formatted
            response_data = data
        else:
            response_data = {
                "success": success,
                "message": "Operation completed successfully." if success else "An error occurred.",
                "data": data if success else {},
                "errors": data if not success else None
            }
            # Special case for DRF paginated responses: if data has 'results', we should keep it inside data
            # Or if it's already an error dict from simplejwt, it will be placed in 'errors'.

        return super().render(response_data, accepted_media_type, renderer_context)
