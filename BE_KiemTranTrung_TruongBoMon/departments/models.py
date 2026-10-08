from django.db import models


class Department(models.Model):
	code = models.CharField(max_length=30, unique=True)
	name = models.CharField(max_length=200)
	description = models.TextField(blank=True)
	created_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		db_table = "departments"
		managed = False
		ordering = ["name"]

	def __str__(self):
		return self.name
