from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.core.exceptions import ObjectDoesNotExist
from .models import OTPVerification

from .services import UserService
from .serializers import (
    LoginSerializer, OTPVerifySerializer, ForgotPasswordSerializer, 
    ResetPasswordSerializer, ChangePasswordSerializer, UserSerializer
)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            user_data = UserService.register_user(request.data)
            return Response(
                {'message': 'Registration successful. Please verify your OTP/Email.', 'user': user_data},
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            UserService.verify_otp(
                identifier=serializer.validated_data['identifier'],
                otp_code=serializer.validated_data['otp_code'],
                type=serializer.validated_data['type']
            )
            return Response({'message': 'OTP verified successfully.'}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier')
        type = request.data.get('type')
        if not identifier or not type:
            return Response({'error': 'identifier and type are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            UserService.resend_otp(identifier, type)
            return Response({'message': 'OTP resent successfully.'}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = UserService.authenticate_user(
                identifier=serializer.validated_data['identifier'],
                password=serializer.validated_data['password'],
                request=request
            )
            
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data
            }, status=status.HTTP_200_OK)
            
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'errors': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Logged out successfully.'},
                status=status.HTTP_205_RESET_CONTENT
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            UserService.request_password_reset(serializer.validated_data['identifier'])
            return Response({'message': 'Password reset link sent if the account exists.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ConfirmPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            UserService.confirm_password_reset(
                token=serializer.validated_data['token'],
                new_password=serializer.validated_data['password']
            )
            return Response({'message': 'Password reset successful.'})
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            UserService.change_password(
                user=request.user,
                current_password=serializer.validated_data['current_password'],
                new_password=serializer.validated_data['new_password']
            )
            return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = UserService.get_user_profile(request.user.id)
            return Response(profile, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request):
        try:
            updated = UserService.update_user_profile(request.user, request.data)
            return Response(updated, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ExchangeRatesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rates = {
            "USD": 1.0,
            "EUR": 0.91,
            "GBP": 0.78,
            "INR": 83.25,
            "AED": 3.67,
        }
        return Response({'base': 'USD', 'rates': rates}, status=status.HTTP_200_OK)
