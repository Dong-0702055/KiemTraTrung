"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .api_views import (
    AcademicYearViewSet,
    CohortViewSet,
    DepartmentViewSet,
    DocumentViewSet,
    DocumentSectionViewSet,
    HealthView,
    LecturerViewSet,
    LoginTokenView,
    MajorViewSet,
    MeView,
    SimilarityCheckViewSet,
    StudentViewSet,
    TechnologyViewSet,
    TopicApprovalViewSet,
    TopicDocumentViewSet,
    TopicFunctionViewSet,
    TopicGroupMemberViewSet,
    TopicGroupViewSet,
    TopicLecturerViewSet,
    TopicTechnologyViewSet,
    TopicViewSet,
    AdminUserViewSet,
    SemesterViewSet,
)

router = DefaultRouter()
router.register("users", AdminUserViewSet)
router.register("departments", DepartmentViewSet)
router.register("majors", MajorViewSet)
router.register("academic-years", AcademicYearViewSet)
router.register("semesters", SemesterViewSet)
router.register("cohorts", CohortViewSet)
router.register("students", StudentViewSet)
router.register("lecturers", LecturerViewSet)
router.register("technologies", TechnologyViewSet)
router.register("topics", TopicViewSet)
router.register("topic-groups", TopicGroupViewSet)
router.register("topic-group-members", TopicGroupMemberViewSet)
router.register("topic-lecturers", TopicLecturerViewSet)
router.register("topic-technologies", TopicTechnologyViewSet, basename="topic-technology")
router.register("topic-functions", TopicFunctionViewSet, basename="topic-function")
router.register("topic-documents", TopicDocumentViewSet, basename="topic-document")
router.register("approvals", TopicApprovalViewSet, basename="approval")
router.register("similarity/checks", SimilarityCheckViewSet, basename="similarity-check")
router.register("documents", DocumentViewSet, basename="document")
router.register("document-sections", DocumentSectionViewSet, basename="document-section")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", HealthView.as_view(), name="health"),
    path("api/v1/auth/token/", LoginTokenView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/me/", MeView.as_view(), name="current_user"),
    path("api/v1/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
