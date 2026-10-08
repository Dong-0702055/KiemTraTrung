import os
import json
import math

import requests
from django.conf import settings
from django.db import transaction
from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView

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
    TopicStudent,
    TopicTechnology,
)
from .serializers import (
    AcademicYearSerializer,
    CohortSerializer,
    DepartmentSerializer,
    DocumentSerializer,
    DocumentSectionSerializer,
    LecturerSerializer,
    LoginTokenSerializer,
    MajorSerializer,
    ReviewSerializer,
    SemesterSerializer,
    SimilarityCheckSerializer,
    SimilarityRequestSerializer,
    StudentSerializer,
    TechnologySerializer,
    TopicApprovalSerializer,
    TopicDocumentSerializer,
    TopicFunctionSerializer,
    TopicGroupMemberSerializer,
    TopicGroupSerializer,
    TopicLecturerSerializer,
    TopicSerializer,
    TopicTechnologySerializer,
    UserSerializer,
)
from .file_title_extraction import (
    MAX_UPLOAD_SIZE,
    FileExtractionError,
    extract_document_text,
    find_title_candidates,
)


def has_full_api_access(user):
    return user.is_authenticated and (
        user.is_staff
        or user.role in {User.Role.ADMIN, User.Role.HEAD_OF_DEPARTMENT}
    )


def is_reviewer(user):
    return has_full_api_access(user)


def visible_topics_for(user):
    queryset = Topic.objects.all()
    if has_full_api_access(user):
        return queryset
    if user.role == User.Role.STUDENT:
        return queryset.filter(
            Q(status=Topic.Status.APPROVED)
            | Q(created_by=user)
            | Q(groups__members__student__user=user)
        ).distinct()
    if user.role == User.Role.LECTURER:
        return queryset.filter(
            Q(created_by=user)
            | Q(lecturer__user=user)
            | Q(lecturer_assignments__lecturer__user=user)
        ).distinct()
    return queryset.none()


class AdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.method in ("GET", "HEAD", "OPTIONS")
                or has_full_api_access(request.user)
            )
        )


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_permissions(self):
        return [IsAuthenticated(), AdminOrDepartmentHeadOnly()]


class AdminOrDepartmentHeadOnly(BasePermission):
    def has_permission(self, request, view):
        return has_full_api_access(request.user)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LoginTokenView(TokenObtainPairView):
    serializer_class = LoginTokenSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = (AdminOrReadOnly,)


class MajorViewSet(viewsets.ModelViewSet):
    queryset = Major.objects.select_related("department").all()
    serializer_class = MajorSerializer
    permission_classes = (AdminOrReadOnly,)


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = (AdminOrReadOnly,)


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.select_related("academic_year").all()
    serializer_class = SemesterSerializer
    permission_classes = (AdminOrReadOnly,)


class CohortViewSet(viewsets.ModelViewSet):
    queryset = Cohort.objects.select_related("major").all()
    serializer_class = CohortSerializer
    permission_classes = (AdminOrReadOnly,)


class TopicGroupViewSet(viewsets.ModelViewSet):
    queryset = TopicGroup.objects.select_related("topic").order_by("id")
    serializer_class = TopicGroupSerializer
    permission_classes = (AdminOrReadOnly,)


class TopicGroupMemberViewSet(viewsets.ModelViewSet):
    queryset = TopicGroupMember.objects.select_related("group", "student").order_by("id")
    serializer_class = TopicGroupMemberSerializer
    permission_classes = (AdminOrReadOnly,)


class TopicLecturerViewSet(viewsets.ModelViewSet):
    queryset = TopicLecturer.objects.select_related("topic", "lecturer").order_by("id")
    serializer_class = TopicLecturerSerializer
    permission_classes = (AdminOrReadOnly,)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related(
        "user", "major", "cohort", "academic_year"
    ).order_by("id")
    serializer_class = StudentSerializer
    permission_classes = (AdminOrReadOnly,)

    def get_queryset(self):
        if has_full_api_access(self.request.user):
            return self.queryset
        return self.queryset.filter(user=self.request.user)


