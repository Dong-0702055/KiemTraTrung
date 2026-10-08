from django.db import models


class Major(models.Model):
	code = models.CharField(max_length=30, unique=True)
	name = models.CharField(max_length=200)
	department = models.ForeignKey(
		"departments.Department",
		on_delete=models.PROTECT,
		related_name="majors",
	)
	description = models.TextField(blank=True, null=True)
	created_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		db_table = "majors"
		managed = False
		ordering = ["name"]

	def __str__(self):
		return self.name
