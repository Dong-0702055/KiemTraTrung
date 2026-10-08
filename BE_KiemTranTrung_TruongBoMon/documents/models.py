from django.conf import settings
from django.db import models


class Document(models.Model):
	class FileType(models.TextChoices):
		PDF = "PDF", "PDF"
		DOCX = "DOCX", "Word DOCX"
		DOC = "DOC", "Word DOC"

	topic = models.ForeignKey(
		"topics.Topic",
		on_delete=models.CASCADE,
		related_name="documents",
	)
	file_name = models.CharField(max_length=255)
	file_path = models.TextField(blank=True, null=True)
	file_type = models.CharField(
		max_length=100, choices=FileType.choices, blank=True, null=True
	)
	file_size = models.BigIntegerField(blank=True, null=True)
	extracted_text = models.TextField(blank=True, null=True)
	uploaded_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="uploaded_documents",
	)
	created_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "documents"
		managed = False
		ordering = ["-created_at"]

	def __str__(self):
		return self.file_name


class DocumentSection(models.Model):
	class SectionType(models.TextChoices):
		INTRODUCTION = "INTRODUCTION", "Mở đầu"
		THEORY = "THEORY", "Cơ sở lý thuyết"
		ANALYSIS = "ANALYSIS", "Phân tích"
		DESIGN = "DESIGN", "Thiết kế"
		IMPLEMENTATION = "IMPLEMENTATION", "Triển khai"
		RESULT = "RESULT", "Kết quả"
		CONCLUSION = "CONCLUSION", "Kết luận"
		REFERENCE = "REFERENCE", "Tài liệu tham khảo"
		OTHER = "OTHER", "Khác"

	document = models.ForeignKey(
		Document,
		on_delete=models.CASCADE,
		related_name="sections",
	)
	section_order = models.PositiveIntegerField()
	section_title = models.TextField(blank=True, null=True)
	section_type = models.CharField(
		max_length=100, choices=SectionType.choices, blank=True, null=True
	)
	content = models.TextField()
	page_start = models.PositiveIntegerField(blank=True, null=True)
	page_end = models.PositiveIntegerField(blank=True, null=True)
	created_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		db_table = "document_sections"
		managed = False
		ordering = ["section_order"]