class LecturerViewSet(viewsets.ModelViewSet):
    queryset = Lecturer.objects.select_related("user", "department").order_by("id")
    serializer_class = LecturerSerializer
    permission_classes = (AdminOrReadOnly,)

    def get_queryset(self):
        if has_full_api_access(self.request.user):
            return self.queryset
        return self.queryset.filter(user=self.request.user)


class TopicAccessPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if view.action == "review":
            return is_reviewer(request.user)
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        if has_full_api_access(request.user):
            return True
        if view.action == "create":
            return request.user.role in {
                User.Role.ADMIN,
                User.Role.HEAD_OF_DEPARTMENT,
                User.Role.LECTURER,
                User.Role.STUDENT,
            } or request.user.is_staff
        if view.action == "submit":
            return request.user.role in {
                User.Role.ADMIN,
                User.Role.STUDENT,
                User.Role.LECTURER,
            } or request.user.is_staff
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        if view.action == "review":
            return is_reviewer(request.user)
        if has_full_api_access(request.user):
            return True
        return obj.created_by_id == request.user.id


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.select_related(
        "lecturer", "major", "department", "academic_year", "semester", "created_by"
    ).prefetch_related(
        Prefetch(
            "topic_students",
            queryset=TopicStudent.objects.select_related(
                "student", "lecturer", "academic_year"
            ),
        ),
    ).all()
    serializer_class = TopicSerializer
    permission_classes = (TopicAccessPermission,)

    def get_queryset(self):
        if has_full_api_access(self.request.user):
            return self.queryset
        return self.queryset.filter(
            id__in=visible_topics_for(self.request.user).values("id")
        )

    @action(detail=True, methods=["get"])
    def resources(self, request, pk=None):
        topic = self.get_object()
        return Response(
            {
                "technologies": TopicTechnologySerializer(
                    TopicTechnology.objects.filter(topic=topic).select_related(
                        "technology"
                    ),
                    many=True,
                ).data,
                "functions": TopicFunctionSerializer(
                    topic.functions.all(), many=True
                ).data,
                "documents": TopicDocumentSerializer(
                    topic.topic_documents.all(), many=True
                ).data,
                "embedding": {
                    "available": TopicEmbedding.objects.filter(topic=topic).exists(),
                    "model_name": (
                        TopicEmbedding.objects.filter(topic=topic)
                        .values_list("model_name", flat=True)
                        .first()
                    ),
                },
            }
        )

    def perform_create(self, serializer):
        topic_code = serializer.validated_data.get("topic_code")
        if not topic_code:
            topic_code = f"TOP-{timezone.now():%Y%m%d%H%M%S%f}"
        serializer.save(
            created_by=self.request.user,
            topic_code=topic_code,
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )

    def perform_update(self, serializer):
        previous_title = serializer.instance.title
        topic = serializer.save(updated_at=timezone.now())
        if topic.title != previous_title:
            TopicEmbedding.objects.filter(topic=topic).delete()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        topic = self.get_object()
        if not has_full_api_access(request.user) and topic.created_by_id != request.user.id:
            raise PermissionDenied("Bạn không có quyền gửi đề tài này.")
        if topic.status not in {
            Topic.Status.DRAFT,
            Topic.Status.REVISION_REQUIRED,
        }:
            raise ValidationError({"status": "Đề tài không thể gửi duyệt ở trạng thái này."})
        topic.status = Topic.Status.SUBMITTED
        topic.updated_at = timezone.now()
        topic.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(topic).data)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        topic = self.get_object()
        if topic.status not in {
            Topic.Status.SUBMITTED,
            Topic.Status.UNDER_REVIEW,
        }:
            raise ValidationError({"status": "Chỉ có thể duyệt đề tài đang chờ duyệt."})
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        decision = serializer.validated_data["decision"]
        with transaction.atomic():
            TopicApproval.objects.create(
                topic=topic,
                approver=request.user,
                action=decision,
                comment=serializer.validated_data.get("comment", ""),
                created_at=timezone.now(),
            )
            topic.status = {
                TopicApproval.Action.APPROVE: Topic.Status.APPROVED,
                TopicApproval.Action.REJECT: Topic.Status.REJECTED,
                TopicApproval.Action.REQUEST_REVISION: Topic.Status.REVISION_REQUIRED,
            }[decision]
            topic.updated_at = timezone.now()
            topic.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(topic).data)


class TopicApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TopicApprovalSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = TopicApproval.objects.select_related("topic", "approver").all()
        if is_reviewer(self.request.user):
            return queryset
        return queryset.filter(
            Q(topic__created_by=self.request.user)
            | Q(topic__groups__members__student__user=self.request.user)
        ).distinct()


class TechnologyViewSet(viewsets.ModelViewSet):
    queryset = Technology.objects.all()
    serializer_class = TechnologySerializer
    permission_classes = (AdminOrReadOnly,)


class TopicTechnologyViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = TopicTechnologySerializer
    permission_classes = (AdminOrReadOnly,)

    def get_queryset(self):
        queryset = TopicTechnology.objects.select_related(
            "topic", "technology"
        )
        if has_full_api_access(self.request.user):
            return queryset
        return queryset.filter(topic__in=visible_topics_for(self.request.user))

    @action(detail=False, methods=["delete"], url_path="remove")
    def remove(self, request):
        assignment = self.get_queryset().filter(
            topic_id=request.data.get("topic"),
            technology_id=request.data.get("technology"),
        ).first()
        if assignment is None:
            raise ValidationError(
                {"detail": "Không tìm thấy công nghệ được gắn với đề tài."}
            )
        assignment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TopicFunctionViewSet(viewsets.ModelViewSet):
    serializer_class = TopicFunctionSerializer
    permission_classes = (AdminOrReadOnly,)

    def get_queryset(self):
        queryset = TopicFunction.objects.select_related("topic")
        if has_full_api_access(self.request.user):
            return queryset
        return queryset.filter(topic__in=visible_topics_for(self.request.user))


class TopicDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = TopicDocumentSerializer
    permission_classes = (AdminOrReadOnly,)

    def get_queryset(self):
        queryset = TopicDocument.objects.select_related("topic")
        if has_full_api_access(self.request.user):
            return queryset
        return queryset.filter(topic__in=visible_topics_for(self.request.user))

    def perform_create(self, serializer):
        serializer.save(
            uploaded_by_id=self.request.user.id,
            uploaded_at=timezone.now(),
        )


class SimilarityCheckViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SimilarityCheckSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = SimilarityCheck.objects.select_related(
            "source_topic", "compared_topic"
        ).all()
        if has_full_api_access(self.request.user):
            return queryset
        return queryset.filter(source_topic__created_by=self.request.user)

    @action(
        detail=False,
        methods=["post"],
        url_path="extract-file",
        parser_classes=(MultiPartParser, FormParser),
    )
    def extract_file(self, request):
        uploaded_file = request.FILES.get("file")
        if uploaded_file is None:
            raise ValidationError({"file": "Hãy chọn tệp PDF hoặc DOCX."})
        if uploaded_file.size > MAX_UPLOAD_SIZE:
            raise ValidationError({"file": "Tệp vượt quá giới hạn 10 MB."})

        try:
            extracted_text = extract_document_text(uploaded_file)
        except FileExtractionError as error:
            raise ValidationError({"file": str(error)}) from error

        candidates = find_title_candidates(extracted_text)
        if not candidates:
            raise ValidationError(
                {
                    "file": (
                        "Đã đọc được nội dung nhưng chưa nhận diện chắc chắn tên đề tài. "
                        "Hãy nhập tên đề tài thủ công."
                    )
                }
            )
        return Response(
            {
                "file_name": uploaded_file.name,
                "suggested_title": candidates[0]["title"],
                "title_candidates": candidates,
                "extracted_text": extracted_text[:6000],
                "requires_confirmation": True,
            }
        )

    @action(detail=False, methods=["post"])
    def check(self, request):
        serializer = SimilarityRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        title = serializer.validated_data["title"]
        source_topic_id = serializer.validated_data.get("source_topic_id")
        source_topic = None
        if source_topic_id is not None:
            source_topic = Topic.objects.filter(id=source_topic_id).first()
            if source_topic is None:
                raise ValidationError({"source_topic_id": "Không tìm thấy đề tài."})
            if (
                not has_full_api_access(request.user)
                and source_topic.created_by_id != request.user.id
            ):
                raise PermissionDenied("Bạn không có quyền kiểm tra đề tài này.")
        topic_queryset = Topic.objects.filter(
            status=Topic.Status.APPROVED
        ).exclude(title="")
        if source_topic_id is not None:
            topic_queryset = topic_queryset.exclude(id=source_topic_id)
        topics = list(topic_queryset.values("id", "title"))
        embeddings = self._load_candidate_embeddings(topics)
        if isinstance(embeddings, Response):
            return embeddings
        candidates = []
        for topic in topics:
            candidate = {"topic_id": topic["id"], "title": topic["title"]}
            if embeddings is not None:
                candidate["embedding"] = embeddings[topic["id"]]
            candidates.append(candidate)
        try:
            response = requests.post(
                f"{settings.AI_SERVICE_URL}/api/v1/check-title",
                json={
                    "title": title,
                    "top_k": serializer.validated_data["top_k"],
                    "candidates": candidates,
                },
                timeout=60,
            )
            response.raise_for_status()
            result = response.json()
        except requests.RequestException:
            return Response(
                {"detail": "Không thể kết nối AI Service."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except ValueError:
            return Response(
                {"detail": "AI Service trả về dữ liệu không hợp lệ."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not isinstance(result, dict) or not isinstance(result.get("results"), list):
            return Response(
                {"detail": "AI Service trả về dữ liệu không hợp lệ."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        topic_by_id = {str(topic["id"]): topic["id"] for topic in topics}
        ranked_results = result["results"]
        with transaction.atomic():
            checks = SimilarityCheck.objects.bulk_create(
                [
                    SimilarityCheck(
                        source_topic=source_topic,
                        compared_topic_id=topic_by_id.get(str(item.get("topic_id"))),
                        input_title=title,
                        compared_title=str(item.get("title", "")),
                        similarity_score=max(
                            0.0, min(1.0, float(item.get("similarity", 0)))
                        ),
                        similarity_level=(
                            SimilarityCheck.Level.POSSIBLE_DUPLICATE
                            if float(item.get("percent", 0)) >= 85
                            else SimilarityCheck.Level.HIGH
                            if float(item.get("percent", 0)) >= 70
                            else SimilarityCheck.Level.REVIEW
                            if float(item.get("percent", 0)) >= 50
                            else SimilarityCheck.Level.NORMAL
                        ),
                        model_name=os.getenv("AI_MODEL_NAME", "tier1_best.pt"),
                        created_at=timezone.now(),
                    )
                    for item in ranked_results
                ]
            )
        return Response(
            {
                "check_ids": [check.id for check in checks],
                **result,
            },
            status=status.HTTP_200_OK,
        )

    def _load_candidate_embeddings(self, topics):
        model_name = settings.AI_MODEL_NAME
        embedding_by_topic = {}
        cached = TopicEmbedding.objects.filter(
            topic_id__in=[topic["id"] for topic in topics],
            model_name=model_name,
        )
        for record in cached:
            try:
                vector = json.loads(record.embedding)
            except (TypeError, json.JSONDecodeError):
                continue
            if (
                isinstance(vector, list)
                and vector
                and all(
                    isinstance(value, (int, float)) and math.isfinite(value)
                    for value in vector
                )
            ):
                embedding_by_topic[record.topic_id] = vector

        missing_topics = [
            topic for topic in topics if topic["id"] not in embedding_by_topic
        ]
        for start in range(0, len(missing_topics), 500):
            batch = missing_topics[start : start + 500]
            try:
                response = requests.post(
                    f"{settings.AI_SERVICE_URL}/api/v1/encode-titles",
                    json={"titles": [topic["title"] for topic in batch]},
                    timeout=60,
                )
                if response.status_code == status.HTTP_404_NOT_FOUND:
                    return None
                response.raise_for_status()
                payload = response.json()
            except requests.ConnectionError:
                return Response(
                    {"detail": "Không thể kết nối AI Service để tạo embedding."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            except requests.HTTPError as error:
                upstream_status = error.response.status_code if error.response else "?"
                return Response(
                    {
                        "detail": (
                            "AI Service từ chối yêu cầu tạo embedding "
                            f"(HTTP {upstream_status})."
                        )
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            except requests.Timeout:
                return Response(
                    {"detail": "AI Service hết thời gian tạo embedding."},
                    status=status.HTTP_504_GATEWAY_TIMEOUT,
                )
            except requests.RequestException:
                return Response(
                    {"detail": "Yêu cầu tạo embedding tới AI Service thất bại."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            except ValueError:
                return Response(
                    {"detail": "AI Service trả về embedding không hợp lệ."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            vectors = payload.get("embeddings") if isinstance(payload, dict) else None
            response_model = payload.get("model_name") if isinstance(payload, dict) else None
            if (
                response_model != model_name
                or not isinstance(vectors, list)
                or len(vectors) != len(batch)
            ):
                return Response(
                    {
                        "detail": (
                            "Embedding từ AI Service không khớp model hoặc số đề tài."
                        )
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            now = timezone.now()
            for topic, vector in zip(batch, vectors):
                if (
                    not isinstance(vector, list)
                    or not vector
                    or not all(
                        isinstance(value, (int, float)) and math.isfinite(value)
                        for value in vector
                    )
                ):
                    return Response(
                        {"detail": "AI Service trả về vector embedding không hợp lệ."},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )
                serialized_vector = json.dumps(
                    vector, allow_nan=False, separators=(",", ":")
                )
                TopicEmbedding.objects.update_or_create(
                    topic_id=topic["id"],
                    defaults={
                        "model_name": model_name,
                        "embedding": serialized_vector,
                        "updated_at": now,
                    },
                    create_defaults={
                        "model_name": model_name,
                        "embedding": serialized_vector,
                        "created_at": now,
                        "updated_at": now,
                    },
                )
                embedding_by_topic[topic["id"]] = vector

        return embedding_by_topic


class DocumentAccessPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if has_full_api_access(request.user):
            return True
        return (
            obj.uploaded_by_id == request.user.id
            or obj.topic.created_by_id == request.user.id
            or obj.topic.lecturer_id
            and obj.topic.lecturer.user_id == request.user.id
        )


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = (DocumentAccessPermission,)

    def get_queryset(self):
        queryset = Document.objects.select_related(
            "topic__lecturer__user", "topic__created_by", "uploaded_by"
        )
        if has_full_api_access(self.request.user):
            return queryset.all()
        return queryset.filter(
            Q(uploaded_by=self.request.user)
            | Q(topic__created_by=self.request.user)
            | Q(topic__lecturer__user=self.request.user)
            | Q(topic__lecturer_assignments__lecturer__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        topic = serializer.validated_data["topic"]
        user = self.request.user
        allowed = (
            has_full_api_access(user)
            or topic.created_by_id == user.id
            or topic.lecturer_id and topic.lecturer.user_id == user.id
        )
        if not allowed:
            raise PermissionDenied("Bạn không có quyền tải tài liệu lên đề tài này.")
        serializer.save(uploaded_by=user)


class DocumentSectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DocumentSectionSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        queryset = DocumentSection.objects.select_related(
            "document__topic", "document__uploaded_by"
        )
        if has_full_api_access(self.request.user):
            return queryset.all()
        return queryset.filter(
            Q(document__uploaded_by=self.request.user)
            | Q(document__topic__created_by=self.request.user)
            | Q(document__topic__lecturer__user=self.request.user)
        ).distinct()


class HealthView(APIView):
    permission_classes = ()

    def get(self, request):
        return Response({"status": "ok"})
