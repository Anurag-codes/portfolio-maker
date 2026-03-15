"""
resume_utils.py – PDF resume parsing and resume PDF/LaTeX generation.
"""
import re, io, html


# ─────────────────────────────────────────────────────────────────────────────
# PDF Parsing
# ─────────────────────────────────────────────────────────────────────────────

def parse_resume_pdf(file_bytes: bytes) -> dict:
    """
    Parse a PDF resume and return structured data ready to populate portfolio.
    Returns a dict with keys: profile, career, skills, projects.
    """
    try:
        import pdfplumber
    except ImportError:
        return {"error": "pdfplumber is not installed. Run: pip install pdfplumber"}

    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    except Exception as e:
        return {"error": f"Could not read PDF: {e}"}

    if not text.strip():
        return {"error": "Could not extract text from this PDF. It may be image-based."}

    return _extract_data(text)


def _extract_data(text: str) -> dict:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    profile: dict = {}
    career: list = []
    skills: list = []
    projects: list = []
    education_entries: list = []
    certifications: list = []
    achievements: list = []

    # ── Email ──────────────────────────────────────────────────────────────
    m = re.search(r"[\w.+%\-]+@[\w.\-]+\.[a-zA-Z]{2,}", text)
    if m:
        profile["email"] = m.group()

    # ── Phone ──────────────────────────────────────────────────────────────
    m = re.search(r"(?:\+\d{1,3}[\s\-.]?)?(?:\(?\d{3,5}\)?[\s\-.]?)?\d{3,4}[\s\-.]?\d{4}", text)
    if m:
        phone = m.group().strip()
        if sum(c.isdigit() for c in phone) >= 7:
            profile["phone"] = phone

    # ── LinkedIn URL ────────────────────────────────────────────────────────
    m = re.search(r"https?://(?:www\.)?linkedin\.com/in/[\w\-]+", text, re.I)
    if m:
        profile["linkedin_url"] = m.group()
    else:
        m = re.search(r"(?:www\.)?linkedin\.com/in/([\w\-]+)", text, re.I)
        if m:
            profile["linkedin_url"] = "https://www.linkedin.com/in/" + m.group(1)

    # ── GitHub URL ──────────────────────────────────────────────────────────
    m = re.search(r"https?://(?:www\.)?github\.com/[\w\-]+", text, re.I)
    if m:
        profile["github_url"] = m.group()
    else:
        m = re.search(r"(?:www\.)?github\.com/([\w\-]+)", text, re.I)
        if m:
            profile["github_url"] = "https://github.com/" + m.group(1)

    # ── Name ────────────────────────────────────────────────────────────────
    # Try to find the name: usually the first few lines, all-caps or title-cased
    for line in lines[:6]:
        if "@" in line or re.search(r"\d{5,}", line):
            continue
        if re.match(r"^[A-Z][A-Za-z\s]{2,50}$", line) and len(line.split()) <= 5:
            parts = line.split(None, 1)
            profile["first_name"] = parts[0].strip()
            profile["last_name"] = parts[1].strip() if len(parts) > 1 else ""
            break

    # ── Section boundaries ──────────────────────────────────────────────────
    SECTION_RE = {
        "summary":        re.compile(r"^(PROFESSIONAL\s+SUMMARY|SUMMARY|OBJECTIVE|PROFESSIONAL\s+PROFILE|ABOUT\s+ME)\s*$", re.I),
        "skills":         re.compile(r"^(CORE\s+SKILLS|SKILLS|TECHNICAL\s+SKILLS|KEY\s+SKILLS|TECHNOLOGIES)\s*$", re.I),
        "experience":     re.compile(r"^(PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|EXPERIENCE|EMPLOYMENT)\s*$", re.I),
        "education":      re.compile(r"^(EDUCATION|ACADEMIC\s+BACKGROUND)\s*$", re.I),
        "certifications": re.compile(r"^(CERTIFICATIONS?|LICENSES?|CERTIFICATES?|COURSES?)\s*$", re.I),
        "achievements":   re.compile(r"^(ACHIEVEMENTS?|AWARDS?|ACCOMPLISHMENTS?|HONORS?)\s*$", re.I),
        "projects":       re.compile(r"^(PROJECTS?|PERSONAL\s+PROJECTS?|PORTFOLIO)\s*$", re.I),
        "declaration":    re.compile(r"^(DECLARATION)\s*$", re.I),
    }

    section_lines: dict[str, list[str]] = {}
    current: str | None = None

    for line in lines:
        matched_sec = None
        for sec, pat in SECTION_RE.items():
            if pat.match(line):
                matched_sec = sec
                break
        if matched_sec:
            current = matched_sec
            section_lines[current] = []
        elif current and current != "declaration":
            section_lines[current].append(line)

    # ── About text ──────────────────────────────────────────────────────────
    if "summary" in section_lines:
        summary_lines = section_lines["summary"]
        profile["about_text"] = " ".join(summary_lines[:15]).strip()

    # ── Education ───────────────────────────────────────────────────────────
    if "education" in section_lines:
        edu_lines = section_lines["education"]
        # Keep a plain-text backup for profile.education
        profile["education"] = " ".join(edu_lines[:8])[:300].strip()
        # Also parse into structured entries
        education_entries = _parse_education(edu_lines)

    # ── Certifications ──────────────────────────────────────────────────────
    if "certifications" in section_lines:
        certifications = _parse_certifications(section_lines["certifications"])

    # ── Achievements ────────────────────────────────────────────────────────
    if "achievements" in section_lines:
        achievements = _parse_achievements(section_lines["achievements"])

    # ── Skills ──────────────────────────────────────────────────────────────
    if "skills" in section_lines:
        raw = " \n ".join(section_lines["skills"])
        # Handle "Label: item1, item2" patterns
        cleaned: list[str] = []
        for line in section_lines["skills"]:
            # Remove leading bullets
            line = re.sub(r"^[•\-\*]\s*", "", line)
            # If label: values format, extract values
            if ":" in line:
                val_part = line.split(":", 1)[1]
                items = [x.strip() for x in re.split(r"[,;/]+", val_part) if x.strip()]
                cleaned.extend(items)
            else:
                items = [x.strip() for x in re.split(r"[,;/•|]+", line) if x.strip()]
                cleaned.extend(items)
        skills = [s for s in cleaned if 1 < len(s) < 50][:30]

    # ── Experience ──────────────────────────────────────────────────────────
    if "experience" in section_lines:
        career = _parse_experience(section_lines["experience"])

    # ── Projects ────────────────────────────────────────────────────────────
    if "projects" in section_lines:
        projects = _parse_projects(section_lines["projects"])

    return {
        "profile": profile,
        "career": career,
        "skills": skills,
        "projects": projects,
        "education_entries": education_entries,
        "certifications": certifications,
        "achievements": achievements,
    }


