from django.conf import settings
from django.db import models


class TopicApproval(models.Model):
	class Action(models.TextChoices):
		APPROVE = "APPROVE", "Duyệt"
		REJECT = "REJECT", "Từ chối"
		REQUEST_REVISION = "REQUEST_REVISION", "Yêu cầu chỉnh sửa"

	topic = models.ForeignKey(
		"topics.Topic",
		on_delete=models.CASCADE,
		related_name="approvals",
	)
	approver = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		db_column="approver_id",
		related_name="topic_approvals",
	)
	action = models.CharField(max_length=30, choices=Action.choices)
	comment = models.TextField(blank=True, null=True)
	created_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "topic_approvals"
		managed = True
		ordering = ["-created_at"]

	def __str__(self):
		return f"{self.topic_id}: {self.action}"
