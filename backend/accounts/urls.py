from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/',  views.RegisterView.as_view(),  name='accounts-register'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='accounts-verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='accounts-resend-otp'),
    path('login/',     views.LoginView.as_view(),     name='accounts-login'),
    path('logout/',    views.LogoutView.as_view(),    name='accounts-logout'),
    path('profile/',   views.ProfileView.as_view(),   name='accounts-profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('password-reset/', views.RequestPasswordResetView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', views.ConfirmPasswordResetView.as_view(), name='password-reset-confirm'),
    path('change-password/', views.ChangePasswordView.as_view(), name='password-change'),
    path('exchange-rates/', views.ExchangeRatesView.as_view(), name='exchange-rates'),
]
