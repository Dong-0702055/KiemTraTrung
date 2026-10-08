from django.db import models


class AcademicYear(models.Model):
	name = models.CharField(max_length=30, unique=True)
	start_date = models.DateField(null=True, blank=True)
	end_date = models.DateField(null=True, blank=True)
	is_active = models.BooleanField(default=False, null=True, blank=True)

	class Meta:
		db_table = "academic_years"
		managed = False
		ordering = ["-start_date"]

	def __str__(self):
		return self.name


class Semester(models.Model):
	semester_number = models.PositiveSmallIntegerField()
	name = models.CharField(max_length=50, blank=True, null=True)
	academic_year = models.ForeignKey(
		AcademicYear,
		on_delete=models.PROTECT,
		related_name="semesters",
	)
	start_date = models.DateField(null=True, blank=True)
	end_date = models.DateField(null=True, blank=True)

	class Meta:
		db_table = "semesters"
		managed = False
		ordering = ["-start_date"]

	def __str__(self):
		return f"{self.name or self.semester_number} - {self.academic_year.name}"
