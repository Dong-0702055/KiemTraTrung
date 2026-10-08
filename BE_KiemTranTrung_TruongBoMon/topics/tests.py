from django.test import SimpleTestCase

from accounts.models import User
from academic.models import AcademicYear, Semester
from approvals.models import TopicApproval
from departments.models import Department
from documents.models import Document, DocumentSection
from lecturers.models import Lecturer
from majors.models import Major
from similarity.models import SimilarityCheck
from students.models import Cohort, Student
from topics.models import (
	Technology,
	Topic,
	TopicDocument,
	TopicEmbedding,
	TopicFunction,
	TopicGroup,
	TopicGroupMember,
	TopicLecturer,
	TopicTechnology,
)


class LegacyDatabaseMappingTests(SimpleTestCase):
	def test_models_point_to_existing_database_tables(self):
		models = (
			User,
			AcademicYear,
			Semester,
			TopicApproval,
			Department,
			Document,
			DocumentSection,
			Lecturer,
			Major,
			SimilarityCheck,
			Cohort,
			Student,
			Topic,
			TopicGroup,
			TopicGroupMember,
			TopicLecturer,
			Technology,
			TopicTechnology,
			TopicFunction,
			TopicDocument,
			TopicEmbedding,
		)

		for model in models:
			with self.subTest(model=model.__name__):
				self.assertEqual(model._meta.managed, False)
				self.assertTrue(model._meta.db_table)

	def test_user_password_maps_to_existing_password_hash_column(self):
		self.assertEqual(
			User._meta.get_field("password").db_column,
			"password_hash",
		)

	def test_topic_maps_to_existing_topics_table(self):
		self.assertEqual(Topic._meta.db_table, "topics")
		self.assertEqual(Topic._meta.get_field("created_by").db_column, "created_by")

	def test_additional_topic_models_map_to_existing_tables(self):
		expected_tables = {
			Technology: "technologies",
			TopicTechnology: "topic_technologies",
			TopicFunction: "topic_functions",
			TopicDocument: "topic_documents",
			TopicEmbedding: "topic_embeddings",
		}

		for model, table_name in expected_tables.items():
			with self.subTest(model=model.__name__):
				self.assertEqual(model._meta.db_table, table_name)
				self.assertFalse(model._meta.managed)

		self.assertEqual(
			TopicTechnology._meta.pk.field_names,
			("topic_id", "technology_id"),
		)
