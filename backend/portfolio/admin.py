from django.contrib import admin
from .models import PortfolioProfile, CareerEntry, Project, WhatIDoSection, TechStackImage


class CareerEntryInline(admin.TabularInline):
    model = CareerEntry
    extra = 1


class ProjectInline(admin.TabularInline):
    model = Project
    extra = 1


class WhatIDoInline(admin.TabularInline):
    model = WhatIDoSection
    extra = 1


class TechStackInline(admin.TabularInline):
    model = TechStackImage
    extra = 1


@admin.register(PortfolioProfile)
class PortfolioProfileAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'updated_at']
    inlines = [CareerEntryInline, ProjectInline, WhatIDoInline, TechStackInline]


@admin.register(CareerEntry)
class CareerEntryAdmin(admin.ModelAdmin):
    list_display = ['role', 'company', 'year', 'order']
    list_editable = ['order']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'order']
    list_editable = ['order']


@admin.register(WhatIDoSection)
class WhatIDoSectionAdmin(admin.ModelAdmin):
    list_display = ['category', 'title', 'order']
    list_editable = ['order']


@admin.register(TechStackImage)
class TechStackImageAdmin(admin.ModelAdmin):
    list_display = ['name', 'order']
    list_editable = ['order']