def _parse_experience(lines: list[str]) -> list[dict]:
    """
    Parse experience entries from section lines.
    Detects entries by company/date-header lines.
    """
    # Date pattern: catches "Apr 2022 -- Present", "2019 -- 2021", "Jan 2020 to Mar 2022"
    DATE_RE = re.compile(
        r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}"
        r"\s*(?:--|–|—|-|to)\s*"
        r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(?:\d{4}|Present|Current|Now)",
        re.I,
    )
    BULLET_RE = re.compile(r"^[•\-\*]\s*")

    entries: list[dict] = []
    current: dict | None = None
    collecting_role = False

    for line in lines:
        has_date = bool(DATE_RE.search(line))
        is_bullet = bool(BULLET_RE.match(line))

        if has_date and len(line) > 5:
            # New company entry – save previous
            if current:
                entries.append(current)
            # Extract year from the date match
            date_m = DATE_RE.search(line)
            year_str = date_m.group().strip() if date_m else ""
            company_part = DATE_RE.sub("", line).strip().rstrip(",;–—-").strip()
            current = {
                "company": company_part,
                "role": "",
                "year": year_str,
                "description": "",
                "bullets": [],
            }
            collecting_role = True

        elif current and collecting_role and not is_bullet and not line.startswith("Product:"):
            # Next non-bullet line after header = role title
            if not current["role"]:
                current["role"] = line
                collecting_role = False
            # might be a sub-title / product line, skip for role
        elif current and is_bullet:
            collecting_role = False
            bullet_text = BULLET_RE.sub("", line).strip()
            current["bullets"].append(bullet_text)

    if current:
        entries.append(current)

    # Build career entries
    result = []
    for e in entries:
        desc = "\n".join(e["bullets"][:8]) if e["bullets"] else e.get("description", "")
        result.append({
            "role": e.get("role", "").strip()[:200],
            "company": e.get("company", "").strip()[:200],
            "year": e.get("year", "").strip()[:50],
            "description": desc,
        })

    return result[:6]  # max 6 entries


