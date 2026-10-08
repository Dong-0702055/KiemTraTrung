from django.conf import settings
from django.db import models


class Lecturer(models.Model):
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="lecturer_profile",
	)
	lecturer_code = models.CharField(max_length=30, unique=True)
	full_name = models.CharField(max_length=255)
	email = models.EmailField(max_length=255, blank=True, null=True)
	phone = models.CharField(max_length=20, blank=True, null=True)
	department = models.ForeignKey(
		"departments.Department",
		on_delete=models.PROTECT,
		related_name="lecturers",
	)
	academic_degree = models.CharField(max_length=100, blank=True, null=True)
	specialization = models.TextField(blank=True, null=True)
	is_active = models.BooleanField(default=True, null=True, blank=True)
	created_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "lecturers"
		managed = False

	def __str__(self):
		return self.lecturer_code
