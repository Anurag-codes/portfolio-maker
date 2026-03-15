from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Public
    path('portfolio/', views.public_portfolio, name='public-portfolio'),

    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', views.me, name='me'),

    # Admin – Profile
    path('admin/profile/', views.AdminProfileView.as_view(), name='admin-profile'),

    # Admin – Career
    path('admin/career/', views.AdminCareerListCreate.as_view(), name='admin-career-list'),
    path('admin/career/<int:pk>/', views.AdminCareerDetail.as_view(), name='admin-career-detail'),

    # Admin – Projects
    path('admin/projects/', views.AdminProjectListCreate.as_view(), name='admin-project-list'),
    path('admin/projects/<int:pk>/', views.AdminProjectDetail.as_view(), name='admin-project-detail'),

    # Admin – What I Do
    path('admin/whatido/', views.AdminWhatIDoListCreate.as_view(), name='admin-whatido-list'),
    path('admin/whatido/<int:pk>/', views.AdminWhatIDoDetail.as_view(), name='admin-whatido-detail'),

    # Admin – Tech Stack
    path('admin/techstack/', views.AdminTechStackListCreate.as_view(), name='admin-techstack-list'),
    path('admin/techstack/<int:pk>/', views.AdminTechStackDetail.as_view(), name='admin-techstack-detail'),

    # Admin – Resume (parse, upload, generate)
    path('admin/resume/parse/', views.ResumeParseView.as_view(), name='admin-resume-parse'),
    path('admin/resume/upload/', views.ResumeUploadView.as_view(), name='admin-resume-upload'),
    path('admin/resume/generate/', views.ResumeGenerateView.as_view(), name='admin-resume-generate'),

    # Admin – Education
    path('admin/education/', views.AdminEducationListCreate.as_view(), name='admin-education-list'),
    path('admin/education/<int:pk>/', views.AdminEducationDetail.as_view(), name='admin-education-detail'),

    # Admin – Certifications
    path('admin/certifications/', views.AdminCertificationListCreate.as_view(), name='admin-cert-list'),
    path('admin/certifications/<int:pk>/', views.AdminCertificationDetail.as_view(), name='admin-cert-detail'),

    # Admin – Achievements
    path('admin/achievements/', views.AdminAchievementListCreate.as_view(), name='admin-achievement-list'),
    path('admin/achievements/<int:pk>/', views.AdminAchievementDetail.as_view(), name='admin-achievement-detail'),

    # Admin – Personal Projects
    path('admin/personal-projects/', views.AdminPersonalProjectListCreate.as_view(), name='admin-personal-project-list'),
    path('admin/personal-projects/<int:pk>/', views.AdminPersonalProjectDetail.as_view(), name='admin-personal-project-detail'),
]
