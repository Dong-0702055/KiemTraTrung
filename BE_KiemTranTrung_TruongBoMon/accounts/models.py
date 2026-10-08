from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
	use_in_migrations = True

	def create_user(self, username, password=None, **extra_fields):
		if not username:
			raise ValueError("Username không được để trống.")
		user = self.model(username=username, **extra_fields)
		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, username, password=None, **extra_fields):
		extra_fields.pop("is_staff", None)
		extra_fields.pop("is_superuser", None)
		extra_fields.setdefault("role", User.Role.ADMIN)
		extra_fields.setdefault("is_active", True)
		return self.create_user(username, password, **extra_fields)


class User(AbstractBaseUser):
	class Role(models.TextChoices):
		ADMIN = "ADMIN", "Quản trị viên"
		HEAD_OF_DEPARTMENT = "HEAD_DEPARTMENT", "Trưởng bộ môn"
		LECTURER = "LECTURER", "Giảng viên"
		STUDENT = "STUDENT", "Sinh viên"

	password = models.CharField(max_length=128, db_column="password_hash")
	last_login = None
	username = models.CharField(max_length=100, unique=True)
	role = models.CharField(
		max_length=30,
		choices=Role.choices,
		default=Role.STUDENT,
	)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	objects = UserManager()

	USERNAME_FIELD = "username"
	REQUIRED_FIELDS = []

	class Meta:
		db_table = "users"
		managed = False

	@property
	def is_staff(self):
		return self.role == self.Role.ADMIN

	@property
	def is_superuser(self):
		return self.role == self.Role.ADMIN

	def has_perm(self, perm, obj=None):
		return self.is_staff

	def has_module_perms(self, app_label):
		return self.is_staff

	def _profile(self):
		if self.role in {self.Role.LECTURER, self.Role.HEAD_OF_DEPARTMENT}:
			return getattr(self, "lecturer_profile", None)
		if self.role == self.Role.STUDENT:
			return getattr(self, "student_profile", None)
		return None

	@property
	def full_name(self):
		profile = self._profile()
		return profile.full_name if profile else self.username

	@property
	def email(self):
		profile = self._profile()
		return getattr(profile, "email", None) if profile else None

	@property
	def phone(self):
		profile = self._profile()
		return getattr(profile, "phone", None) if profile else None

	def get_full_name(self):
		return self.full_name

	def get_short_name(self):
		return self.full_name

	def __str__(self):
		return self.username
