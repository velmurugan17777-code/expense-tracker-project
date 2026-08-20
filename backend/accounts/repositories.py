from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

User = get_user_model()

class UserRepository:
    """
    Repository layer for the User model.
    Isolates all database queries and interactions.
    """
    
    @staticmethod
    def get_by_id(user_id):
        try:
            return User.objects.get(id=user_id)
        except ObjectDoesNotExist:
            return None

    @staticmethod
    def get_by_email(email):
        try:
            return User.objects.get(email=email)
        except ObjectDoesNotExist:
            return None

    @staticmethod
    def get_by_identifier(identifier):
        from django.db.models import Q
        try:
            return User.objects.get(
                Q(email=identifier) | Q(username=identifier) | Q(mobile_number=identifier)
            )
        except ObjectDoesNotExist:
            return None

    @staticmethod
    def create_user(validated_data):
        return User.objects.create_user(**validated_data)
