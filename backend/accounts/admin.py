from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, OTPVerification, LoginHistory

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'mobile_number', 'is_staff', 'is_active', 'is_email_verified', 'is_mobile_verified')
    search_fields = ('email', 'username', 'mobile_number')
    readonly_fields = ('date_joined', 'last_login')

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'mobile_number', 'profile_picture')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Security & Verification', {'fields': ('is_email_verified', 'is_mobile_verified', 'terms_accepted', 'failed_login_attempts', 'locked_until')}),
        ('Preferences', {'fields': ('currency',)}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(OTPVerification)
admin.site.register(LoginHistory)
