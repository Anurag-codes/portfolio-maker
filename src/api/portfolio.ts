import client from './client';

export interface CareerEntry {
  id?: number;
  role: string;
  company: string;
  year: string;
  description: string;
  order: number;
}

export interface Project {
  id?: number;
  title: string;
  category: string;
  tools: string;
  image?: File | null;
  image_url: string;
  image_display?: string;
  project_url: string;
  order: number;
}

export interface WhatIDoSection {
  id?: number;
  category: string;
  title: string;
  description: string;
  tags: string[];
  order: number;
}

export interface TechStackImage {
  id?: number;
  name: string;
  image?: File | null;
  image_url: string;
  image_display?: string;
  order: number;
}

export interface EducationEntry {
  id?: number;
  degree: string;
  institution: string;
  year: string;
  grade: string;
  order: number;
}

export interface Certification {
  id?: number;
  title: string;
  issuer: string;
  year: string;
  order: number;
}

export interface Achievement {
  id?: number;
  text: string;
  order: number;
}

export interface PersonalProject {
  id?: number;
  title: string;
  description: string;
  tech_stack: string[];
  github_url: string;
  live_url: string;
  order: number;
}

export interface PortfolioProfile {
  id?: number;
  first_name: string;
  last_name: string;
  title_prefix: string;
  title_option1: string;
  title_option2: string;
  navbar_initials: string;
  about_text: string;
  email: string;
  education: string;
  copyright_year: string;
  copyright_name: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  instagram_url: string;
  resume_url: string;
  resume_file_url?: string;
  show_education: boolean;
  show_certifications: boolean;
  show_achievements: boolean;
  show_personal_projects: boolean;
  active_template: string;
  variant_career: string;
  variant_work: string;
  variant_techstack: string;
  techstack_brightness: number;
  career_entries: CareerEntry[];
  projects: Project[];
  whatido_sections: WhatIDoSection[];
  techstack_images: TechStackImage[];
  education_entries: EducationEntry[];
  certifications: Certification[];
  achievements: Achievement[];
  personal_projects: PersonalProject[];
  updated_at?: string;
}

// Public API
export const fetchPortfolio = () =>
  client.get<PortfolioProfile>('/portfolio/').then((r) => r.data);

// Auth
export const login = (username: string, password: string) =>
  client.post<{ access: string; refresh: string }>('/auth/login/', { username, password });

export const register = (username: string, email: string, password: string) =>
  client.post<{ access: string; refresh: string }>('/auth/register/', { username, email, password });

export const getMe = () => client.get('/auth/me/').then((r) => r.data);

// Admin – Profile
export const getAdminProfile = () =>
  client.get<PortfolioProfile>('/admin/profile/').then((r) => r.data);

export const updateAdminProfile = (data: Partial<PortfolioProfile>) =>
  client.put<PortfolioProfile>('/admin/profile/', data).then((r) => r.data);

// Admin – Career
export const getCareerEntries = () =>
  client.get<CareerEntry[]>('/admin/career/').then((r) => r.data);

export const createCareerEntry = (data: CareerEntry) =>
  client.post<CareerEntry>('/admin/career/', data).then((r) => r.data);

export const updateCareerEntry = (id: number, data: Partial<CareerEntry>) =>
  client.put<CareerEntry>(`/admin/career/${id}/`, data).then((r) => r.data);

export const deleteCareerEntry = (id: number) =>
  client.delete(`/admin/career/${id}/`);

// Admin – Projects
export const getProjects = () =>
  client.get<Project[]>('/admin/projects/').then((r) => r.data);

export const createProject = (data: FormData) =>
  client.post<Project>('/admin/projects/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const updateProject = (id: number, data: FormData | Partial<Project>) =>
  client.put<Project>(`/admin/projects/${id}/`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }).then((r) => r.data);

export const deleteProject = (id: number) =>
  client.delete(`/admin/projects/${id}/`);

// Admin – What I Do
export const getWhatIDo = () =>
  client.get<WhatIDoSection[]>('/admin/whatido/').then((r) => r.data);

export const createWhatIDoSection = (data: WhatIDoSection) =>
  client.post<WhatIDoSection>('/admin/whatido/', data).then((r) => r.data);

