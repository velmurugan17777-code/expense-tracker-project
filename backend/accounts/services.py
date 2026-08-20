import uuid
import random
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from rest_framework.exceptions import ValidationError, PermissionDenied
from .repositories import UserRepository
from .serializers import UserRegistrationSerializer
from .models import User, OTPVerification, LoginHistory, PasswordResetToken

class UserService:
    @staticmethod
    def register_user(data: dict) -> dict:
        serializer = UserRegistrationSerializer(data=data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        validated = serializer.validated_data
        validated.pop('password_confirm', None)
        user = UserRepository.create_user(validated)
        
        # Generate a single OTP and send via both SMS (mock) and Email
        UserService._generate_and_dispatch_otp(user)

        return {
            'id': str(user.id),
            'email': user.email,
            'username': user.username,
            'mobile_number': user.mobile_number,
        }

    @staticmethod
    def _generate_and_dispatch_otp(user):
        """Generate one OTP code and deliver it through all available channels."""
        otp_code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timedelta(minutes=5)
        
        # Store as SMS type (the verification endpoint checks this)
        OTPVerification.objects.create(
            user=user,
            otp_code=otp_code,
            type='SMS',
            expires_at=expires_at
        )
        
        # --- Channel 1: SMS (mocked — no Twilio keys) ---
        print(f"[SMS MOCK] Sent OTP {otp_code} to {user.mobile_number}")
        
        # --- Channel 2: Email (real — uses Django email backend) ---
        try:
            from django.core.mail import send_mail
            from django.conf import settings as django_settings
            send_mail(
                subject='SmartTracker — Your Verification Code',
                message=(
                    f'Hi {user.first_name or "there"},\n\n'
                    f'Your verification code is: {otp_code}\n\n'
                    f'This code expires in 5 minutes.\n\n'
                    f'If you did not create an account, please ignore this email.\n\n'
                    f'— SmartTracker Team'
                ),
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"[EMAIL] Verification email sent to {user.email}")
        except Exception as e:
            # Log the failure but don't block registration
            print(f"[EMAIL ERROR] Could not send email to {user.email}: {e}")

    @staticmethod
    def generate_and_send_otp(user, type: str):
        """Legacy wrapper — redirects to unified dispatcher."""
        UserService._generate_and_dispatch_otp(user)

    @staticmethod
    def verify_otp(identifier: str, otp_code: str, type: str):
        user = UserRepository.get_by_identifier(identifier)
        if not user:
            raise ValidationError({'detail': 'User not found.'})
            
        try:
            otp = OTPVerification.objects.filter(
                user=user, is_used=False
            ).latest('created_at')
        except OTPVerification.DoesNotExist:
            raise ValidationError({'detail': 'Invalid OTP.'})

        if otp.attempts >= 5:
            raise ValidationError({'detail': 'Too many attempts. Request a new OTP.'})
            
        if timezone.now() > otp.expires_at:
            raise ValidationError({'detail': 'OTP has expired.'})

        if otp.otp_code != otp_code:
            otp.attempts += 1
            otp.save()
            raise ValidationError({'detail': 'Incorrect OTP.'})

        otp.is_used = True
        otp.save()

        # A single OTP verification activates both channels
        user.is_mobile_verified = True
        user.is_email_verified = True
        user.save()
        return True

    @staticmethod
    def resend_otp(identifier: str, type: str):
        user = UserRepository.get_by_identifier(identifier)
        if not user:
            raise ValidationError({'detail': 'User not found.'})
            
        # Check cooldown (any OTP, regardless of type)
        try:
            latest_otp = OTPVerification.objects.filter(user=user).latest('created_at')
            if timezone.now() < latest_otp.created_at + timedelta(seconds=60):
                raise ValidationError({'detail': 'Please wait 60 seconds before requesting a new OTP.'})
        except OTPVerification.DoesNotExist:
            pass

        UserService._generate_and_dispatch_otp(user)
        return True

    @staticmethod
    def authenticate_user(identifier: str, password: str, request) -> User:
        user = UserRepository.get_by_identifier(identifier)
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT')
        
        if not user:
            raise ValidationError({'detail': 'Invalid credentials.'})
            
        if user.is_locked:
            raise PermissionDenied({'detail': f'Account locked until {user.locked_until.strftime("%Y-%m-%d %H:%M:%S")}.'})

        if not user.check_password(password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = timezone.now() + timedelta(minutes=15)
            user.save()
            
            LoginHistory.objects.create(
                user=user, ip_address=ip_address, device_info=user_agent, status='FAILED'
            )
            raise ValidationError({'detail': 'Invalid credentials.'})

        if not user.is_mobile_verified or not user.is_email_verified:
            raise PermissionDenied({'detail': 'Account not verified. Please verify your OTP/Email.'})

        user.failed_login_attempts = 0
        user.locked_until = None
        user.save()
        
        LoginHistory.objects.create(
            user=user, ip_address=ip_address, device_info=user_agent, status='SUCCESS'
        )
        return user

    @staticmethod
    def request_password_reset(identifier: str):
        user = UserRepository.get_by_identifier(identifier)
        if not user:
            return # Don't reveal existence
            
        token = str(uuid.uuid4())
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        print(f"[EMAIL MOCK] Password reset link for {user.email}: {reset_link}")

    @staticmethod
    def confirm_password_reset(token: str, new_password: str):
        try:
            reset_token = PasswordResetToken.objects.get(token=token, is_used=False)
            if timezone.now() > reset_token.expires_at:
                raise ValidationError({'detail': 'Token expired.'})
                
            user = reset_token.user
            user.set_password(new_password)
            user.save()
            
            reset_token.is_used = True
            reset_token.save()
        except PasswordResetToken.DoesNotExist:
            raise ValidationError({'detail': 'Invalid token.'})

    @staticmethod
    def change_password(user: User, current_password: str, new_password: str):
        if not user.check_password(current_password):
            raise ValidationError({'detail': 'Incorrect current password.'})
        user.set_password(new_password)
        user.save()

    @staticmethod
    def get_user_profile(user_id: str) -> dict:
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise ValidationError({'detail': 'User not found.'})
        return {
            'id': str(user.id),
            'email': user.email,
            'username': user.username,
            'mobile_number': user.mobile_number,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture': user.profile_picture,
            'date_joined': user.date_joined.isoformat(),
        }

    @staticmethod
    def update_user_profile(user: User, data: dict) -> dict:
        old_mobile = user.mobile_number
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.username = data.get('username', user.username)
        user.mobile_number = data.get('mobile_number', user.mobile_number)
        user.profile_picture = data.get('profile_picture', user.profile_picture)
        
        if old_mobile != user.mobile_number:
            user.is_mobile_verified = False
            UserService.generate_and_send_otp(user, 'SMS')
            
        user.save()
        return UserService.get_user_profile(user.id)

