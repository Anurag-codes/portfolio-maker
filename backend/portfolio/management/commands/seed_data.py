"""
Management command to seed the database with default demo portfolio data.
Run: python manage.py seed_data --username admin --password yourpassword
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from portfolio.models import (
    PortfolioProfile, CareerEntry, Project, WhatIDoSection, TechStackImage,
    EducationEntry, Certification, Achievement,
)


class Command(BaseCommand):
    help = 'Seed the database with demo portfolio data'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin', type=str)
        parser.add_argument('--password', default='admin123', type=str)
        parser.add_argument('--email', default='admin@example.com', type=str)

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options['email']

        # Always update password so this command also acts as a reset tool
        user, created = User.objects.get_or_create(username=username)
        user.set_password(password)
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.save()
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Password reset for existing user: {username}'))

        if hasattr(user, 'portfolio'):
            self.stdout.write('Portfolio already exists. Skipping seed.')
            return

        profile = PortfolioProfile.objects.create(
            user=user,
            first_name='JOHN',
            last_name='DOE',
            title_prefix='A Full Stack',
            title_option1='Developer',
            title_option2='Engineer',
            navbar_initials='JD',
            about_text=(
                'Full Stack Developer with 5+ years of experience crafting modern web applications. '
                'Passionate about clean code, great UX, and scalable architecture. '
                'This is a demo portfolio — log in to the admin panel and replace this '
                'with your own story, projects and skills.'
            ),
            email='hello@johndoe.dev',
            education='BSc in Computer Science',
            copyright_year='2026',
            copyright_name='John Doe',
            github_url='https://github.com/johndoe',
            linkedin_url='https://linkedin.com/in/johndoe',
            twitter_url='https://x.com/johndoe',
            instagram_url='https://instagram.com/johndoe',
            resume_url='',
        )
        self.stdout.write(self.style.SUCCESS('Created portfolio profile'))

        career_data = [
            {
                'role': 'Junior Developer',
                'company': 'Startup Labs',
                'year': '2021',
                'description': 'Built responsive web apps with React.js and Node.js. Collaborated on UI/UX design and database schema using MongoDB.',
                'order': 0,
            },
            {
                'role': 'Full Stack Developer',
                'company': 'Tech Corp',
                'year': '2022',
                'description': 'Led a team of 3 engineers to deliver a SaaS platform. Designed REST APIs and implemented CI/CD pipelines, reducing load time by 40%.',
                'order': 1,
            },
            {
                'role': 'Senior Engineer',
                'company': 'Innovate Inc.',
                'year': 'NOW',
                'description': 'Architecting micro-frontend systems and serverless backends. Mentoring junior developers and driving code quality standards.',
                'order': 2,
            },
        ]
        for entry in career_data:
            CareerEntry.objects.create(profile=profile, **entry)
        self.stdout.write(self.style.SUCCESS('Created career entries'))

        project_data = [
            {
                'title': 'ShopEase',
                'category': 'E-Commerce Platform',
                'tools': 'Next.js, NestJS, PostgreSQL, Stripe',
                'image_url': '',
                'order': 0,
            },
            {
                'title': 'TaskFlow',
                'category': 'Project Management',
                'tools': 'React, Node.js, MongoDB, Socket.io',
                'image_url': '',
                'order': 1,
            },
            {
                'title': 'DataViz Pro',
                'category': 'Analytics Dashboard',
                'tools': 'React, D3.js, Python, FastAPI',
                'image_url': '',
                'order': 2,
            },
            {
                'title': 'ChatSync',
                'category': 'Real-time Messaging',
                'tools': 'React, Node.js, WebSockets, Redis',
                'image_url': '',
                'order': 3,
            },
        ]
        for project in project_data:
            Project.objects.create(profile=profile, **project)
        self.stdout.write(self.style.SUCCESS('Created projects'))

        whatido_data = [
            {
                'category': 'FRONTEND',
                'title': 'Building Interactive UIs',
                'description': (
                    'Crafting performant, responsive interfaces with modern frameworks. '
                    'From SPAs to micro-frontends, I deliver pixel-perfect experiences.'
                ),
                'tags': ['React.js', 'Angular', 'Next.js', 'TypeScript', 'JavaScript',
                         'Material UI', 'HTML5', 'CSS3'],
                'order': 0,
            },
            {
                'category': 'BACKEND',
                'title': 'Scalable Server Architecture',
                'description': (
                    'Designing robust APIs and microservices. From CMS platforms to '
                    'complex business logic, I build backends that scale.'
                ),
                'tags': ['Node.js', 'NestJS', 'Express.js', 'MongoDB', 'PostgreSQL',
                         'REST APIs', 'Microservices', 'Python'],
                'order': 1,
            },
        ]
        for section in whatido_data:
            WhatIDoSection.objects.create(profile=profile, **section)
        self.stdout.write(self.style.SUCCESS('Created What I Do sections'))

        tech_data = [
            {'name': 'React', 'image_url': '/images/react2.webp', 'order': 0},
            {'name': 'Next.js', 'image_url': '/images/next2.webp', 'order': 1},
            {'name': 'Node.js', 'image_url': '/images/node2.webp', 'order': 2},
            {'name': 'Express', 'image_url': '/images/express.webp', 'order': 3},
            {'name': 'MongoDB', 'image_url': '/images/mongo.webp', 'order': 4},
            {'name': 'MySQL', 'image_url': '/images/mysql.webp', 'order': 5},
            {'name': 'TypeScript', 'image_url': '/images/typescript.webp', 'order': 6},
            {'name': 'JavaScript', 'image_url': '/images/javascript.webp', 'order': 7},
        ]
        for tech in tech_data:
            TechStackImage.objects.create(profile=profile, **tech)
        self.stdout.write(self.style.SUCCESS('Created tech stack images'))

        education_data = [
            {
                'degree': 'B.Tech (Electronics & Communication)',
                'institution': 'State Engineering College',
                'year': '2019',
                'grade': '77%',
                'order': 0,
            },
            {
                'degree': 'Higher Secondary (12th)',
                'institution': 'City Convent School (CBSE)',
                'year': '2015',
                'grade': '63.8%',
                'order': 1,
            },
            {
                'degree': 'Secondary (10th)',
                'institution': 'Oxford Senior Secondary School (CBSE)',
                'year': '2013',
                'grade': '70%',
                'order': 2,
            },
        ]
        for edu in education_data:
            EducationEntry.objects.create(profile=profile, **edu)
        self.stdout.write(self.style.SUCCESS('Created education entries'))

        cert_data = [
            {'title': 'C++ Programming', 'issuer': 'IIT Kharagpur', 'year': '2020', 'order': 0},
            {'title': 'Data Structures & Algorithms in Java', 'issuer': 'Udemy', 'year': '2021', 'order': 1},
            {'title': 'Full Stack Web Development', 'issuer': 'Udemy', 'year': '2022', 'order': 2},
        ]
        for cert in cert_data:
            Certification.objects.create(profile=profile, **cert)
        self.stdout.write(self.style.SUCCESS('Created certifications'))

        achievement_data = [
            {'text': 'Published research paper on "Text Extraction from Digital Images" in International Journal of Recent Research Aspects (ISSN:2349-7688, Vol.5).', 'order': 0},
            {'text': 'Secured 1st Rank in DSA based Code Rank programming competition.', 'order': 1},
            {'text': 'Designed and deployed an E-commerce application using Django and PostgreSQL on VPS during internship.', 'order': 2},
            {'text': 'Delivered 4 major product releases on schedule as part of core banking platform team.', 'order': 3},
        ]
        for ach in achievement_data:
            Achievement.objects.create(profile=profile, **ach)
        self.stdout.write(self.style.SUCCESS('Created achievements'))

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Done! Login at /admin with username="{username}" password="{password}"'
        ))
