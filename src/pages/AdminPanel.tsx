import { useState, useEffect, useRef } from "react";
import { TEMPLATES, COMPONENT_VARIANTS } from "../themes/templates";

import { useNavigate } from "react-router-dom";
import "./AdminPanel.css";
import * as api from "../api/portfolio";
import type {
  PortfolioProfile,
  CareerEntry,
  Project,
  WhatIDoSection,
  TechStackImage,
  ParsedResume,
  EducationEntry,
  Certification,
  Achievement,
  PersonalProject,
} from "../api/portfolio";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "resume"
  | "templates"
  | "profile"
  | "career"
  | "projects"
  | "whatido"
  | "techstack"
  | "social"
  | "education"
  | "certifications"
  | "achievements"
  | "personal_projects";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notify(msg: string, type: "success" | "error" = "success") {
  const el = document.createElement("div");
  el.className = `ap-toast ap-toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("ap-toast-show"), 10);
  setTimeout(() => {
    el.classList.remove("ap-toast-show");
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

// ─── TextPreview – "View More" toggle for long text ──────────────────────────

function TextPreview({ text, maxLen = 200 }: { text: string; maxLen?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= maxLen) return <p className="ap-card-desc">{text}</p>;
  return (
    <p className="ap-card-desc">
      {expanded ? text : text.slice(0, maxLen) + "…"}
      <button
        className="ap-view-more-btn"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? " View less" : " View more"}
      </button>
    </p>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
// (Login is now handled by the dedicated /login page — see src/pages/Login.tsx)

// ─── Domain Help ──────────────────────────────────────────────────────────────

function DomainHelp({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const platformDomain = import.meta.env.VITE_MAIN_DOMAIN || "dotdevz.com";

  return (
    <div className="ap-domain-help">
      <button
        type="button"
        className="ap-domain-help-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? "▾" : "▸"}</span>
        How to set up your domains
      </button>

      {open && (
        <div className="ap-domain-help-body">

          {/* ── Free subdomain ── */}
          <section className="ap-dh-section">
            <h4>① Free subdomain — <code>{slug || "username"}.{platformDomain}</code></h4>
            <p>This is <strong>already active</strong>. No action needed.</p>
            <ol>
              <li>Your portfolio is live at exactly the URL shown in the banner above.</li>
              <li>Share it directly — anyone who opens it sees only your portfolio.</li>
            </ol>
            <div className="ap-dh-note">
              <strong>You (the admin)</strong> need to do this <strong>once</strong> on the server:
              <code className="ap-dh-code">
                # 1. DNS — add wildcard A record<br />
                *.{platformDomain}  →  your-server-ip<br />
                <br />
                # 2. Nginx wildcard TLS cert (interactive — needs DNS TXT record)<br />
                sudo bash deploy/setup-ssl.sh wildcard
              </code>
            </div>
          </section>

          {/* ── Custom domain ── */}
          <section className="ap-dh-section">
            <h4>② Custom domain — <code>johndoe.com</code></h4>
            <p>Use your own domain to show <em>your portfolio only</em>. Three steps:</p>
            <ol>
              <li>
                <strong>Enter your domain above</strong> (e.g. <code>johndoe.com</code>) and click
                Save Profile.
              </li>
              <li>
                <strong>Add a DNS record</strong> at your domain registrar / DNS provider:
                <table className="ap-dh-table">
                  <thead>
                    <tr><th>Type</th><th>Name / Host</th><th>Value</th><th>TTL</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>CNAME</code></td>
                      <td><code>@</code> <em>(or your domain)</em></td>
                      <td><code>{platformDomain}</code></td>
                      <td>Auto / 3600</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="ap-dh-or">
                        — or if your registrar doesn't allow CNAME at root —
                      </td>
                    </tr>
                    <tr>
                      <td><code>A</code></td>
                      <td><code>@</code></td>
                      <td><em>your-server-ip</em></td>
                      <td>Auto / 3600</td>
                    </tr>
                  </tbody>
                </table>
                DNS changes propagate in minutes to 48 hours.
              </li>
              <li>
                <strong>Add SSL for the domain</strong> — run this on the server:
                <code className="ap-dh-code">
                  sudo bash deploy/setup-ssl.sh add-custom johndoe.com
                </code>
                The script gets a free Let's Encrypt certificate and prints the nginx block to add.
                Until that's done, browsers will show a certificate warning (self-signed fallback).
              </li>
            </ol>
            <div className="ap-dh-note ap-dh-note--tip">
              <strong>Using Cloudflare?</strong> If your domain is on Cloudflare, enable the
              orange-cloud proxy. Cloudflare handles SSL automatically — skip step 3.
              Just point the CNAME to <code>{platformDomain}</code> with the proxy turned on.
            </div>
          </section>

          {/* ── How it works ── */}
          <section className="ap-dh-section">
            <h4>③ How it works (technical overview)</h4>
            <ul>
              <li>
                <strong>Subdomain:</strong> Nginx's wildcard block <code>*.{platformDomain}</code>
                catches the request. The frontend detects the subdomain and calls
                <code>/api/portfolio/by-host/</code>, which resolves it to your profile.
              </li>
              <li>
                <strong>Custom domain:</strong> Nginx catch-all block receives the request, passes
                <code>Host: {platformDomain}</code> to Django (so <code>ALLOWED_HOSTS</code> always
                passes) and sets <code>X-Custom-Domain: johndoe.com</code>. The Django view reads
                that header and looks up the matching profile.
              </li>
              <li>
                <strong>Routing is 100% automatic</strong> after the DNS record points to this
                server. No code changes, no redeploy.
              </li>
            </ul>
          </section>

        </div>
      )}
    </div>
  );
}

// ─── Profile Form ─────────────────────────────────────────────────────────────

function ProfileForm({ profile }: { profile: PortfolioProfile }) {
  const [form, setForm] = useState({
    first_name:       profile.first_name       ?? "",
    last_name:        profile.last_name        ?? "",
    title_prefix:     profile.title_prefix     ?? "",
    title_option1:    profile.title_option1    ?? "",
    title_option2:    profile.title_option2    ?? "",
    navbar_initials:  profile.navbar_initials  ?? "",
    about_text:       profile.about_text       ?? "",
    email:            profile.email            ?? "",
    copyright_year:   profile.copyright_year   ?? "",
    copyright_name:   profile.copyright_name   ?? "",
    custom_domain:    (profile.custom_domain   ?? "") as string,
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Build the shareable portfolio URL
  const portfolioSlug = profile.slug || profile.username || "";
  const shareUrl = portfolioSlug
    ? `${window.location.origin}/p/${portfolioSlug}`
    : "";

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  type FormKey = keyof typeof form;

  const change = (k: FormKey, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminProfile(form);
      notify("Profile saved!");
    } catch {
      notify("Failed to save profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: FormKey, type = "text", placeholder = "", required = false) => (
    <div className="ap-field" key={key}>
      <label>{label}{required && <span className="ap-required">*</span>}</label>
      <input
        type={type}
        value={(form[key] as string) ?? ""}
        onChange={(e) => change(key, e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  return (
    <form className="ap-form" onSubmit={save}>
      <h2>Profile &amp; Landing</h2>

      {/* ── Share link banner ── */}
      {shareUrl && (
        <div className="ap-share-banner">
          <div className="ap-share-banner-info">
            <span className="ap-share-banner-label">Your portfolio link</span>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ap-share-url"
            >
              {shareUrl}
            </a>
          </div>
          <button type="button" className="ap-btn-primary ap-btn-sm" onClick={copyLink}>
            {copied ? "Copied ✓" : "Copy Link"}
          </button>
        </div>
      )}

      <div className="ap-form-grid">
        {field("First Name", "first_name", "text", "Rajesh", true)}
        {field("Last Name", "last_name", "text", "Chityal", true)}
        {field("Title Prefix", "title_prefix", "text", "A Full Stack")}
        {field("Title Option 1", "title_option1", "text", "Developer", true)}
        {field("Title Option 2", "title_option2", "text", "Engineer", true)}
        {field("Navbar Initials", "navbar_initials", "text", "RC")}
      </div>
      <div className="ap-field">
        <label>About Text <span className="ap-required">*</span></label>
        <textarea
          value={form.about_text ?? ""}
          onChange={(e) => change("about_text", e.target.value)}
          rows={5}
          placeholder="Write a short bio about yourself..."
        />
      </div>
      <div className="ap-form-grid">
        {field("Email", "email", "email", "you@example.com", true)}
        {field("Copyright Year", "copyright_year", "text", "2025")}
        {field("Copyright Name", "copyright_name", "text", "Your Name")}
      </div>

      {/* ── Custom domain ── */}
      <div className="ap-field">
        <label>Custom Domain <span className="ap-field-hint">(optional — e.g. johndoe.com)</span></label>
        <input
          type="text"
          value={form.custom_domain}
          onChange={(e) => change("custom_domain", e.target.value)}
          placeholder="johndoe.com"
        />
        <p className="ap-field-desc">
          Point your domain's DNS CNAME record to this server, enter the domain here, and your
          portfolio will be served at that address automatically.
        </p>
      </div>

      {/* ── Domain setup help ── */}
      <DomainHelp slug={portfolioSlug} />

      <div className="ap-form-actions">
        <button type="submit" className="ap-btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </form>
  );
}

// ─── Career Form ──────────────────────────────────────────────────────────────

function CareerForm() {
  const [entries, setEntries] = useState<CareerEntry[]>([]);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Omit<CareerEntry, "id">>({
    role: "",
    company: "",
    year: "",
    description: "",
    order: 0,
  });

  useEffect(() => {
    api.getCareerEntries().then(setEntries).catch(() => {});
  }, []);

  const openNew = () => {
    setForm({ role: "", company: "", year: "", description: "", order: entries.length });
    setEditId("new");
  };

  const openEdit = (entry: CareerEntry) => {
    setForm({ role: entry.role, company: entry.company, year: entry.year, description: entry.description, order: entry.order });
    setEditId(entry.id!);
  };

  const cancel = () => setEditId(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId === "new") {
        const created = await api.createCareerEntry(form as CareerEntry);
        setEntries((prev) => [...prev, created]);
        notify("Career entry added!");
      } else {
        const updated = await api.updateCareerEntry(editId as number, form);
        setEntries((prev) => prev.map((e) => (e.id === editId ? updated : e)));
        notify("Career entry updated!");
      }
      setEditId(null);
    } catch {
      notify("Failed to save entry.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this career entry?")) return;
    try {
      await api.deleteCareerEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      notify("Deleted.");
    } catch {
      notify("Failed to delete.", "error");
    }
  };

  return (
    <div className="ap-list-section">
      <div className="ap-list-header">
        <h2>Career &amp; Experience</h2>
        <button className="ap-btn-secondary" onClick={openNew}>+ Add Entry</button>
      </div>

      {editId !== null && (
        <form className="ap-form ap-form-inline" onSubmit={save}>
          <h3>{editId === "new" ? "New Entry" : "Edit Entry"}</h3>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label>Role <span className="ap-required">*</span></label>
              <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Full Stack Developer" required />
            </div>
            <div className="ap-field">
              <label>Company <span className="ap-required">*</span></label>
              <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Company Name" required />
            </div>
            <div className="ap-field">
              <label>Year <span className="ap-required">*</span></label>
              <input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} placeholder="2023 or NOW" required />
            </div>
            <div className="ap-field">
              <label>Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: +e.target.value }))} />
            </div>
          </div>
          <div className="ap-field">
            <label>Description <span className="ap-required">*</span></label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe your role and achievements..." required />
          </div>
          <div className="ap-form-actions">
            <button type="submit" className="ap-btn-primary">Save</button>
            <button type="button" className="ap-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="ap-cards">
        {entries.map((entry) => (
          <div className="ap-card" key={entry.id}>
            <div className="ap-card-main">
              <strong>{entry.role}</strong>
              <span className="ap-card-meta">{entry.company} · {entry.year}</span>
              <TextPreview text={entry.description} maxLen={200} />
            </div>
            <div className="ap-card-actions">
              <button className="ap-btn-edit" onClick={() => openEdit(entry)}>Edit</button>
              <button className="ap-btn-delete" onClick={() => remove(entry.id!)}>Delete</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && !editId && (
          <p className="ap-empty">No career entries yet. Click "Add Entry" to get started.</p>
        )}
      </div>
    </div>
  );
}

// ─── Projects Form ────────────────────────────────────────────────────────────

function ProjectsForm() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Omit<Project, "id">>({
    title: "",
    category: "",
    tools: "",
    image_url: "",
    project_url: "",
    order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getProjects().then(setProjects).catch(() => {});
  }, []);

  const openNew = () => {
    setForm({ title: "", category: "", tools: "", image_url: "", project_url: "", order: projects.length });
    setImageFile(null);
    setEditId("new");
  };

  const openEdit = (p: Project) => {
    setForm({ title: p.title, category: p.category, tools: p.tools, image_url: p.image_url, project_url: p.project_url, order: p.order });
    setImageFile(null);
    setEditId(p.id!);
  };

  const cancel = () => { setEditId(null); setImageFile(null); };

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId === "new") {
        const created = await api.createProject(buildFormData());
        setProjects((prev) => [...prev, created]);
        notify("Project added!");
      } else {
        const updated = await api.updateProject(editId as number, buildFormData());
        setProjects((prev) => prev.map((p) => (p.id === editId ? updated : p)));
        notify("Project updated!");
      }
      setEditId(null);
      setImageFile(null);
    } catch {
      notify("Failed to save project.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      notify("Deleted.");
    } catch {
      notify("Failed to delete.", "error");
    }
  };

  return (
    <div className="ap-list-section">
      <div className="ap-list-header">
        <h2>Projects / Work</h2>
        <button className="ap-btn-secondary" onClick={openNew}>+ Add Project</button>
      </div>

      {editId !== null && (
        <form className="ap-form ap-form-inline" onSubmit={save}>
          <h3>{editId === "new" ? "New Project" : "Edit Project"}</h3>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label>Title <span className="ap-required">*</span></label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Project Name" required />
            </div>
            <div className="ap-field">
              <label>Category <span className="ap-required">*</span></label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="E-Commerce, CRM…" required />
            </div>
            <div className="ap-field">
              <label>Tools &amp; Features <span className="ap-required">*</span></label>
              <input value={form.tools} onChange={(e) => setForm((f) => ({ ...f, tools: e.target.value }))} placeholder="React.js, NestJS, MongoDB" required />
            </div>
            <div className="ap-field">
              <label>Project URL</label>
              <input type="url" value={form.project_url} onChange={(e) => setForm((f) => ({ ...f, project_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="ap-field">
              <label>Image URL (or upload below)</label>
              <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="/images/myproject.png" />
            </div>
            <div className="ap-field">
              <label>Upload Image</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
              {imageFile && <span className="ap-file-name">{imageFile.name}</span>}
            </div>
            <div className="ap-field">
              <label>Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: +e.target.value }))} />
            </div>
          </div>
          <div className="ap-form-actions">
            <button type="submit" className="ap-btn-primary">Save</button>
            <button type="button" className="ap-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="ap-cards">
        {projects.map((p) => (
          <div className="ap-card" key={p.id}>
            {(p.image_display || p.image_url) && (
              <img
                src={p.image_display || p.image_url}
                alt={p.title}
                className="ap-card-img"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="ap-card-main">
              <strong>{p.title}</strong>
              <span className="ap-card-meta">{p.category}</span>
              <p className="ap-card-desc">{p.tools}</p>
            </div>
            <div className="ap-card-actions">
              <button className="ap-btn-edit" onClick={() => openEdit(p)}>Edit</button>
              <button className="ap-btn-delete" onClick={() => remove(p.id!)}>Delete</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && !editId && (
          <p className="ap-empty">No projects yet. Click "Add Project" to get started.</p>
        )}
      </div>
    </div>
  );
}

// ─── What I Do Form ───────────────────────────────────────────────────────────

function WhatIDoForm() {
  const [sections, setSections] = useState<WhatIDoSection[]>([]);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Omit<WhatIDoSection, "id">>({
    category: "",
    title: "",
    description: "",
    tags: [],
    order: 0,
  });
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    api.getWhatIDo().then(setSections).catch(() => {});
  }, []);

  const openNew = () => {
    setForm({ category: "", title: "", description: "", tags: [], order: sections.length });
    setTagsInput("");
    setEditId("new");
  };

  const openEdit = (s: WhatIDoSection) => {
    setForm({ category: s.category, title: s.title, description: s.description, tags: s.tags, order: s.order });
    setTagsInput(s.tags.join(", "));
    setEditId(s.id!);
  };

  const cancel = () => setEditId(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload = { ...form, tags };
    try {
      if (editId === "new") {
        const created = await api.createWhatIDoSection(payload as WhatIDoSection);
        setSections((prev) => [...prev, created]);
        notify("Section added!");
      } else {
        const updated = await api.updateWhatIDoSection(editId as number, payload);
        setSections((prev) => prev.map((s) => (s.id === editId ? updated : s)));
        notify("Section updated!");
      }
      setEditId(null);
    } catch {
      notify("Failed to save section.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this section?")) return;
    try {
      await api.deleteWhatIDoSection(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      notify("Deleted.");
    } catch {
      notify("Failed to delete.", "error");
    }
  };

  return (
    <div className="ap-list-section">
      <div className="ap-list-header">
        <h2>What I Do</h2>
        <button className="ap-btn-secondary" onClick={openNew}>+ Add Section</button>
      </div>

      {editId !== null && (
        <form className="ap-form ap-form-inline" onSubmit={save}>
          <h3>{editId === "new" ? "New Section" : "Edit Section"}</h3>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label>Category (e.g. FRONTEND) <span className="ap-required">*</span></label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="FRONTEND" required />
            </div>
            <div className="ap-field">
              <label>Subtitle <span className="ap-required">*</span></label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Building Interactive UIs" required />
            </div>
            <div className="ap-field">
              <label>Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: +e.target.value }))} />
            </div>
          </div>
          <div className="ap-field">
            <label>Description <span className="ap-required">*</span></label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} required />
          </div>
          <div className="ap-field">
            <label>Skills / Tags (comma separated)</label>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="React.js, TypeScript, CSS3" />
          </div>
          <div className="ap-form-actions">
            <button type="submit" className="ap-btn-primary">Save</button>
            <button type="button" className="ap-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="ap-cards">
        {sections.map((s) => (
          <div className="ap-card" key={s.id}>
            <div className="ap-card-main">
              <strong>{s.category}</strong>
              <span className="ap-card-meta">{s.title}</span>
              <TextPreview text={s.description} maxLen={180} />
              <div className="ap-tags-row">
                {s.tags.map((t, i) => <span className="ap-tag" key={i}>{t}</span>)}
              </div>
            </div>
            <div className="ap-card-actions">
              <button className="ap-btn-edit" onClick={() => openEdit(s)}>Edit</button>
              <button className="ap-btn-delete" onClick={() => remove(s.id!)}>Delete</button>
            </div>
          </div>
        ))}
        {sections.length === 0 && !editId && (
          <p className="ap-empty">No sections yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Tech Stack Form ──────────────────────────────────────────────────────────

function TechStackForm({ profile, onProfileChange }: { profile: PortfolioProfile; onProfileChange: (p: PortfolioProfile) => void }) {
  const [images, setImages] = useState<TechStackImage[]>([]);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Omit<TechStackImage, "id">>({
    name: "",
    image_url: "",
    order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [brightness, setBrightness] = useState<number>(profile.techstack_brightness ?? 1.0);
  const [brightnessSaving, setBrightnessSaving] = useState(false);

  useEffect(() => {
    api.getTechStack().then(setImages).catch(() => {});
  }, []);

  const openNew = () => {
    setForm({ name: "", image_url: "", order: images.length });
    setImageFile(null);
    setEditId("new");
  };

  const openEdit = (img: TechStackImage) => {
    setForm({ name: img.name, image_url: img.image_url, order: img.order });
    setImageFile(null);
    setEditId(img.id!);
  };

  const cancel = () => { setEditId(null); setImageFile(null); };

  const saveBrightness = async (val: number) => {
    setBrightnessSaving(true);
    try {
      await api.updateAdminProfile({ techstack_brightness: val });
      onProfileChange({ ...profile, techstack_brightness: val });
    } catch {
      notify("Failed to save brightness.", "error");
    } finally {
      setBrightnessSaving(false);
    }
  };

  const buildFd = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const isDuplicate = images.some(
      (i) => i.name.trim().toLowerCase() === form.name.trim().toLowerCase() && i.id !== editId
    );
    if (isDuplicate) {
      notify(`"${form.name}" already exists in your tech stack.`, "error");
      return;
    }
    try {
      if (editId === "new") {
        const created = await api.createTechStackImage(buildFd());
        setImages((prev) => [...prev, created]);
        notify("Tech image added!");
      } else {
        const updated = await api.updateTechStackImage(editId as number, buildFd());
        setImages((prev) => prev.map((i) => (i.id === editId ? updated : i)));
        notify("Tech image updated!");
      }
      setEditId(null);
      setImageFile(null);
    } catch {
      notify("Failed to save.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this tech image?")) return;
    try {
      await api.deleteTechStackImage(id);
      setImages((prev) => prev.filter((i) => i.id !== id));
      notify("Deleted.");
    } catch {
      notify("Failed to delete.", "error");
    }
  };

  return (
    <div className="ap-list-section">
      <div className="ap-list-header">
        <h2>Tech Stack Images</h2>
        <button className="ap-btn-secondary" onClick={openNew}>+ Add Image</button>
      </div>

      {/* Brightness control */}
      <div className="ap-form ap-form-inline" style={{ marginBottom: "1.5rem" }}>
        <h3>Ball Brightness</h3>
        <div className="ap-field">
          <label>
            Brightness: <strong>{brightness.toFixed(2)}</strong>
            {brightnessSaving && <span style={{ marginLeft: 8, opacity: 0.6, fontSize: "0.85em" }}>Saving…</span>}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ opacity: 0.5, fontSize: "0.8em" }}>Dim</span>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.05}
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
              onMouseUp={(e) => saveBrightness(parseFloat((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => saveBrightness(parseFloat((e.target as HTMLInputElement).value))}
              style={{ flex: 1, cursor: "pointer" }}
            />
            <span style={{ opacity: 0.5, fontSize: "0.8em" }}>Bright</span>
          </div>
        </div>
      </div>

      {editId !== null && (
        <form className="ap-form ap-form-inline" onSubmit={save}>
          <h3>{editId === "new" ? "New Tech Image" : "Edit Tech Image"}</h3>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label>Technology Name <span className="ap-required">*</span></label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="React.js" required />
            </div>
            <div className="ap-field">
              <label>Image URL</label>
              <input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="/images/react2.webp" />
            </div>
            <div className="ap-field">
              <label>Upload Image</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
              {imageFile && <span className="ap-file-name">{imageFile.name}</span>}
            </div>
            <div className="ap-field">
              <label>Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: +e.target.value }))} />
            </div>
          </div>
          <div className="ap-form-actions">
            <button type="submit" className="ap-btn-primary">Save</button>
            <button type="button" className="ap-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="ap-tech-grid">
        {images.map((img) => (
          <div className="ap-tech-card" key={img.id}>
            <img
              src={img.image_display || img.image_url}
              alt={img.name}
              className="ap-tech-img"
              onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23222'/%3E%3Ctext x='50%25' y='50%25' fill='%23666' font-size='10' text-anchor='middle' dy='.3em'%3EIMG%3C/text%3E%3C/svg%3E"; }}
            />
            <span className="ap-tech-name">{img.name}</span>
            <div className="ap-card-actions">
              <button className="ap-btn-edit" onClick={() => openEdit(img)}>Edit</button>
              <button className="ap-btn-delete" onClick={() => remove(img.id!)}>✕</button>
            </div>
          </div>
        ))}
        {images.length === 0 && !editId && (
          <p className="ap-empty">No tech stack images yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Social & Links Form ──────────────────────────────────────────────────────

function SocialForm({ profile }: { profile: PortfolioProfile }) {
  const [form, setForm] = useState({
    github_url: profile.github_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    twitter_url: profile.twitter_url ?? "",
    instagram_url: profile.instagram_url ?? "",
    resume_url: profile.resume_url ?? "",
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminProfile(form);
      notify("Social links saved!");
    } catch {
      notify("Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="ap-form" onSubmit={save}>
      <h2>Social Links &amp; Resume</h2>
      <div className="ap-form-grid">
        {(
          [
            ["GitHub URL", "github_url"],
            ["LinkedIn URL", "linkedin_url"],
            ["Twitter / X URL", "twitter_url"],
            ["Instagram URL", "instagram_url"],
            ["Resume URL", "resume_url"],
          ] as [string, keyof typeof form][]
        ).map(([label, key]) => (
          <div className="ap-field" key={key}>
            <label>{label}</label>
            <input
              type="url"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        ))}
      </div>
      <div className="ap-form-actions">
        <button type="submit" className="ap-btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save Links"}
        </button>
      </div>
    </form>
  );
}

// ─── Resume Section ───────────────────────────────────────────────────────────

function ResumeSection({ profile, onProfileUpdate }: {
  profile: PortfolioProfile;
  onProfileUpdate: (updated: PortfolioProfile) => void;
}) {
  const [tab, setTab] = useState<"upload" | "generate">("upload");

  // Upload / parse state
  const [parseFile, setParseFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [applying, setApplying] = useState(false);

  // Upload-to-store state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Generate state
  const [generating, setGenerating] = useState<"" | "pdf" | "latex">("");

  const parseRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleParse = async () => {
    if (!parseFile) return;
    setParsing(true);
    setParsed(null);
    try {
      const result = await api.parseResume(parseFile);
      setParsed(result);
      notify("Resume parsed! Review and click 'Apply to Portfolio'.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e?.response?.data?.detail || "Failed to parse resume.";
      notify(msg, "error");
    } finally {
      setParsing(false);
    }
  };

  const handleApply = async () => {
    if (!parsed) return;
    setApplying(true);
    const errors: string[] = [];

    // ── 1. Profile fields ──────────────────────────────────────────────────
    try {
      if (parsed.profile && Object.keys(parsed.profile).length > 0) {
        const updates: Partial<PortfolioProfile> = {};
        const pf = parsed.profile;
        if (pf.first_name) updates.first_name = pf.first_name.slice(0, 100);
        if (pf.last_name)  updates.last_name  = pf.last_name.slice(0, 100);
        if (pf.email)      updates.email      = pf.email.slice(0, 254);
        if (pf.about_text) updates.about_text = pf.about_text;
        if (pf.education)  updates.education  = pf.education.slice(0, 300);
        if (pf.github_url)   updates.github_url   = pf.github_url.slice(0, 200);
        if (pf.linkedin_url) updates.linkedin_url = pf.linkedin_url.slice(0, 200);
        if (Object.keys(updates).length > 0) {
          await api.updateAdminProfile(updates);
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } };
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(err);
      errors.push(`Profile: ${msg}`);
    }

    // ── 2. Career entries (appended) ───────────────────────────────────────
    for (let i = 0; i < parsed.career.length; i++) {
      const entry = parsed.career[i];
      try {
        await api.createCareerEntry({
          role:        (entry.role    || "Unknown Role").slice(0, 200),
          company:     (entry.company || "Unknown Company").slice(0, 200),
          year:        (entry.year    || "").slice(0, 60),
          description: entry.description || "",
          order:       (profile.career_entries?.length ?? 0) + i,
        });
      } catch (err: unknown) {
        const e = err as { response?: { data?: unknown } };
        const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(err);
        errors.push(`Career entry "${entry.role || entry.company}": ${msg}`);
      }
    }

    // ── 3. Projects ────────────────────────────────────────────────────────
    for (let i = 0; i < parsed.projects.length; i++) {
      const proj = parsed.projects[i];
      try {
        const fd = new FormData();
        fd.append("title",       (proj.title    || "Project").slice(0, 200));
        fd.append("category",    (proj.category || "Project").slice(0, 200));
        fd.append("tools",       (proj.tools    || "").slice(0, 500));
        fd.append("image_url",   "");
        fd.append("project_url", "");
        fd.append("order",       String((profile.projects?.length ?? 0) + i));
        await api.createProject(fd);
      } catch (err: unknown) {
        const e = err as { response?: { data?: unknown } };
        const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(err);
        errors.push(`Project "${proj.title}": ${msg}`);
      }
    }

    // ── 4. Skills → TechStack entries ─────────────────────────────────────
    const existingSkillNames = new Set(
      (profile.techstack_images ?? []).map((t) => t.name.trim().toLowerCase())
    );
    for (let i = 0; i < parsed.skills.length; i++) {
      const skill = parsed.skills[i];
      if (existingSkillNames.has(skill.trim().toLowerCase())) continue;
      existingSkillNames.add(skill.trim().toLowerCase());
      try {
        const fd = new FormData();
        fd.append("name",      skill.slice(0, 100));
        fd.append("image_url", "");
        fd.append("order",     String((profile.techstack_images?.length ?? 0) + i));
        await api.createTechStackImage(fd);
      } catch {
        // Non-fatal: skip individual skill failures silently
      }
    }

    // ── 5. Education entries ───────────────────────────────────────────────
    for (let i = 0; i < (parsed.education_entries ?? []).length; i++) {
      const edu = parsed.education_entries[i];
      try {
        await api.createEducationEntry({
          degree:      (edu.degree      || "").slice(0, 300),
          institution: (edu.institution || "").slice(0, 300),
          year:        (edu.year        || "").slice(0, 20),
          grade:       (edu.grade       || "").slice(0, 100),
          order:       (profile.education_entries?.length ?? 0) + i,
        });
      } catch (err: unknown) {
        const e = err as { response?: { data?: unknown } };
        const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(err);
        errors.push(`Education "${edu.degree}": ${msg}`);
      }
    }

    // ── 6. Certifications ─────────────────────────────────────────────────
    for (let i = 0; i < (parsed.certifications ?? []).length; i++) {
      const cert = parsed.certifications[i];
      try {
        await api.createCertification({
          title:  (cert.title  || "").slice(0, 300),
          issuer: (cert.issuer || "").slice(0, 200),
          year:   (cert.year   || "").slice(0, 20),
          order:  (profile.certifications?.length ?? 0) + i,
        });
      } catch (err: unknown) {
        const e = err as { response?: { data?: unknown } };
        const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(err);
        errors.push(`Certification "${cert.title}": ${msg}`);
      }
    }

    // ── 7. Achievements ───────────────────────────────────────────────────
    for (let i = 0; i < (parsed.achievements ?? []).length; i++) {
      const ach = parsed.achievements[i];
      try {
        await api.createAchievement({
          text:  (ach.text || "").slice(0, 500),
          order: (profile.achievements?.length ?? 0) + i,
        });
      } catch (err: unknown) {
        const e = err as { response?: { data?: unknown } };
        const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(err);
        errors.push(`Achievement: ${msg}`);
      }
    }

    // ── Done ───────────────────────────────────────────────────────────────
    if (errors.length === 0) {
      notify("Portfolio updated from resume! Reload sections to see changes.", "success");
    } else {
      // Show first error but still report partial success
      notify(
        `Applied with ${errors.length} issue(s): ${errors[0].slice(0, 120)}`,
        "error"
      );
      console.error("Resume apply errors:", errors);
    }

    try {
      const updated = await api.getAdminProfile();
      onProfileUpdate(updated);
    } catch { /* ignore */ }
    setParsed(null);
    setParseFile(null);
    setApplying(false);
  };

  const handleUploadResume = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const res = await api.uploadResume(uploadFile);
      notify("Resume uploaded! Resume link updated.");
      onProfileUpdate({ ...profile, resume_url: res.resume_url });
      setUploadFile(null);
    } catch {
      notify("Failed to upload resume.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async (fmt: "pdf" | "latex") => {
    setGenerating(fmt);
    try {
      const resp = await api.generateResume(fmt);
      const blob =
        fmt === "pdf"
          ? new Blob([resp.data], { type: "application/pdf" })
          : new Blob([resp.data], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fmt === "pdf" ? "resume.pdf" : "resume.tex";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
      notify(`${fmt.toUpperCase()} resume downloaded!`);
    } catch {
      notify("Failed to generate resume.", "error");
    } finally {
      setGenerating("");
    }
  };

  return (
    <div className="ap-resume-section">
      <h2>Resume</h2>
      <p className="ap-resume-intro">
        Upload your existing resume PDF to auto-fill the portfolio, or generate a
        polished resume PDF / LaTeX source from your portfolio data.
      </p>

      <div className="ap-resume-tabs">
        <button
          className={`ap-resume-tab ${tab === "upload" ? "active" : ""}`}
          onClick={() => setTab("upload")}
        >
          📄 Upload &amp; Auto-fill
        </button>
        <button
          className={`ap-resume-tab ${tab === "generate" ? "active" : ""}`}
          onClick={() => setTab("generate")}
        >
          ⬇️ Generate Resume
        </button>
      </div>

      {tab === "upload" && (
        <div className="ap-resume-panel">
          {/* Parse & Auto-fill */}
          <div className="ap-resume-card">
            <h3>Auto-fill from Resume PDF</h3>
            <p className="ap-resume-hint">
              Upload your resume PDF and we'll extract your name, summary, experience,
              projects, and skills to pre-fill the portfolio.
            </p>
            <div className="ap-resume-upload-row">
              <input
                ref={parseRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => setParseFile(e.target.files?.[0] ?? null)}
              />
              <button className="ap-btn-secondary" onClick={() => parseRef.current?.click()}>
                {parseFile ? `📎 ${parseFile.name}` : "Choose PDF"}
              </button>
              <button
                className="ap-btn-primary"
                onClick={handleParse}
                disabled={!parseFile || parsing}
              >
                {parsing ? "Parsing…" : "Parse Resume"}
              </button>
            </div>

            {parsed && (
              <div className="ap-parsed-preview">
                <h4>Extracted Data Preview</h4>
                {parsed.profile && Object.keys(parsed.profile).length > 0 && (
                  <div className="ap-parsed-group">
                    <strong>Profile Fields</strong>
                    {parsed.profile.first_name && <div>Name: {parsed.profile.first_name} {parsed.profile.last_name}</div>}
                    {parsed.profile.email && <div>Email: {parsed.profile.email}</div>}
                    {parsed.profile.linkedin_url && <div>LinkedIn: {parsed.profile.linkedin_url}</div>}
                    {parsed.profile.github_url && <div>GitHub: {parsed.profile.github_url}</div>}
                    {parsed.profile.education && <div>Education: <TextPreview text={parsed.profile.education} maxLen={120} /></div>}
                    {parsed.profile.about_text && (
                      <div>Summary: <TextPreview text={parsed.profile.about_text} maxLen={200} /></div>
                    )}
                  </div>
                )}
                {parsed.career.length > 0 && (
                  <div className="ap-parsed-group">
                    <strong>Career Entries ({parsed.career.length})</strong>
                    {parsed.career.map((c, i) => (
                      <div key={i} className="ap-parsed-item">
                        <span className="ap-parsed-role">{c.role}</span> @{" "}
                        <span>{c.company}</span>
                        {c.year && <span className="ap-parsed-year"> · {c.year}</span>}
                        {c.description && <TextPreview text={c.description} maxLen={150} />}
                      </div>
                    ))}
                  </div>
                )}
                {parsed.skills.length > 0 && (
                  <div className="ap-parsed-group">
                    <strong>Skills Detected ({parsed.skills.length})</strong>
                    <div className="ap-tags-row ap-parsed-skills">
                      {parsed.skills.map((s, i) => <span className="ap-tag" key={i}>{s}</span>)}
                    </div>
                  </div>
                )}
                {parsed.projects.length > 0 && (
                  <div className="ap-parsed-group">
                    <strong>Projects ({parsed.projects.length})</strong>
                    {parsed.projects.map((p, i) => (
                      <div key={i} className="ap-parsed-item">
                        <span className="ap-parsed-role">{p.title}</span>
                        {p.tools && <TextPreview text={p.tools} maxLen={100} />}
                      </div>
                    ))}
                  </div>
                )}
                {(parsed.education_entries ?? []).length > 0 && (
                  <div className="ap-parsed-group">
                    <strong>Education ({parsed.education_entries.length})</strong>
                    {parsed.education_entries.map((e, i) => (
                      <div key={i} className="ap-parsed-item">
                        <span className="ap-parsed-role">{e.degree}</span>
                        {e.institution && <span> — {e.institution}</span>}
                        {e.year && <span className="ap-parsed-year"> · {e.year}</span>}
                        {e.grade && <span className="ap-parsed-year"> · {e.grade}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {(parsed.certifications ?? []).length > 0 && (
                  <div className="ap-parsed-group">
                    <strong>Certifications ({parsed.certifications.length})</strong>
                    {parsed.certifications.map((c, i) => (
                      <div key={i} className="ap-parsed-item">
                        <span className="ap-parsed-role">{c.title}</span>
                        {c.issuer && <span> — {c.issuer}</span>}
                        {c.year && <span className="ap-parsed-year"> · {c.year}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {(parsed.achievements ?? []).length > 0 && (
                  <div className="ap-parsed-group">
                    <strong>Achievements ({parsed.achievements.length})</strong>
                    {parsed.achievements.map((a, i) => (
                      <div key={i} className="ap-parsed-item">
                        <TextPreview text={a.text} maxLen={150} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="ap-resume-actions">
                  <button className="ap-btn-primary" onClick={handleApply} disabled={applying}>
                    {applying ? "Applying…" : "✅ Apply to Portfolio"}
                  </button>
                  <button className="ap-btn-ghost" onClick={() => { setParsed(null); setParseFile(null); }}>
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Store Resume PDF */}
          <div className="ap-resume-card" style={{ marginTop: "1.5rem" }}>
            <h3>Attach Resume to Portfolio</h3>
            <p className="ap-resume-hint">
              Upload your resume PDF to store it and auto-set the Resume Link shown
              on your portfolio website.
            </p>
            {profile.resume_url && (
              <p className="ap-resume-current">
                Current resume:{" "}
                <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                  {profile.resume_url.length > 60
                    ? "…" + profile.resume_url.slice(-50)
                    : profile.resume_url}
                </a>
              </p>
            )}
            <div className="ap-resume-upload-row">
              <input
                ref={uploadRef}
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <button className="ap-btn-secondary" onClick={() => uploadRef.current?.click()}>
                {uploadFile ? `📎 ${uploadFile.name}` : "Choose PDF"}
              </button>
              <button
                className="ap-btn-primary"
                onClick={handleUploadResume}
                disabled={!uploadFile || uploading}
              >
                {uploading ? "Uploading…" : "Upload & Attach"}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "generate" && (
        <div className="ap-resume-panel">
          <div className="ap-resume-card">
            <h3>Generate Resume from Portfolio</h3>
            <p className="ap-resume-hint">
              We'll compile all your portfolio data — name, summary, career, skills,
              and projects — into a formatted resume document.
            </p>
            <div className="ap-resume-generate-grid">
              <div className="ap-gen-option">
                <div className="ap-gen-icon">📄</div>
                <h4>PDF Resume</h4>
                <p>Professional PDF ready to share.</p>
                <button
                  className="ap-btn-primary"
                  onClick={() => handleGenerate("pdf")}
                  disabled={generating === "pdf"}
                >
                  {generating === "pdf" ? "Generating…" : "Download PDF"}
                </button>
              </div>
              <div className="ap-gen-option">
                <div className="ap-gen-icon">🖊️</div>
                <h4>LaTeX Source (.tex)</h4>
                <p>Compile with pdflatex / Overleaf for full control.</p>
                <button
                  className="ap-btn-secondary"
                  onClick={() => handleGenerate("latex")}
                  disabled={generating === "latex"}
                >
                  {generating === "latex" ? "Generating…" : "Download .tex"}
                </button>
              </div>
            </div>
            <p className="ap-resume-hint" style={{ marginTop: "1rem" }}>
              💡 To compile the .tex file: upload to{" "}
              <a href="https://overleaf.com" target="_blank" rel="noopener noreferrer">Overleaf</a>
              , or run <code>pdflatex resume.tex</code> locally if LaTeX is installed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Visibility Toggle ────────────────────────────────────────────────────────

function VisibilityToggle({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: "show_education" | "show_certifications" | "show_achievements" | "show_personal_projects";
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      await api.updateAdminProfile({ [fieldKey]: !value } as Partial<PortfolioProfile>);
      onChange(!value);
      notify(!value ? "Section now visible on website." : "Section hidden from website.");
    } catch {
      notify("Failed to update visibility.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ap-visibility-row">
      <span className="ap-visibility-label">Show on website</span>
      <button
        type="button"
        className={`ap-toggle ${value ? "ap-toggle-on" : "ap-toggle-off"}`}
        onClick={toggle}
        disabled={saving}
      >
        {value ? "✓ Visible" : "✗ Hidden"}
      </button>
    </div>
  );
}

// ─── Education Form ───────────────────────────────────────────────────────────

function EducationForm({ profile, onProfileChange }: { profile: PortfolioProfile; onProfileChange: (p: PortfolioProfile) => void }) {
  const [entries, setEntries] = useState<EducationEntry[]>([]);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Omit<EducationEntry, "id">>({
    degree: "", institution: "", year: "", grade: "", order: 0,
  });

  useEffect(() => {
    api.getEducation().then(setEntries).catch(() => {});
  }, []);

  const openNew = () => {
    setForm({ degree: "", institution: "", year: "", grade: "", order: entries.length });
    setEditId("new");
  };

  const openEdit = (e: EducationEntry) => {
    setForm({ degree: e.degree, institution: e.institution, year: e.year, grade: e.grade, order: e.order });
    setEditId(e.id!);
  };

  const cancel = () => setEditId(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId === "new") {
        const created = await api.createEducationEntry(form as EducationEntry);
        setEntries((prev) => [...prev, created]);
        notify("Education entry added!");
      } else {
        const updated = await api.updateEducationEntry(editId as number, form);
        setEntries((prev) => prev.map((x) => (x.id === editId ? updated : x)));
        notify("Education entry updated!");
      }
      setEditId(null);
    } catch {
      notify("Failed to save entry.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this education entry?")) return;
    try {
      await api.deleteEducationEntry(id);
      setEntries((prev) => prev.filter((x) => x.id !== id));
      notify("Deleted.");
    } catch {
      notify("Failed to delete.", "error");
    }
  };

  return (
    <div className="ap-list-section">
      <div className="ap-list-header">
        <h2>Education</h2>
        <div className="ap-list-header-right">
          <VisibilityToggle
            fieldKey="show_education"
            value={profile.show_education ?? true}
            onChange={(v) => onProfileChange({ ...profile, show_education: v })}
          />
          <button className="ap-btn-secondary" onClick={openNew}>+ Add Entry</button>
        </div>
      </div>

      {editId !== null && (
        <form className="ap-form ap-form-inline" onSubmit={save}>
          <h3>{editId === "new" ? "New Entry" : "Edit Entry"}</h3>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label>Degree / Qualification <span className="ap-required">*</span></label>
              <input value={form.degree} onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))} placeholder="B.Tech Computer Science" required />
            </div>
            <div className="ap-field">
              <label>Institution <span className="ap-required">*</span></label>
              <input value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} placeholder="University / School Name" required />
            </div>
            <div className="ap-field">
              <label>Year</label>
              <input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} placeholder="2023" />
            </div>
            <div className="ap-field">
              <label>Grade / Score</label>
              <input value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} placeholder="8.5 CGPA or 85%" />
            </div>
            <div className="ap-field">
              <label>Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: +e.target.value }))} />
            </div>
          </div>
          <div className="ap-form-actions">
            <button type="submit" className="ap-btn-primary">Save</button>
            <button type="button" className="ap-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="ap-cards">
        {entries.map((entry) => (
          <div className="ap-card" key={entry.id}>
            <div className="ap-card-main">
              <strong>{entry.degree}</strong>
              <span className="ap-card-meta">{entry.institution}{entry.year ? ` · ${entry.year}` : ""}</span>
              {entry.grade && <p className="ap-card-desc">Grade: {entry.grade}</p>}
            </div>
            <div className="ap-card-actions">
              <button className="ap-btn-edit" onClick={() => openEdit(entry)}>Edit</button>
              <button className="ap-btn-delete" onClick={() => remove(entry.id!)}>Delete</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && !editId && (
          <p className="ap-empty">No education entries yet. Click "Add Entry" to get started.</p>
        )}
      </div>
    </div>
  );
}

// ─── Certifications Form ──────────────────────────────────────────────────────

function CertificationsForm({ profile, onProfileChange }: { profile: PortfolioProfile; onProfileChange: (p: PortfolioProfile) => void }) {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Omit<Certification, "id">>({
    title: "", issuer: "", year: "", order: 0,
  });

  useEffect(() => {
    api.getCertifications().then(setCerts).catch(() => {});
  }, []);

  const openNew = () => {
    setForm({ title: "", issuer: "", year: "", order: certs.length });
    setEditId("new");
  };

  const openEdit = (c: Certification) => {
    setForm({ title: c.title, issuer: c.issuer, year: c.year, order: c.order });
    setEditId(c.id!);
  };

  const cancel = () => setEditId(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId === "new") {
        const created = await api.createCertification(form as Certification);
        setCerts((prev) => [...prev, created]);
        notify("Certification added!");
      } else {
        const updated = await api.updateCertification(editId as number, form);
        setCerts((prev) => prev.map((x) => (x.id === editId ? updated : x)));
        notify("Certification updated!");
      }
      setEditId(null);
    } catch {
      notify("Failed to save certification.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this certification?")) return;
    try {
      await api.deleteCertification(id);
      setCerts((prev) => prev.filter((x) => x.id !== id));
      notify("Deleted.");
    } catch {
      notify("Failed to delete.", "error");
    }
  };

  return (
    <div className="ap-list-section">
      <div className="ap-list-header">
        <h2>Certifications</h2>
        <div className="ap-list-header-right">
          <VisibilityToggle
            fieldKey="show_certifications"
            value={profile.show_certifications ?? true}
            onChange={(v) => onProfileChange({ ...profile, show_certifications: v })}
          />
          <button className="ap-btn-secondary" onClick={openNew}>+ Add Certification</button>
        </div>
      </div>

      {editId !== null && (
        <form className="ap-form ap-form-inline" onSubmit={save}>
          <h3>{editId === "new" ? "New Certification" : "Edit Certification"}</h3>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label>Certificate Title <span className="ap-required">*</span></label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Full Stack Development" required />
            </div>
            <div className="ap-field">
              <label>Issuing Organization</label>
              <input value={form.issuer} onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))} placeholder="Udemy, Coursera, IIT…" />
            </div>
            <div className="ap-field">
              <label>Year</label>
              <input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} placeholder="2023" />
            </div>
            <div className="ap-field">
              <label>Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: +e.target.value }))} />
            </div>
          </div>
          <div className="ap-form-actions">
            <button type="submit" className="ap-btn-primary">Save</button>
            <button type="button" className="ap-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="ap-cards">
        {certs.map((cert) => (
          <div className="ap-card" key={cert.id}>
            <div className="ap-card-main">
              <strong>{cert.title}</strong>
              <span className="ap-card-meta">{cert.issuer}{cert.year ? ` · ${cert.year}` : ""}</span>
            </div>
            <div className="ap-card-actions">
              <button className="ap-btn-edit" onClick={() => openEdit(cert)}>Edit</button>
              <button className="ap-btn-delete" onClick={() => remove(cert.id!)}>Delete</button>
            </div>
          </div>
        ))}
        {certs.length === 0 && !editId && (
          <p className="ap-empty">No certifications yet. Click "Add Certification" to get started.</p>
        )}
      </div>
    </div>
  );
}

// ─── Achievements Form ────────────────────────────────────────────────────────

function AchievementsForm({ profile, onProfileChange }: { profile: PortfolioProfile; onProfileChange: (p: PortfolioProfile) => void }) {
  const [items, setItems] = useState<Achievement[]>([]);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<Omit<Achievement, "id">>({
    text: "", order: 0,
  });

  useEffect(() => {
    api.getAchievements().then(setItems).catch(() => {});
  }, []);

  const openNew = () => {
    setForm({ text: "", order: items.length });
    setEditId("new");
  };

  const openEdit = (a: Achievement) => {
    setForm({ text: a.text, order: a.order });
    setEditId(a.id!);
  };

  const cancel = () => setEditId(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId === "new") {
        const created = await api.createAchievement(form as Achievement);
        setItems((prev) => [...prev, created]);
        notify("Achievement added!");
      } else {
        const updated = await api.updateAchievement(editId as number, form);
        setItems((prev) => prev.map((x) => (x.id === editId ? updated : x)));
        notify("Achievement updated!");
      }
      setEditId(null);
    } catch {
      notify("Failed to save achievement.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this achievement?")) return;
    try {
      await api.deleteAchievement(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      notify("Deleted.");
    } catch {
      notify("Failed to delete.", "error");
    }
  };

  return (
    <div className="ap-list-section">
      <div className="ap-list-header">
        <h2>Achievements</h2>
        <div className="ap-list-header-right">
          <VisibilityToggle
            fieldKey="show_achievements"
            value={profile.show_achievements ?? true}
            onChange={(v) => onProfileChange({ ...profile, show_achievements: v })}
          />
          <button className="ap-btn-secondary" onClick={openNew}>+ Add Achievement</button>
        </div>
      </div>

      {editId !== null && (
        <form className="ap-form ap-form-inline" onSubmit={save}>
          <h3>{editId === "new" ? "New Achievement" : "Edit Achievement"}</h3>
          <div className="ap-field">
            <label>Achievement <span className="ap-required">*</span></label>
            <textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} rows={3} placeholder="Describe your achievement..." required />
          </div>
          <div className="ap-field" style={{ maxWidth: "160px" }}>
            <label>Order</label>
            <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: +e.target.value }))} />
          </div>
          <div className="ap-form-actions">
            <button type="submit" className="ap-btn-primary">Save</button>
            <button type="button" className="ap-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="ap-cards">
        {items.map((item, i) => (
          <div className="ap-card" key={item.id}>
            <div className="ap-card-main">
              <strong style={{ color: "var(--accent)" }}>#{i + 1}</strong>
              <TextPreview text={item.text} maxLen={200} />
            </div>
            <div className="ap-card-actions">
              <button className="ap-btn-edit" onClick={() => openEdit(item)}>Edit</button>
              <button className="ap-btn-delete" onClick={() => remove(item.id!)}>Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && !editId && (
          <p className="ap-empty">No achievements yet. Click "Add Achievement" to get started.</p>
        )}
      </div>
    </div>
  );
}

// ─── Templates & Design Section ───────────────────────────────────────────────

function TemplatesSection({
  profile,
  onProfileChange,
}: {
  profile: PortfolioProfile;
  onProfileChange: (p: PortfolioProfile) => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);

  const applyTemplate = async (templateId: string) => {
    setSaving(`tpl-${templateId}`);
    try {
      await api.updateAdminProfile({ active_template: templateId } as Partial<PortfolioProfile>);
      onProfileChange({ ...profile, active_template: templateId });
      notify(`Template "${TEMPLATES.find((t) => t.id === templateId)?.name}" applied!`);
    } catch {
      notify("Failed to apply template.", "error");
    } finally {
      setSaving(null);
    }
  };

  const applyVariant = async (
    key: "variant_career" | "variant_work" | "variant_techstack",
    value: string,
  ) => {
    setSaving(`${key}-${value}`);
    try {
      await api.updateAdminProfile({ [key]: value } as Partial<PortfolioProfile>);
      onProfileChange({ ...profile, [key]: value });
      notify("Component design updated!");
    } catch {
      notify("Failed to update component design.", "error");
    } finally {
      setSaving(null);
    }
  };

  const activeTemplate = profile.active_template ?? "teal-dark";

  return (
    <div className="ap-templates-section">
      <h2>Templates &amp; Design</h2>
      <p className="ap-resume-intro">
        Pick a colour theme for your whole portfolio, then customise the layout
        style of individual sections independently.
      </p>

      {/* ── Theme Picker ── */}
      <div className="ap-templates-block">
        <h3 className="ap-templates-block-title">🎨 Website Theme</h3>
        <p className="ap-templates-block-hint">
          Changing the theme instantly updates the accent colours across every
          section of your portfolio.
        </p>
        <div className="ap-template-grid">
          {TEMPLATES.map((tpl) => {
            const isActive = activeTemplate === tpl.id;
            const isSaving = saving === `tpl-${tpl.id}`;
            return (
              <button
                key={tpl.id}
                className={`ap-template-card ${isActive ? "ap-template-card-active" : ""}`}
                onClick={() => !isActive && applyTemplate(tpl.id)}
                disabled={isSaving}
                type="button"
              >
                {/* Colour swatch */}
                <div
                  className="ap-template-swatch"
                  style={{ background: tpl.preview.bg }}
                >
                  <div
                    className="ap-template-swatch-accent"
                    style={{ background: tpl.preview.accent }}
                  />
                  <div
                    className="ap-template-swatch-secondary"
                    style={{ background: tpl.preview.secondary }}
                  />
                  {isActive && <span className="ap-template-current-badge">✓ Active</span>}
                </div>
                <div className="ap-template-card-body">
                  <strong className="ap-template-name">{tpl.name}</strong>
                  <p className="ap-template-desc">{tpl.description}</p>
                </div>
                <div className="ap-template-card-footer">
                  {isSaving ? (
                    <span className="ap-template-applying">Applying…</span>
                  ) : isActive ? (
                    <span className="ap-template-active-label">Currently Active</span>
                  ) : (
                    <span className="ap-template-apply-label">Apply Theme</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Component Variants ── */}
      <div className="ap-templates-block">
        <h3 className="ap-templates-block-title">🧩 Component Designs</h3>
        <p className="ap-templates-block-hint">
          Change the layout style of individual sections without affecting your
          theme colours.
        </p>
        <div className="ap-variant-list">
          {COMPONENT_VARIANTS.map((def) => {
            const currentVal =
              (profile[def.key as keyof PortfolioProfile] as string) ??
              def.options[0].id;
            return (
              <div className="ap-variant-row" key={def.key}>
                <div className="ap-variant-row-header">
                  <span className="ap-variant-icon">{def.icon}</span>
                  <strong className="ap-variant-label">{def.label}</strong>
                </div>
                <div className="ap-variant-options">
                  {def.options.map((opt) => {
                    const isSelected = currentVal === opt.id;
                    const isSaving_ = saving === `${def.key}-${opt.id}`;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`ap-variant-card ${isSelected ? "ap-variant-card-active" : ""}`}
                        onClick={() =>
                          !isSelected && applyVariant(def.key, opt.id)
                        }
                        disabled={isSaving_}
                      >
                        <span className="ap-variant-preview">{opt.preview}</span>
                        <strong className="ap-variant-opt-label">{opt.label}</strong>
                        <p className="ap-variant-opt-desc">{opt.description}</p>
                        {isSelected && (
                          <span className="ap-variant-selected-badge">✓ In Use</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Personal Projects Form ───────────────────────────────────────────────────

function PersonalProjectsForm({ profile, onProfileChange }: { profile: PortfolioProfile; onProfileChange: (p: PortfolioProfile) => void }) {
  const [items, setItems] = useState<PersonalProject[]>([]);
  const [editId, setEditId] = useState<number | "new" | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState<Omit<PersonalProject, "id">>({
    title: "", description: "", tech_stack: [], github_url: "", live_url: "", order: 0,
  });

  useEffect(() => {
    api.getPersonalProjects().then(setItems).catch(() => {});
  }, []);

  const openNew = () => {
    setForm({ title: "", description: "", tech_stack: [], github_url: "", live_url: "", order: items.length });
    setTagInput("");
    setEditId("new");
  };

  const openEdit = (p: PersonalProject) => {
    setForm({ title: p.title, description: p.description, tech_stack: [...p.tech_stack], github_url: p.github_url, live_url: p.live_url, order: p.order });
    setTagInput("");
    setEditId(p.id!);
  };

  const cancel = () => setEditId(null);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tech_stack.includes(tag)) {
      setForm((f) => ({ ...f, tech_stack: [...f.tech_stack, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tech_stack: f.tech_stack.filter((t) => t !== tag) }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId === "new") {
        const created = await api.createPersonalProject(form);
        setItems((prev) => [...prev, created]);
        notify("Project added!");
      } else {
        const updated = await api.updatePersonalProject(editId as number, form);
        setItems((prev) => prev.map((x) => (x.id === editId ? updated : x)));
        notify("Project updated!");
      }
      setEditId(null);
    } catch {
      notify("Failed to save project.", "error");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api.deletePersonalProject(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      notify("Deleted.");
    } catch {
      notify("Failed to delete.", "error");
    }
  };

  return (
    <div className="ap-list-section">
      <div className="ap-list-header">
        <h2>Personal Projects</h2>
        <div className="ap-list-header-right">
          <VisibilityToggle
            fieldKey="show_personal_projects"
            value={profile.show_personal_projects ?? true}
            onChange={(v) => onProfileChange({ ...profile, show_personal_projects: v })}
          />
          <button className="ap-btn-secondary" onClick={openNew}>+ Add Project</button>
        </div>
      </div>

      {editId !== null && (
        <form className="ap-form ap-form-inline" onSubmit={save}>
          <h3>{editId === "new" ? "New Project" : "Edit Project"}</h3>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label>Project Title <span className="ap-required">*</span></label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="My Awesome Project" required />
            </div>
            <div className="ap-field">
              <label>GitHub URL</label>
              <input type="url" value={form.github_url} onChange={(e) => setForm((f) => ({ ...f, github_url: e.target.value }))} placeholder="https://github.com/you/project" />
            </div>
            <div className="ap-field">
              <label>Live / Demo URL</label>
              <input type="url" value={form.live_url} onChange={(e) => setForm((f) => ({ ...f, live_url: e.target.value }))} placeholder="https://yourproject.com" />
            </div>
            <div className="ap-field">
              <label>Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: +e.target.value }))} />
            </div>
          </div>
          <div className="ap-field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Briefly describe what this project does…"
            />
          </div>
          <div className="ap-field">
            <label>Tech Stack Tags</label>
            <div className="ap-tag-input-row">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="React, Python… press Enter to add"
              />
              <button type="button" className="ap-btn-secondary" onClick={addTag}>Add</button>
            </div>
            {form.tech_stack.length > 0 && (
              <div className="ap-tags-row" style={{ marginTop: "8px" }}>
                {form.tech_stack.map((tag) => (
                  <span key={tag} className="ap-tag ap-tag-removable">
                    {tag}
                    <button type="button" className="ap-tag-remove" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="ap-form-actions">
            <button type="submit" className="ap-btn-primary">Save</button>
            <button type="button" className="ap-btn-ghost" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <div className="ap-cards">
        {items.map((proj) => (
          <div className="ap-card" key={proj.id}>
            <div className="ap-card-main">
              <strong>{proj.title}</strong>
              {proj.tech_stack.length > 0 && (
                <div className="ap-tags-row" style={{ marginTop: "4px" }}>
                  {proj.tech_stack.map((t) => <span className="ap-tag" key={t}>{t}</span>)}
                </div>
              )}
              {proj.description && <TextPreview text={proj.description} maxLen={120} />}
              <span className="ap-card-meta">
                {proj.github_url && <a href={proj.github_url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>GitHub ↗</a>}
                {proj.live_url && <a href={proj.live_url} target="_blank" rel="noopener noreferrer">Live ↗</a>}
              </span>
            </div>
            <div className="ap-card-actions">
              <button className="ap-btn-edit" onClick={() => openEdit(proj)}>Edit</button>
              <button className="ap-btn-delete" onClick={() => remove(proj.id!)}>Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && !editId && (
          <p className="ap-empty">No projects yet. Click "Add Project" to get started.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: "resume",           label: "Resume",          icon: "📄" },
  { id: "templates",        label: "Templates",        icon: "🎨" },
  { id: "profile",          label: "Profile",          icon: "👤" },
  { id: "career",           label: "Career",           icon: "💼" },
  { id: "projects",         label: "Work / Portfolio", icon: "🗂️" },
  { id: "whatido",          label: "What I Do",        icon: "⚙️" },
  { id: "techstack",        label: "Tech Stack",       icon: "🔧" },
  { id: "social",           label: "Social & Links",   icon: "🔗" },
  { id: "education",        label: "Education",        icon: "🎓" },
  { id: "certifications",   label: "Certifications",   icon: "🏆" },
  { id: "achievements",     label: "Achievements",     icon: "⭐" },
  { id: "personal_projects",label: "My Projects",      icon: "🚀" },
];

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<Section>("resume");
  const [profile, setProfile] = useState<PortfolioProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();
  // Portfolio page sets body overflow:hidden for GSAP; restore scrolling here
  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "hidden";
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    setProfileLoading(true);
    api
      .getAdminProfile()
      .then(setProfile)
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
      })
      .finally(() => setProfileLoading(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <div className="ap-layout">
      {/* Sidebar */}
      <aside className="ap-sidebar">
        <div className="ap-sidebar-logo">PortfolioCraft</div>
        <nav className="ap-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`ap-nav-item ${activeSection === item.id ? "ap-nav-active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="ap-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="ap-sidebar-footer">
          <button
            className="ap-btn-ghost ap-btn-sm"
            onClick={() =>
              navigate(
                profile?.slug
                  ? `/p/${profile.slug}`
                  : profile?.username
                  ? `/p/${profile.username}`
                  : "/portfolio"
              )
            }
            style={{ marginBottom: "0.5rem" }}
          >
            View Portfolio ↗
          </button>
          <button className="ap-btn-ghost ap-btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ap-main">
        <div className="ap-main-inner">
          {profileLoading ? (
            <div className="ap-loading">Loading…</div>
          ) : profile ? (
            <>
              {activeSection === "resume" && (
                <ResumeSection profile={profile} onProfileUpdate={setProfile} />
              )}
              {activeSection === "templates" && (
                <TemplatesSection profile={profile} onProfileChange={setProfile} />
              )}
              {activeSection === "profile" && <ProfileForm profile={profile} />}
              {activeSection === "career" && <CareerForm />}
              {activeSection === "projects" && <ProjectsForm />}
              {activeSection === "whatido" && <WhatIDoForm />}
              {activeSection === "techstack" && <TechStackForm profile={profile} onProfileChange={setProfile} />}
              {activeSection === "social" && <SocialForm profile={profile} />}
              {activeSection === "education" && (
                <EducationForm profile={profile} onProfileChange={setProfile} />
              )}
              {activeSection === "certifications" && (
                <CertificationsForm profile={profile} onProfileChange={setProfile} />
              )}
              {activeSection === "achievements" && (
                <AchievementsForm profile={profile} onProfileChange={setProfile} />
              )}
              {activeSection === "personal_projects" && (
                <PersonalProjectsForm profile={profile} onProfileChange={setProfile} />
              )}
            </>
          ) : (
            <p className="ap-empty">Could not load profile.</p>
          )}
        </div>
      </main>
    </div>
  );
}
