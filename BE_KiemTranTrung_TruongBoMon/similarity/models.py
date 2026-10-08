from django.conf import settings
from django.db import models


class SimilarityCheck(models.Model):
	class Level(models.TextChoices):
		NORMAL = "NORMAL", "Bình thường"
		REVIEW = "REVIEW", "Cần xem xét"
		HIGH = "HIGH", "Tương đồng cao"
		POSSIBLE_DUPLICATE = "POSSIBLE_DUPLICATE", "Có khả năng trùng"

	source_topic = models.ForeignKey(
		"topics.Topic",
		on_delete=models.SET_NULL,
		db_column="source_topic_id",
		related_name="similarity_checks_as_source",
		null=True,
		blank=True,
	)
	compared_topic = models.ForeignKey(
		"topics.Topic",
		on_delete=models.SET_NULL,
		db_column="compared_topic_id",
		related_name="similarity_checks_as_compared",
		null=True,
		blank=True,
	)
	input_title = models.TextField()
	compared_title = models.TextField()
	similarity_score = models.DecimalField(max_digits=9, decimal_places=6)
	similarity_percent = models.GeneratedField(
		expression=models.F("similarity_score") * 100,
		output_field=models.DecimalField(max_digits=7, decimal_places=2),
		db_persist=True,
	)
	similarity_level = models.CharField(
		max_length=100, choices=Level.choices, null=True, blank=True
	)
	model_name = models.CharField(max_length=100, null=True, blank=True)
	created_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		db_table = "similarity_checks"
		managed = False
		ordering = ["-created_at"]
