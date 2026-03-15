from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User

from .models import PortfolioProfile, CareerEntry, Project, WhatIDoSection, TechStackImage, EducationEntry, Certification, Achievement, PersonalProject
from .serializers import (
    PortfolioProfileSerializer,
    PortfolioProfileWriteSerializer,
    CareerEntrySerializer,
    ProjectSerializer,
    WhatIDoSectionSerializer,
    TechStackImageSerializer,
    EducationEntrySerializer,
    CertificationSerializer,
    AchievementSerializer,
    PersonalProjectSerializer,
)


# ─── Public endpoint ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def public_portfolio(request):
    """Return all portfolio data for the first (and only) user."""
    try:
        profile = PortfolioProfile.objects.first()
        if not profile:
            return Response({'detail': 'No portfolio found.'}, status=404)
        serializer = PortfolioProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response({'detail': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_portfolio_by_slug(request, slug):
    """Return portfolio data for a specific user identified by their slug."""
    try:
        profile = PortfolioProfile.objects.get(slug=slug)
    except PortfolioProfile.DoesNotExist:
        return Response({'detail': 'Portfolio not found.'}, status=404)
    serializer = PortfolioProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_portfolio_by_host(request):
    """Return portfolio data matched by the Host header.

    Supports two cases:
      1. Subdomain  — e.g. alice.portfolio.dotdevz.com  (extract 'alice', match slug)
      2. Custom domain — e.g. alice.com                 (match PortfolioProfile.custom_domain)
    The main domain is read from the MAIN_DOMAIN env variable (default: portfolio.dotdevz.com).
    """
    import os
    # X-Custom-Domain is set by nginx for the custom-domain catch-all block
    # so that Django's ALLOWED_HOSTS always sees a trusted Host header, while
    # the real hostname is still available for portfolio lookup.
    host = (
        request.META.get('HTTP_X_CUSTOM_DOMAIN')
        or request.get_host()
    ).split(':')[0].strip()
    main_domain = os.getenv('MAIN_DOMAIN', 'portfolio.dotdevz.com')

    profile = None

    # Case 1 – subdomain of the main domain  (e.g. alice.portfolio.dotdevz.com)
    if host.endswith('.' + main_domain):
        slug = host[:-(len(main_domain) + 1)]
        try:
            profile = PortfolioProfile.objects.get(slug=slug)
        except PortfolioProfile.DoesNotExist:
            pass

    # Case 2 – custom domain
    if profile is None:
        try:
            profile = PortfolioProfile.objects.get(custom_domain=host)
        except PortfolioProfile.DoesNotExist:
            pass

    if profile is None:
        return Response({'detail': 'No portfolio found for this domain.'}, status=404)

    serializer = PortfolioProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken

        username = (request.data.get('username') or '').strip()
        email = (request.data.get('email') or '').strip()
        password = request.data.get('password') or ''

        if not username or not password:
            return Response({'detail': 'Username and password are required.'}, status=400)
        if len(username) < 3:
            return Response({'detail': 'Username must be at least 3 characters.'}, status=400)
        if len(password) < 6:
            return Response({'detail': 'Password must be at least 6 characters.'}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({'detail': 'Username is already taken.'}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        # Auto-create an empty portfolio profile so admin panel loads immediately
        from django.utils.text import slugify
        PortfolioProfile.objects.create(
            user=user,
            slug=slugify(username),
            first_name=username.upper(),
            last_name='',
            navbar_initials=username[:2].upper(),
            copyright_name=username,
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
    })


# ─── Admin: Profile ───────────────────────────────────────────────────────────

class AdminProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        profile = self._get_profile(request.user)
        serializer = PortfolioProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        profile = self._get_profile(request.user)
        serializer = PortfolioProfileWriteSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(PortfolioProfileSerializer(profile, context={'request': request}).data)
        return Response(serializer.errors, status=400)


# ─── Admin: Career ────────────────────────────────────────────────────────────

class AdminCareerListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        entries = CareerEntry.objects.filter(profile=self._profile(request.user))
        return Response(CareerEntrySerializer(entries, many=True).data)

    def post(self, request):
        serializer = CareerEntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=self._profile(request.user))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminCareerDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get_entry(self, request, pk):
        try:
            profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)
            return CareerEntry.objects.get(pk=pk, profile=profile)
        except CareerEntry.DoesNotExist:
            return None

    def put(self, request, pk):
        entry = self._get_entry(request, pk)
        if not entry:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = CareerEntrySerializer(entry, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        entry = self._get_entry(request, pk)
        if not entry:
            return Response({'detail': 'Not found.'}, status=404)
        entry.delete()
        return Response(status=204)


# ─── Admin: Projects ──────────────────────────────────────────────────────────

class AdminProjectListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        projects = Project.objects.filter(profile=self._profile(request.user))
        return Response(ProjectSerializer(projects, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(profile=self._profile(request.user))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminProjectDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get_project(self, request, pk):
        try:
            profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)
            return Project.objects.get(pk=pk, profile=profile)
        except Project.DoesNotExist:
            return None

    def put(self, request, pk):
        project = self._get_project(request, pk)
        if not project:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = ProjectSerializer(project, data=request.data, partial=True,
                                       context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        project = self._get_project(request, pk)
        if not project:
            return Response({'detail': 'Not found.'}, status=404)
        project.delete()
        return Response(status=204)


# ─── Admin: What I Do ─────────────────────────────────────────────────────────

class AdminWhatIDoListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        sections = WhatIDoSection.objects.filter(profile=self._profile(request.user))
        return Response(WhatIDoSectionSerializer(sections, many=True).data)

    def post(self, request):
        serializer = WhatIDoSectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=self._profile(request.user))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminWhatIDoDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get_section(self, request, pk):
        try:
            profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)
            return WhatIDoSection.objects.get(pk=pk, profile=profile)
        except WhatIDoSection.DoesNotExist:
            return None

    def put(self, request, pk):
        section = self._get_section(request, pk)
        if not section:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = WhatIDoSectionSerializer(section, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        section = self._get_section(request, pk)
        if not section:
            return Response({'detail': 'Not found.'}, status=404)
        section.delete()
        return Response(status=204)


# ─── Admin: Tech Stack ────────────────────────────────────────────────────────

class AdminTechStackListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        images = TechStackImage.objects.filter(profile=self._profile(request.user))
        return Response(TechStackImageSerializer(images, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = TechStackImageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(profile=self._profile(request.user))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminTechStackDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get_item(self, request, pk):
        try:
            profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)
            return TechStackImage.objects.get(pk=pk, profile=profile)
        except TechStackImage.DoesNotExist:
            return None

    def put(self, request, pk):
        item = self._get_item(request, pk)
        if not item:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = TechStackImageSerializer(item, data=request.data, partial=True,
                                              context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        item = self._get_item(request, pk)
        if not item:
            return Response({'detail': 'Not found.'}, status=404)
        item.delete()
        return Response(status=204)


# ─── Admin: Resume – Parse & Generate ────────────────────────────────────────

class ResumeParseView(APIView):
    """
    POST /api/admin/resume/parse/
    Accepts a multipart/form-data upload with field 'resume' (PDF file).
    Returns extracted profile/career/skills data as JSON.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_file = request.FILES.get('resume')
        if not resume_file:
            return Response({'detail': 'No resume file provided. Use field name "resume".'}, status=400)

        allowed_types = ['application/pdf', 'application/x-pdf']
        ct = resume_file.content_type or ''
        if ct not in allowed_types and not resume_file.name.lower().endswith('.pdf'):
            return Response({'detail': 'Only PDF files are supported.'}, status=400)

        if resume_file.size > 5 * 1024 * 1024:  # 5 MB limit
            return Response({'detail': 'File too large. Max size is 5 MB.'}, status=400)

        file_bytes = resume_file.read()

        from .resume_utils import parse_resume_pdf
        result = parse_resume_pdf(file_bytes)

        if 'error' in result:
            return Response({'detail': result['error']}, status=422)

        return Response(result)


class ResumeUploadView(APIView):
    """
    POST /api/admin/resume/upload/
    Stores the uploaded PDF as the user's resume file and updates resume_url.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume_file = request.FILES.get('resume')
        if not resume_file:
            return Response({'detail': 'No resume file provided.'}, status=400)

        if resume_file.size > 5 * 1024 * 1024:
            return Response({'detail': 'File too large. Max size is 5 MB.'}, status=400)

        profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)

        # Delete old file if exists
        if profile.resume_file:
            try:
                profile.resume_file.delete(save=False)
            except Exception:
                pass

        profile.resume_file = resume_file
        profile.save()

        file_url = request.build_absolute_uri(profile.resume_file.url)
        # Auto-set resume_url to the uploaded file URL
        profile.resume_url = file_url
        profile.save(update_fields=['resume_url'])

        return Response({'resume_url': file_url, 'detail': 'Resume uploaded successfully.'})


class ResumeGenerateView(APIView):
    """
    GET  /api/admin/resume/generate/?format=pdf  → download PDF
    GET  /api/admin/resume/generate/?format=latex → download .tex file
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.http import HttpResponse
        from .resume_utils import profile_to_resume_data, generate_resume_pdf, generate_resume_latex

        fmt = request.query_params.get('format', 'pdf').lower()
        if fmt not in ('pdf', 'latex'):
            return Response({'detail': 'format must be "pdf" or "latex".'}, status=400)

        try:
            profile = PortfolioProfile.objects.prefetch_related(
                'career_entries', 'projects', 'techstack_images',
                'education_entries', 'certifications', 'achievements', 'personal_projects'
            ).get(user=request.user)
        except PortfolioProfile.DoesNotExist:
            return Response({'detail': 'No portfolio profile found.'}, status=404)

        data = profile_to_resume_data(profile)
        name_slug = (data.get('name') or 'resume').replace(' ', '_').lower()

        if fmt == 'pdf':
            try:
                pdf_bytes = generate_resume_pdf(data)
            except ImportError as e:
                return Response({'detail': str(e)}, status=500)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{name_slug}_resume.pdf"'
            return response

        # LaTeX source
        tex_source = generate_resume_latex(data)
        response = HttpResponse(tex_source, content_type='text/plain; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{name_slug}_resume.tex"'
        return response


# ─── Admin: Education ──────────────────────────────────────────────────────────

class AdminEducationListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        entries = EducationEntry.objects.filter(profile=self._profile(request.user))
        return Response(EducationEntrySerializer(entries, many=True).data)

    def post(self, request):
        serializer = EducationEntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=self._profile(request.user))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminEducationDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        try:
            profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)
            return EducationEntry.objects.get(pk=pk, profile=profile)
        except EducationEntry.DoesNotExist:
            return None

    def put(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = EducationEntrySerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=404)
        obj.delete()
        return Response(status=204)


# ─── Admin: Certifications ────────────────────────────────────────────────────

class AdminCertificationListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        entries = Certification.objects.filter(profile=self._profile(request.user))
        return Response(CertificationSerializer(entries, many=True).data)

    def post(self, request):
        serializer = CertificationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=self._profile(request.user))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminCertificationDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        try:
            profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)
            return Certification.objects.get(pk=pk, profile=profile)
        except Certification.DoesNotExist:
            return None

    def put(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = CertificationSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=404)
        obj.delete()
        return Response(status=204)


# ─── Admin: Achievements ─────────────────────────────────────────────────────

class AdminAchievementListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        entries = Achievement.objects.filter(profile=self._profile(request.user))
        return Response(AchievementSerializer(entries, many=True).data)

    def post(self, request):
        serializer = AchievementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=self._profile(request.user))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminAchievementDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        try:
            profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)
            return Achievement.objects.get(pk=pk, profile=profile)
        except Achievement.DoesNotExist:
            return None

    def put(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = AchievementSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=404)
        obj.delete()
        return Response(status=204)


# ─── Admin: Personal Projects ─────────────────────────────────────────────────

class AdminPersonalProjectListCreate(APIView):
    permission_classes = [IsAuthenticated]

    def _profile(self, user):
        profile, _ = PortfolioProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request):
        items = PersonalProject.objects.filter(profile=self._profile(request.user))
        return Response(PersonalProjectSerializer(items, many=True).data)

    def post(self, request):
        serializer = PersonalProjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(profile=self._profile(request.user))
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AdminPersonalProjectDetail(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        try:
            profile, _ = PortfolioProfile.objects.get_or_create(user=request.user)
            return PersonalProject.objects.get(pk=pk, profile=profile)
        except PersonalProject.DoesNotExist:
            return None

    def put(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=404)
        serializer = PersonalProjectSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        if not obj:
            return Response({'detail': 'Not found.'}, status=404)
        obj.delete()
        return Response(status=204)