def _parse_projects(lines: list[str]) -> list[dict]:
    """Very basic project extraction."""
    projects = []
    BULLET_RE = re.compile(r"^[•\-\*]\s*")
    i = 0
    while i < len(lines):
        line = lines[i]
        if not BULLET_RE.match(line) and len(line) > 3:
            # potential project title
            title = line
            tools = ""
            desc_parts = []
            i += 1
            while i < len(lines):
                next_line = lines[i]
                if not BULLET_RE.match(next_line) and len(next_line) > 5:
                    # looks like next project title
                    break
                bullet = BULLET_RE.sub("", next_line).strip()
                if re.search(r"(?:stack|tools|tech|built\s+with|using)", bullet, re.I):
                    tools = bullet
                else:
                    desc_parts.append(bullet)
                i += 1
            projects.append({
                "title": title[:200],
                "tools": tools[:500],
                "category": "Personal Project",
            })
        else:
            i += 1
    return projects[:6]


def _parse_education(lines: list[str]) -> list[dict]:
    """Parse structured education entries from education section lines."""
    DEGREE_RE = re.compile(
        r"\b(B\.?\s*Tech|B\.?\s*E\.?|B\.?\s*Sc\.?|M\.?\s*Tech|M\.?\s*Sc\.?|MBA|BCA|MCA|Ph\.?\s*D\.?|"
        r"B\.?\s*Com|B\.?\s*A\.?|M\.?\s*A\.?|Diploma|B\.?\s*Des|M\.?\s*Des|LLB|"
        r"Higher\s+Secondary|Senior\s+Secondary|HSC|SSC|10th|12th)\b",
        re.I,
    )
    GRADE_RE = re.compile(
        r"(?:CGPA|GPA|Grade|Marks|Percentage)[:\s]*([0-9]+(?:\.[0-9]+)?\s*(?:%|/\s*[0-9]+)?)",
        re.I,
    )
    YEAR_RE = re.compile(r"\b((?:19|20)\d{2})\b")

    entries: list[dict] = []
    current: dict | None = None

    for line in lines:
        if DEGREE_RE.search(line):
            if current:
                entries.append(current)
            current = {"degree": line.strip()[:300], "institution": "", "year": "", "grade": ""}
        elif current:
            grade_m = GRADE_RE.search(line)
            year_m = YEAR_RE.search(line)
            if grade_m and not current["grade"]:
                current["grade"] = grade_m.group().strip()[:100]
            if year_m and not current["year"]:
                current["year"] = year_m.group(1)
            if not current["institution"] and not grade_m and not year_m and len(line) > 4:
                current["institution"] = line.strip()[:300]

    if current:
        entries.append(current)
    return entries[:6]


def _parse_certifications(lines: list[str]) -> list[dict]:
    """Parse certification entries from certifications section lines."""
    BULLET_RE = re.compile(r"^[•\-\*✓✔\d]+[.):\s]+")
    YEAR_RE = re.compile(r"\b((?:19|20)\d{2})\b")
    ISSUER_RE = re.compile(r"(?:by|from)\s+([A-Za-z][A-Za-z\s&,.]{2,40})", re.I)
    PIPE_ISSUER_RE = re.compile(r"[|\-–—]\s*([A-Z][A-Za-z\s&,.]{2,40})")

    certs: list[dict] = []
    for line in lines:
        clean = BULLET_RE.sub("", line).strip()
        if len(clean) < 5:
            continue
        year_m = YEAR_RE.search(clean)
        year = year_m.group(1) if year_m else ""

        issuer = ""
        issuer_m = ISSUER_RE.search(clean)
        if not issuer_m:
            issuer_m = PIPE_ISSUER_RE.search(clean)
        if issuer_m:
            issuer = issuer_m.group(1).strip()[:200]

        # Strip year and issuer from title
        title = YEAR_RE.sub("", clean)
        title = ISSUER_RE.sub("", title)
        title = PIPE_ISSUER_RE.sub("", title).strip(" -|–—,")
        if len(title) < 3:
            title = clean

        certs.append({"title": title.strip()[:300], "issuer": issuer, "year": year})
    return certs[:10]


