from rest_framework import serializers
from .models import PortfolioProfile, CareerEntry, Project, WhatIDoSection, TechStackImage, EducationEntry, Certification, Achievement, PersonalProject


class CareerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerEntry
        fields = ['id', 'role', 'company', 'year', 'description', 'order']


class ProjectSerializer(serializers.ModelSerializer):
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'category', 'tools', 'image', 'image_url',
                  'image_display', 'project_url', 'order']

    def get_image_display(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        if obj.image:
            return obj.image.url
        return obj.image_url


class WhatIDoSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatIDoSection
        fields = ['id', 'category', 'title', 'description', 'tags', 'order']


class TechStackImageSerializer(serializers.ModelSerializer):
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = TechStackImage
        fields = ['id', 'name', 'image', 'image_url', 'image_display', 'order']

    def get_image_display(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        if obj.image:
            return obj.image.url
        return obj.image_url


class EducationEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationEntry
        fields = ['id', 'degree', 'institution', 'year', 'grade', 'order']


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'title', 'issuer', 'year', 'order']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'text', 'order']


class PersonalProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalProject
        fields = ['id', 'title', 'description', 'tech_stack', 'github_url', 'live_url', 'order']


class PortfolioProfileSerializer(serializers.ModelSerializer):
    career_entries = CareerEntrySerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    whatido_sections = WhatIDoSectionSerializer(many=True, read_only=True)
    techstack_images = TechStackImageSerializer(many=True, read_only=True)
    education_entries = EducationEntrySerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    achievements = AchievementSerializer(many=True, read_only=True)
    personal_projects = PersonalProjectSerializer(many=True, read_only=True)

    class Meta:
        model = PortfolioProfile
        fields = [
            'id', 'first_name', 'last_name', 'title_prefix', 'title_option1',
            'title_option2', 'navbar_initials', 'about_text', 'email',
            'education', 'copyright_year', 'copyright_name',
            'github_url', 'linkedin_url', 'twitter_url', 'instagram_url',
            'resume_url', 'resume_file_url',
            'show_education', 'show_certifications', 'show_achievements',
            'show_personal_projects',
            'active_template', 'variant_career', 'variant_work', 'variant_techstack',
            'techstack_brightness',
            'career_entries', 'projects', 'whatido_sections', 'techstack_images',
            'education_entries', 'certifications', 'achievements', 'personal_projects',
            'updated_at',
        ]

    resume_file_url = serializers.SerializerMethodField()

    def get_resume_file_url(self, obj):
        request = self.context.get('request')
        if obj.resume_file and request:
            return request.build_absolute_uri(obj.resume_file.url)
        if obj.resume_file:
            return obj.resume_file.url
        return ''


class PortfolioProfileWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioProfile
        fields = [
            'first_name', 'last_name', 'title_prefix', 'title_option1',
            'title_option2', 'navbar_initials', 'about_text', 'email',
            'education', 'copyright_year', 'copyright_name',
            'github_url', 'linkedin_url', 'twitter_url', 'instagram_url',
            'resume_url', 'show_education', 'show_certifications', 'show_achievements',
            'show_personal_projects',
            'active_template', 'variant_career', 'variant_work', 'variant_techstack',
            'techstack_brightness',
        ]
