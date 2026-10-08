from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone

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
    TopicFunction,
    TopicGroup,
    TopicGroupMember,
    TopicLecturer,
    TopicTechnology,
)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True, allow_null=True)
    phone = serializers.CharField(read_only=True, allow_null=True)
    lecturer_profile = serializers.SerializerMethodField()

    def get_lecturer_profile(self, user):
        if user.role not in {User.Role.LECTURER, User.Role.HEAD_OF_DEPARTMENT}:
            return None
        profile = user._profile()
        if profile is None:
            return None
        return LecturerLoginProfileSerializer(profile).data

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "full_name",
            "email",
            "phone",
            "lecturer_profile",
            "role",
            "is_active",
            "password",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "Trường này bắt buộc."})
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class LecturerLoginProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Lecturer
        fields = (
            "id",
            "lecturer_code",
            "full_name",
            "email",
            "phone",
            "department",
            "department_name",
            "academic_degree",
            "specialization",
            "is_active",
        )
        read_only_fields = fields


class LoginTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"
        read_only_fields = ("id", "created_at")


class MajorSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Major
        fields = (
            "id",
            "code",
            "name",
            "department",
            "department_name",
            "description",
            "created_at",
        )
        read_only_fields = ("id",)


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"
        read_only_fields = ("id",)


class SemesterSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )

    class Meta:
        model = Semester
        fields = (
            "id",
            "name",
            "semester_number",
            "academic_year",
            "academic_year_name",
            "start_date",
            "end_date",
        )
        read_only_fields = ("id",)


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user",
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    major_name = serializers.CharField(source="major.name", read_only=True)
    cohort_name = serializers.CharField(source="cohort.name", read_only=True)
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True, allow_null=True
    )

    class Meta:
        model = Student
        fields = (
            "id",
            "user",
            "user_id",
            "student_code",
            "full_name",
            "email",
            "phone",
            "date_of_birth",
            "gender",
            "major",
            "major_name",
            "cohort",
            "cohort_name",
            "academic_year",
            "academic_year_name",
            "class_name",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class LecturerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Lecturer
        fields = (
            "id",
            "user",
            "user_id",
            "lecturer_code",
            "full_name",
            "email",
            "phone",
            "department",
            "department_name",
            "academic_degree",
            "specialization",
            "is_active",
        )
        read_only_fields = ("id",)


class TopicSerializer(serializers.ModelSerializer):
    lecturer_name = serializers.CharField(source="lecturer.full_name", read_only=True)
    major_name = serializers.CharField(source="major.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    semester_name = serializers.CharField(
        source="semester.name", read_only=True, allow_null=True
    )
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    active_students = serializers.SerializerMethodField()
    student_assignments = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = (
            "id",
            "topic_code",
            "title",
            "normalized_title",
            "description",
            "keywords",
            "field",
            "project_type",
            "architecture",
            "lecturer",
            "lecturer_name",
            "major",
            "major_name",
            "department",
            "department_name",
            "academic_year",
            "academic_year_name",
            "semester",
            "semester_name",
            "status",
            "created_by",
            "created_by_name",
            "active_students",
            "student_assignments",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "status", "created_by", "created_at", "updated_at")

    def _get_student_assignments(self, topic):
        assignments = getattr(topic, "_prefetched_objects_cache", {}).get(
            "topic_students"
        )
        if assignments is None:
            assignments = topic.topic_students.select_related(
                "student", "lecturer", "academic_year"
            ).all()
        return [{
                "student_id": assignment.student_id,
                "student_name": assignment.student.full_name,
                "student_code": assignment.student.student_code,
                "lecturer_id": assignment.lecturer_id,
                "lecturer_name": (
                    assignment.lecturer.full_name if assignment.lecturer else None
                ),
                "assigned_at": assignment.assigned_at,
                "status": assignment.status,
                "academic_year_id": assignment.academic_year_id,
                "academic_year_name": (
                    assignment.academic_year.name if assignment.academic_year else None
                ),
            }
            for assignment in assignments]

    def get_active_students(self, topic):
        return [
            assignment
            for assignment in self._get_student_assignments(topic)
            if assignment["status"] == "ACTIVE"
        ]

    def get_student_assignments(self, topic):
        return self._get_student_assignments(topic)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        academic_year = attrs.get(
            "academic_year",
            getattr(self.instance, "academic_year", None),
        )
        semester = attrs.get("semester", getattr(self.instance, "semester", None))
        if (
            ("semester" in attrs or "academic_year" in attrs)
            and semester
            and (
                not academic_year
                or semester.academic_year_id != academic_year.id
            )
        ):
            raise serializers.ValidationError(
                {"semester": "Học kỳ phải thuộc năm học đã chọn."}
            )
        return attrs


class TechnologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Technology
        fields = ("id", "name", "category", "description", "created_at")
        read_only_fields = ("id", "created_at")


class TopicTechnologySerializer(serializers.ModelSerializer):
    technology_name = serializers.CharField(source="technology.name", read_only=True)
    technology_category = serializers.CharField(
        source="technology.category", read_only=True
    )

    class Meta:
        model = TopicTechnology
        fields = (
            "topic",
            "technology",
            "technology_name",
            "technology_category",
            "is_primary",
            "created_at",
        )
        read_only_fields = ("created_at",)

    def create(self, validated_data):
        topic = validated_data.pop("topic")
        technology = validated_data.pop("technology")
        assignment, _ = TopicTechnology.objects.update_or_create(
            topic=topic,
            technology=technology,
            defaults={**validated_data, "created_at": timezone.now()},
        )
        return assignment


class TopicFunctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicFunction
        fields = ("id", "topic", "function_name", "description", "created_at")
        read_only_fields = ("id", "created_at")


class TopicDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicDocument
        fields = (
            "id",
            "topic",
            "file_name",
            "file_path",
            "file_type",
            "file_size",
            "uploaded_by",
            "uploaded_at",
        )
        read_only_fields = ("id", "uploaded_by", "uploaded_at")


class TopicApprovalSerializer(serializers.ModelSerializer):
    topic_title = serializers.CharField(source="topic.title", read_only=True)
    topic_code = serializers.CharField(
        source="topic.topic_code", read_only=True, allow_null=True
    )
    approver_name = serializers.CharField(
        source="approver.full_name", read_only=True
    )

    class Meta:
        model = TopicApproval
        fields = "__all__"
        read_only_fields = ("id", "approver", "created_at")


class SimilarityCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimilarityCheck
        fields = (
            "id",
            "source_topic",
            "compared_topic",
            "input_title",
            "compared_title",
            "similarity_score",
            "similarity_percent",
            "similarity_level",
            "model_name",
            "created_at",
        )
        read_only_fields = fields


class SimilarityRequestSerializer(serializers.Serializer):
    title = serializers.CharField(min_length=1, max_length=1000, trim_whitespace=True)
    top_k = serializers.IntegerField(min_value=1, max_value=100, default=10)
    source_topic_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_title(self, value):
        if not value:
            raise serializers.ValidationError("Tên đề tài không được để trống.")
        return value


class ReviewSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=TopicApproval.Action.choices)
    comment = serializers.CharField(required=False, allow_blank=True)


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.full_name", read_only=True
    )

    class Meta:
        model = Document
        fields = (
            "id",
            "topic",
            "uploaded_by",
            "uploaded_by_name",
            "file_name",
            "file_path",
            "file_type",
            "file_size",
            "extracted_text",
            "created_at",
        )
        read_only_fields = ("id", "uploaded_by", "created_at")


class CohortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohort
        fields = "__all__"


class TopicGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicGroup
        fields = "__all__"


class TopicGroupMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicGroupMember
        fields = "__all__"


class TopicLecturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicLecturer
        fields = "__all__"


class DocumentSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentSection
        fields = "__all__"