def _parse_achievements(lines: list[str]) -> list[dict]:
    """Parse achievement entries from achievements section lines."""
    BULLET_RE = re.compile(r"^[•\-\*✓✔\d]+[.):\s]+")
    items: list[dict] = []
    for line in lines:
        clean = BULLET_RE.sub("", line).strip()
        if len(clean) > 8:
            items.append({"text": clean[:500]})
    return items[:10]


# ─────────────────────────────────────────────────────────────────────────────
# Resume PDF Generation (reportlab)
# ─────────────────────────────────────────────────────────────────────────────

def generate_resume_pdf(data: dict) -> bytes:
    """
    Generate a professional PDF resume from portfolio data dict.
    data keys: name, location, email, phone, linkedin, github,
               summary, skills (list of str), experience (list of dicts),
               education (str), certifications (list), achievements (list)
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch, cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    except ImportError:
        raise ImportError("reportlab is not installed. Run: pip install reportlab")

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.8 * inch,
        bottomMargin=0.8 * inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    name_style = ParagraphStyle(
        "NameStyle",
        parent=styles["Normal"],
        fontSize=18,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    contact_style = ParagraphStyle(
        "ContactStyle",
        parent=styles["Normal"],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor("#333333"),
    )
    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontSize=12,
        fontName="Helvetica-Bold",
        spaceBefore=10,
        spaceAfter=2,
        textColor=colors.HexColor("#1a1a2e"),
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=4,
    )
    bullet_style = ParagraphStyle(
        "Bullet",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        leftIndent=10,
        bulletIndent=0,
        spaceAfter=2,
    )
    company_style = ParagraphStyle(
        "Company",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica-Bold",
        spaceAfter=1,
        spaceBefore=6,
    )
    role_style = ParagraphStyle(
        "Role",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica-Oblique",
        spaceAfter=2,
        textColor=colors.HexColor("#444444"),
    )

    def safe(s):
        """Escape HTML entities for Paragraph."""
        if not s:
            return ""
        return html.escape(str(s))

    def section(title):
        return [
            Paragraph(safe(title), section_title_style),
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#333333"), spaceAfter=4),
        ]

    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    name = data.get("name", "").strip() or "Portfolio Resume"
    story.append(Paragraph(safe(name.upper()), name_style))

    contact_parts = []
    if data.get("location"):
        contact_parts.append(safe(data["location"]))
    if data.get("email"):
        email = safe(data["email"])
        contact_parts.append(f'Email: <a href="mailto:{email}" color="navy">{email}</a>')
    if data.get("phone"):
        contact_parts.append(f'Phone: {safe(data["phone"])}')
    if data.get("linkedin"):
        lnk = safe(data["linkedin"])
        contact_parts.append(f'<a href="{lnk}" color="navy">LinkedIn</a>')
    if data.get("github"):
        ghk = safe(data["github"])
        contact_parts.append(f'<a href="{ghk}" color="navy">GitHub</a>')

    if contact_parts:
        story.append(Paragraph(" | ".join(contact_parts), contact_style))

    story.append(Spacer(1, 4))

    # ── Professional Summary ─────────────────────────────────────────────────
    if data.get("summary"):
        story.extend(section("PROFESSIONAL SUMMARY"))
        story.append(Paragraph(safe(data["summary"]), body_style))

    # ── Core Skills ──────────────────────────────────────────────────────────
    skill_list = data.get("skills", [])
    if skill_list:
        story.extend(section("CORE SKILLS"))
        # Group into 3 columns of text
        chunks = [skill_list[i:i+10] for i in range(0, len(skill_list), 10)]
        for chunk in chunks:
            row_text = "  •  ".join(safe(s) for s in chunk)
            story.append(Paragraph(row_text, bullet_style))

    # ── Professional Experience ───────────────────────────────────────────────
    experience = data.get("experience", [])
    if experience:
        story.extend(section("PROFESSIONAL EXPERIENCE"))
        for exp in experience:
            company_line = safe(exp.get("company", ""))
            if exp.get("year"):
                company_line = f'{company_line} <font size="10" color="#555555">— {safe(exp["year"])}</font>'
            story.append(Paragraph(company_line, company_style))
            if exp.get("role"):
                story.append(Paragraph(safe(exp["role"]), role_style))
            bullets = exp.get("bullets", [])
            if not bullets and exp.get("description"):
                # Split description by newlines or periods
                raw_desc = exp["description"]
                bullets = [b.strip() for b in raw_desc.split("\n") if b.strip()]
                if len(bullets) == 1:
                    bullets = [b.strip() for b in re.split(r"(?<=[.!?])\s+", bullets[0]) if b.strip()]
            for b in bullets[:8]:
                story.append(Paragraph(f"• {safe(b)}", bullet_style))

    # ── Education ────────────────────────────────────────────────────────────
    if data.get("education"):
        story.extend(section("EDUCATION"))
        edu_text = data["education"]
        # Split by common delimiters
        edu_lines = [l.strip() for l in re.split(r"(?<=[A-Za-z\d%])\s{2,}|\n", edu_text) if l.strip()]
        for line in edu_lines[:6]:
            story.append(Paragraph(safe(line), body_style))

    # ── Certifications ────────────────────────────────────────────────────────
    certs = data.get("certifications", [])
    if certs:
        story.extend(section("CERTIFICATIONS"))
        for cert in certs:
            story.append(Paragraph(f"• {safe(cert)}", bullet_style))

    # ── Achievements ─────────────────────────────────────────────────────────
    achievements = data.get("achievements", [])
    if achievements:
        story.extend(section("ACHIEVEMENTS"))
        for ach in achievements:
            story.append(Paragraph(f"• {safe(ach)}", bullet_style))

    doc.build(story)
    return buffer.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# LaTeX Source Generation
# ─────────────────────────────────────────────────────────────────────────────

def _tex_escape(s: str) -> str:
    """Escape special LaTeX characters."""
    if not s:
        return ""
    replacements = [
        ("\\", "\\textbackslash{}"),
        ("&", "\\&"), ("%", "\\%"), ("$", "\\$"),
        ("#", "\\#"), ("_", "\\_"), ("{", "\\{"), ("}", "\\}"),
        ("~", "\\textasciitilde{}"), ("^", "\\textasciicircum{}"),
        ("<", "\\textless{}"), (">", "\\textgreater{}"),
    ]
    for old, new in replacements:
        s = s.replace(old, new)
    return s


def generate_resume_latex(data: dict) -> str:
    """
    Generate a LaTeX .tex source that compiles to a professional resume.
    Mirrors the structure of the sample LaTeX template.
    """
    T = _tex_escape  # shorthand

    name = T(data.get("name", "YOUR NAME")).upper()
    location = T(data.get("location", ""))
    email = data.get("email", "")
    phone = T(data.get("phone", ""))
    linkedin = data.get("linkedin", "")
    github = data.get("github", "")
    summary = T(data.get("summary", ""))
    education_raw = data.get("education", "")
    skills = data.get("skills", [])
    experience = data.get("experience", [])
    certifications = data.get("certifications", [])
    achievements = data.get("achievements", [])

    lines = []

    # ── Preamble ──────────────────────────────────────────────────────────────
    lines += [
        r"\documentclass[a4paper,11pt]{article}",
        r"\usepackage[left=0.9in,right=0.9in,top=0.8in,bottom=0.8in]{geometry}",
        r"\usepackage{enumitem}",
        r"\usepackage{hyperref}",
        r"\usepackage{titlesec}",
        r"\usepackage{parskip}",
        "",
        r"\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]",
        r"\setlength{\parindent}{0pt}",
        "",
        r"\begin{document}",
        "",
    ]

    # ── Header ────────────────────────────────────────────────────────────────
    lines += [r"\begin{center}"]
    lines.append(f"{{\\LARGE \\textbf{{{name}}}}}\\\\")
    if location:
        lines.append(f"{location} \\\\")
    contact_parts = []
    if email:
        escaped_email = T(email)
        contact_parts.append(f"Email: \\href{{mailto:{escaped_email}}}{{{escaped_email}}}")
    if phone:
        contact_parts.append(f"Phone: {phone}")
    if linkedin:
        escaped_linkedin = T(linkedin)
        contact_parts.append(f"LinkedIn: \\href{{{escaped_linkedin}}}{{{escaped_linkedin}}}")
    if github:
        escaped_github = T(github)
        contact_parts.append(f"GitHub: \\href{{{escaped_github}}}{{{escaped_github}}}")
    if contact_parts:
        lines.append(" | ".join(contact_parts))
    lines.append(r"\end{center}")
    lines.append("")

    # ── Professional Summary ──────────────────────────────────────────────────
    if summary:
        lines.append(r"\section*{PROFESSIONAL SUMMARY}")
        lines.append(summary)
        lines.append("")

    # ── Core Skills ───────────────────────────────────────────────────────────
    if skills:
        lines.append(r"\section*{CORE SKILLS}")
        lines.append(r"\begin{itemize}[leftmargin=*]")
        # Group skills into rows of ~5
        for i in range(0, len(skills), 5):
            chunk = skills[i:i+5]
            lines.append(f"\\item {', '.join(T(s) for s in chunk)}")
        lines.append(r"\end{itemize}")
        lines.append("")

    # ── Professional Experience ────────────────────────────────────────────────
    if experience:
        lines.append(r"\section*{PROFESSIONAL EXPERIENCE}")
        for exp in experience:
            company = T(exp.get("company", ""))
            role = T(exp.get("role", ""))
            year = T(exp.get("year", ""))
            bullets = exp.get("bullets", [])
            if not bullets and exp.get("description"):
                raw_desc = exp["description"]
                bullets = [b.strip() for b in raw_desc.split("\n") if b.strip()]

            if company:
                lines.append(f"\\textbf{{{company}}} \\hfill {year}\\\\")
            if role:
                lines.append(f"\\textit{{{role}}}")
            lines.append("")

            if bullets:
                lines.append(r"\begin{itemize}[leftmargin=*]")
                for b in bullets[:8]:
                    lines.append(f"\\item {T(b)}")
                lines.append(r"\end{itemize}")
            lines.append("")

    # ── Education ─────────────────────────────────────────────────────────────
    if education_raw:
        lines.append(r"\section*{EDUCATION}")
        # Split by double spaces or newlines  
        edu_entries = [l.strip() for l in re.split(r"  +|\n", education_raw) if l.strip()]
        for entry in edu_entries[:6]:
            lines.append(f"{T(entry)}\\\\")
        lines.append("")

    # ── Certifications ─────────────────────────────────────────────────────────
    if certifications:
        lines.append(r"\section*{CERTIFICATIONS}")
        lines.append(r"\begin{itemize}[leftmargin=*]")
        for cert in certifications:
            lines.append(f"\\item {T(cert)}")
        lines.append(r"\end{itemize}")
        lines.append("")

    # ── Achievements ──────────────────────────────────────────────────────────
    if achievements:
        lines.append(r"\section*{ACHIEVEMENTS}")
        lines.append(r"\begin{itemize}[leftmargin=*]")
        for ach in achievements:
            lines.append(f"\\item {T(ach)}")
        lines.append(r"\end{itemize}")
        lines.append("")

    # ── Declaration ───────────────────────────────────────────────────────────
    lines.append(r"\section*{DECLARATION}")
    lines.append(
        "I hereby declare that the above information correctly describes me "
        "and my qualification to the best of my knowledge."
    )
    lines.append("")
    lines.append(r"\end{document}")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Portfolio → Resume data mapper
# ─────────────────────────────────────────────────────────────────────────────

def profile_to_resume_data(profile) -> dict:
    """
    Convert a PortfolioProfile model instance to the dict format
    expected by generate_resume_pdf / generate_resume_latex.
    """
    name = f"{profile.first_name} {profile.last_name}".strip()
    skills = [img.name for img in profile.techstack_images.all()]

    experience = []
    for entry in profile.career_entries.all().order_by("order"):
        bullets = [b.strip() for b in entry.description.split("\n") if b.strip()]
        experience.append({
            "company": entry.company,
            "role": entry.role,
            "year": entry.year,
            "bullets": bullets,
            "description": entry.description,
        })

    achievements = []
    for proj in profile.projects.all().order_by("order"):
        ach = proj.title
        if proj.tools:
            ach += f" — {proj.tools}"
        achievements.append(ach)

    return {
        "name": name,
        "location": "",
        "email": profile.email,
        "phone": "",
        "linkedin": profile.linkedin_url,
        "github": profile.github_url,
        "summary": profile.about_text,
        "skills": skills,
        "experience": experience,
        "education": profile.education,
        "certifications": [],
        "achievements": achievements,
    }