export const updateWhatIDoSection = (id: number, data: Partial<WhatIDoSection>) =>
  client.put<WhatIDoSection>(`/admin/whatido/${id}/`, data).then((r) => r.data);

export const deleteWhatIDoSection = (id: number) =>
  client.delete(`/admin/whatido/${id}/`);

// Admin – Tech Stack
export const getTechStack = () =>
  client.get<TechStackImage[]>('/admin/techstack/').then((r) => r.data);

export const createTechStackImage = (data: FormData) =>
  client.post<TechStackImage>('/admin/techstack/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const updateTechStackImage = (id: number, data: FormData | Partial<TechStackImage>) =>
  client.put<TechStackImage>(`/admin/techstack/${id}/`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }).then((r) => r.data);

export const deleteTechStackImage = (id: number) =>
  client.delete(`/admin/techstack/${id}/`);

// Admin – Resume
export interface ParsedResume {
  profile: Partial<PortfolioProfile>;
  career: Array<{ role: string; company: string; year: string; description: string }>;
  skills: string[];
  projects: Array<{ title: string; tools: string; category: string }>;
  education_entries: Array<{ degree: string; institution: string; year: string; grade: string }>;
  certifications: Array<{ title: string; issuer: string; year: string }>;
  achievements: Array<{ text: string }>;
}

export const parseResume = (file: File) => {
  const fd = new FormData();
  fd.append('resume', file);
  return client.post<ParsedResume>('/admin/resume/parse/', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const uploadResume = (file: File) => {
  const fd = new FormData();
  fd.append('resume', file);
  return client.post<{ resume_url: string; detail: string }>('/admin/resume/upload/', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const generateResume = (format: 'pdf' | 'latex') =>
  client.get(`/admin/resume/generate/?format=${format}`, { responseType: 'blob' });

// Admin – Education
export const getEducation = () =>
  client.get<EducationEntry[]>('/admin/education/').then((r) => r.data);

export const createEducationEntry = (data: Omit<EducationEntry, 'id'>) =>
  client.post<EducationEntry>('/admin/education/', data).then((r) => r.data);

export const updateEducationEntry = (id: number, data: Partial<EducationEntry>) =>
  client.put<EducationEntry>(`/admin/education/${id}/`, data).then((r) => r.data);

export const deleteEducationEntry = (id: number) =>
  client.delete(`/admin/education/${id}/`);

// Admin – Certifications
export const getCertifications = () =>
  client.get<Certification[]>('/admin/certifications/').then((r) => r.data);

export const createCertification = (data: Omit<Certification, 'id'>) =>
  client.post<Certification>('/admin/certifications/', data).then((r) => r.data);

export const updateCertification = (id: number, data: Partial<Certification>) =>
  client.put<Certification>(`/admin/certifications/${id}/`, data).then((r) => r.data);

export const deleteCertification = (id: number) =>
  client.delete(`/admin/certifications/${id}/`);

// Admin – Achievements
export const getAchievements = () =>
  client.get<Achievement[]>('/admin/achievements/').then((r) => r.data);

export const createAchievement = (data: Omit<Achievement, 'id'>) =>
  client.post<Achievement>('/admin/achievements/', data).then((r) => r.data);

export const updateAchievement = (id: number, data: Partial<Achievement>) =>
  client.put<Achievement>(`/admin/achievements/${id}/`, data).then((r) => r.data);

export const deleteAchievement = (id: number) =>
  client.delete(`/admin/achievements/${id}/`);

// Admin – Personal Projects
export const getPersonalProjects = () =>
  client.get<PersonalProject[]>('/admin/personal-projects/').then((r) => r.data);

export const createPersonalProject = (data: Omit<PersonalProject, 'id'>) =>
  client.post<PersonalProject>('/admin/personal-projects/', data).then((r) => r.data);

export const updatePersonalProject = (id: number, data: Partial<PersonalProject>) =>
  client.put<PersonalProject>(`/admin/personal-projects/${id}/`, data).then((r) => r.data);

export const deletePersonalProject = (id: number) =>
  client.delete(`/admin/personal-projects/${id}/`);

