from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import MaxLengthValidator, MinLengthValidator
from django.utils.translation import gettext_lazy as _
from .managers import UserManager
from rest_framework_simplejwt.tokens import RefreshToken
import random

AUTH_PROVIDER = { 'email': 'email' }

class User(AbstractBaseUser, PermissionsMixin):
    """
    커스텀 사용자 모델. Django 기본 User 모델을 대체.
    """
    email = models.EmailField(max_length=255, unique=True, verbose_name=_('email address'))
    username = models.CharField(max_length=40, unique=True)
    nickname = models.CharField(max_length=40, null=True, blank=True, default="")
    first_name = models.CharField(max_length=40, verbose_name=_('first name'))
    last_name = models.CharField(max_length=40, verbose_name=_('last name'))
    is_active = models.BooleanField(default=True)
    is_online = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    auth_provider = models.CharField(max_length=40, default=AUTH_PROVIDER.get('email'))
    profile_image = models.ImageField(upload_to='profile_images/', default='default.png')
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True
    )

    # 인증에 사용될 필드를 이메일로 설정
    USERNAME_FIELD = 'email'
    # 필수 입력 필드
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    objects = UserManager()

    def __str__(self):
        return self.email
    
    @property
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def tokens(self):
        """
        JWT 토큰 생성 메서드.
        """
        try:
            print("self: ", self)
            token = RefreshToken.for_user(self)
        except Exception as e:
            print("Exception: ", e)
        return {
            'access': str(token.access_token),
            'refresh': str(token),
        }
    
class OTP(models.Model):
    """
    사용자 인증을 위한 One-Time Password 모델.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="verification_code")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

class UserProfile(models.Model):
    """
    사용자 프로필 모델. 추가 정보 저장.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=40, unique=True, blank=True, null=True)

class UserStats(models.Model):
    """
    사용자 게임 통계 모델.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    rating = models.IntegerField(default=1000, validators=[MinLengthValidator(0)])
    
    def __str__(self):
        return f"wins: {self.wins}, losses: {self.losses}, rating: {self.rating}"
