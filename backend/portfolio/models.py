from django.db import models
from django.contrib.auth.models import User


class PortfolioProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='portfolio')

    # Landing section
    first_name = models.CharField(max_length=100, default='')
    last_name = models.CharField(max_length=100, default='')
    title_prefix = models.CharField(max_length=100, default='A Full Stack')
    title_option1 = models.CharField(max_length=100, default='Developer')
    title_option2 = models.CharField(max_length=100, default='Engineer')
    navbar_initials = models.CharField(max_length=10, default='RC')

    # About section
    about_text = models.TextField(default='')

    # Contact section
    email = models.EmailField(default='')
    education = models.CharField(max_length=300, default='')
    copyright_year = models.CharField(max_length=10, default='2025')
    copyright_name = models.CharField(max_length=200, default='')

    # Social links
    github_url = models.URLField(blank=True, default='')
    linkedin_url = models.URLField(blank=True, default='')
    twitter_url = models.URLField(blank=True, default='')
    instagram_url = models.URLField(blank=True, default='')
    resume_url = models.URLField(blank=True, default='')

    # Uploaded resume PDF (auto-sets resume_url when saved)
    resume_file = models.FileField(upload_to='resumes/', blank=True, null=True)

    # Section visibility toggles
    show_education = models.BooleanField(default=True)
    show_certifications = models.BooleanField(default=True)
    show_achievements = models.BooleanField(default=True)
    show_personal_projects = models.BooleanField(default=True)

    # Theme & component variant settings
    active_template = models.CharField(max_length=50, default='teal-dark')
    variant_career = models.CharField(max_length=50, default='cards')
    variant_work = models.CharField(max_length=50, default='carousel')
    variant_techstack = models.CharField(max_length=50, default='logos')
    techstack_brightness = models.FloatField(default=1.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}'s Portfolio"


class CareerEntry(models.Model):
    profile = models.ForeignKey(
        PortfolioProfile, on_delete=models.CASCADE, related_name='career_entries'
    )
    role = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    year = models.CharField(max_length=60)
    description = models.TextField()
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.role} at {self.company}"


class Project(models.Model):
    profile = models.ForeignKey(
        PortfolioProfile, on_delete=models.CASCADE, related_name='projects'
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=200)
    tools = models.CharField(max_length=500)
    image = models.FileField(upload_to='projects/', blank=True, null=True)
    image_url = models.URLField(blank=True, default='')
    project_url = models.URLField(blank=True, default='')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

    def get_image(self):
        if self.image:
            return self.image.url
        return self.image_url


class WhatIDoSection(models.Model):
    profile = models.ForeignKey(
        PortfolioProfile, on_delete=models.CASCADE, related_name='whatido_sections'
    )
    category = models.CharField(max_length=100, default='')
    title = models.CharField(max_length=200, default='')
    description = models.TextField(default='')
    tags = models.JSONField(default=list)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.category} — {self.title}"


class TechStackImage(models.Model):
    profile = models.ForeignKey(
        PortfolioProfile, on_delete=models.CASCADE, related_name='techstack_images'
    )
    name = models.CharField(max_length=100)
    image = models.FileField(upload_to='techstack/', blank=True, null=True)
    image_url = models.URLField(blank=True, default='')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

    def get_image(self):
        if self.image:
            return self.image.url
        return self.image_url


class EducationEntry(models.Model):
    profile = models.ForeignKey(
        PortfolioProfile, on_delete=models.CASCADE, related_name='education_entries'
    )
    degree = models.CharField(max_length=300)
    institution = models.CharField(max_length=300, blank=True, default='')
    year = models.CharField(max_length=20, blank=True, default='')
    grade = models.CharField(max_length=100, blank=True, default='')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.degree} — {self.institution}"


class Certification(models.Model):
    profile = models.ForeignKey(
        PortfolioProfile, on_delete=models.CASCADE, related_name='certifications'
    )
    title = models.CharField(max_length=300)
    issuer = models.CharField(max_length=200, blank=True, default='')
    year = models.CharField(max_length=20, blank=True, default='')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class Achievement(models.Model):
    profile = models.ForeignKey(
        PortfolioProfile, on_delete=models.CASCADE, related_name='achievements'
    )
    text = models.TextField()
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text[:80]


class PersonalProject(models.Model):
    profile = models.ForeignKey(
        PortfolioProfile, on_delete=models.CASCADE, related_name='personal_projects'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    tech_stack = models.JSONField(default=list)
    github_url = models.URLField(blank=True, default='')
    live_url = models.URLField(blank=True, default='')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title
