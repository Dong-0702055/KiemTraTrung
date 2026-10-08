from django.conf import settings
from django.db import models


class Topic(models.Model):
	class Status(models.TextChoices):
		DRAFT = "DRAFT", "Bản nháp"
		SUBMITTED = "SUBMITTED", "Đã gửi"
		UNDER_REVIEW = "UNDER_REVIEW", "Đang xét duyệt"
		APPROVED = "APPROVED", "Đã duyệt"
		REJECTED = "REJECTED", "Từ chối"
		REVISION_REQUIRED = "REVISION_REQUIRED", "Yêu cầu chỉnh sửa"
		CANCELLED = "CANCELLED", "Đã hủy"

	topic_code = models.CharField(max_length=50, blank=True, null=True)
	title = models.TextField()
	normalized_title = models.TextField(blank=True, null=True)
	description = models.TextField(blank=True, null=True)
	keywords = models.TextField(blank=True, null=True)
	field = models.CharField(max_length=255, blank=True, null=True)
	project_type = models.CharField(max_length=50, blank=True, null=True)
	architecture = models.CharField(max_length=100, blank=True, null=True)
	lecturer = models.ForeignKey(
		"lecturers.Lecturer",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="topics",
	)
	department = models.ForeignKey(
		"departments.Department",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="topics",
	)
	major = models.ForeignKey(
		"majors.Major",
		on_delete=models.PROTECT,
		null=True,
		blank=True,
		related_name="topics",
	)
	academic_year = models.ForeignKey(
		"academic.AcademicYear",
		on_delete=models.PROTECT,
		null=True,
		blank=True,
		related_name="topics",
	)
	semester = models.ForeignKey(
		"academic.Semester",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="topics",
	)
	status = models.CharField(
		max_length=30,
		choices=Status.choices,
		default=Status.DRAFT,
	)
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		db_column="created_by",
		null=True,
		blank=True,
		related_name="created_topics",
	)
	created_at = models.DateTimeField(null=True, blank=True)
	updated_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		db_table = "topics"
		managed = False
		ordering = ["-created_at"]

	def __str__(self):
		return self.title


class TopicStudent(models.Model):
	pk = models.CompositePrimaryKey("topic_id", "student_id")
	topic = models.ForeignKey(
		Topic,
		on_delete=models.CASCADE,
		related_name="topic_students",
	)
	student = models.ForeignKey(
		"students.Student",
		on_delete=models.CASCADE,
		related_name="topic_assignments",
	)
	assigned_at = models.DateTimeField(blank=True, null=True)
	status = models.CharField(max_length=30, default="ACTIVE")
	lecturer = models.ForeignKey(
		"lecturers.Lecturer",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
	)
	academic_year = models.ForeignKey(
		"academic.AcademicYear",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
	)

	class Meta:
		db_table = "topic_students"
		managed = False


class TopicGroup(models.Model):
	topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="groups")
	group_name = models.CharField(max_length=255, blank=True, null=True)
	group_code = models.CharField(max_length=100, blank=True, null=True)
	created_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "topic_groups"
		managed = False


class TopicGroupMember(models.Model):
	class Role(models.TextChoices):
		LEADER = "LEADER", "Nhóm trưởng"
		MEMBER = "MEMBER", "Thành viên"

	group = models.ForeignKey(
		TopicGroup, on_delete=models.CASCADE, related_name="members"
	)
	student = models.ForeignKey(
		"students.Student", on_delete=models.CASCADE, related_name="group_memberships"
	)
	role = models.CharField(max_length=100, choices=Role.choices, blank=True, null=True)
	joined_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "topic_group_members"
		managed = False


class TopicLecturer(models.Model):
	class Role(models.TextChoices):
		SUPERVISOR = "SUPERVISOR", "Giảng viên hướng dẫn"
		CO_SUPERVISOR = "CO_SUPERVISOR", "Đồng hướng dẫn"

	topic = models.ForeignKey(
		Topic, on_delete=models.CASCADE, related_name="lecturer_assignments"
	)
	lecturer = models.ForeignKey(
		"lecturers.Lecturer", on_delete=models.CASCADE, related_name="topic_assignments"
	)
	role = models.CharField(max_length=100, choices=Role.choices, blank=True, null=True)

	class Meta:
		db_table = "topic_lecturers"
		managed = False


class Technology(models.Model):
	name = models.CharField(max_length=100, unique=True)
	category = models.CharField(max_length=50)
	description = models.TextField(blank=True, null=True)
	created_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "technologies"
		managed = False
		ordering = ["category", "name"]

	def __str__(self):
		return self.name


class TopicTechnology(models.Model):
	pk = models.CompositePrimaryKey("topic_id", "technology_id")
	topic = models.ForeignKey(
		Topic,
		on_delete=models.CASCADE,
		related_name="technology_assignments",
	)
	technology = models.ForeignKey(
		Technology,
		on_delete=models.CASCADE,
		related_name="topic_assignments",
	)
	is_primary = models.BooleanField(blank=True, null=True)
	created_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "topic_technologies"
		managed = False


class TopicFunction(models.Model):
	topic = models.ForeignKey(
		Topic,
		on_delete=models.CASCADE,
		related_name="functions",
	)
	function_name = models.CharField(max_length=255)
	description = models.TextField(blank=True, null=True)
	created_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "topic_functions"
		managed = False
		ordering = ["id"]


class TopicDocument(models.Model):
	topic = models.ForeignKey(
		Topic,
		on_delete=models.CASCADE,
		related_name="topic_documents",
	)
	file_name = models.CharField(max_length=255)
	file_path = models.TextField(blank=True, null=True)
	file_type = models.CharField(max_length=20, blank=True, null=True)
	file_size = models.BigIntegerField(blank=True, null=True)
	uploaded_by = models.BigIntegerField(blank=True, null=True)
	uploaded_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "topic_documents"
		managed = False
		ordering = ["-uploaded_at"]


class TopicEmbedding(models.Model):
	topic = models.OneToOneField(
		Topic,
		on_delete=models.CASCADE,
		related_name="embedding_cache",
	)
	model_name = models.CharField(max_length=255)
	embedding = models.TextField()
	created_at = models.DateTimeField(blank=True, null=True)
	updated_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "topic_embeddings"
		managed = False
