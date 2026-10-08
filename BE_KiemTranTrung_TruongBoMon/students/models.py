from django.conf import settings
from django.db import models


class Student(models.Model):
	class Status(models.TextChoices):
		ACTIVE = "ACTIVE", "Đang học"
		GRADUATED = "GRADUATED", "Đã tốt nghiệp"
		SUSPENDED = "SUSPENDED", "Tạm dừng"
		DROPPED_OUT = "DROPPED_OUT", "Đã thôi học"

	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		null=True,
		blank=True,
		related_name="student_profile",
	)
	student_code = models.CharField(max_length=30, unique=True)
	full_name = models.CharField(max_length=255)
	email = models.EmailField(max_length=255, blank=True, null=True)
	phone = models.CharField(max_length=20, blank=True, null=True)
	date_of_birth = models.DateField(blank=True, null=True)
	gender = models.CharField(max_length=30, blank=True, null=True)
	cohort = models.ForeignKey(
		"students.Cohort",
		on_delete=models.PROTECT,
		related_name="students",
	)
	academic_year = models.ForeignKey(
		"academic.AcademicYear",
		on_delete=models.PROTECT,
		related_name="students",
		null=True,
		blank=True,
	)
	major = models.ForeignKey(
		"majors.Major",
		on_delete=models.PROTECT,
		related_name="students",
	)
	class_name = models.CharField(max_length=100, blank=True, null=True)
	status = models.CharField(
		max_length=30,
		choices=Status.choices,
		default=Status.ACTIVE,
		blank=True,
		null=True,
	)
	created_at = models.DateTimeField(blank=True, null=True)
	updated_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "students"
		managed = False

	def __str__(self):
		return self.student_code


class Cohort(models.Model):
	code = models.CharField(max_length=30, unique=True)
	name = models.CharField(max_length=100)
	enrollment_year = models.PositiveSmallIntegerField()
	graduation_year = models.PositiveSmallIntegerField(blank=True, null=True)
	major = models.ForeignKey(
		"majors.Major",
		on_delete=models.PROTECT,
		related_name="cohorts",
	)

	class Meta:
		db_table = "cohorts"
		managed = False
		ordering = ["-enrollment_year", "name"]

	def __str__(self):
		return self.name
