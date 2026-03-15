import {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from 'react';
import { fetchPortfolio, fetchPortfolioBySlug, fetchPortfolioByHost, PortfolioProfile } from '../api/portfolio';

interface PortfolioContextType {
  data: PortfolioProfile | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT: PortfolioProfile = {
  first_name: 'JOHN',
  last_name: 'DOE',
  title_prefix: 'A Full Stack',
  title_option1: 'Developer',
  title_option2: 'Engineer',
  navbar_initials: 'JD',
  about_text:
    'Full Stack Developer with 5+ years of experience crafting modern web applications. '
    + 'Passionate about clean code, great UX, and scalable architecture. '
    + 'This is a demo portfolio — log in to the admin panel and replace this '
    + 'with your own story, projects and skills.',
  email: 'hello@johndoe.dev',
  education: 'BSc in Computer Science',
  copyright_year: '2026',
  copyright_name: 'John Doe',
  github_url: 'https://github.com/johndoe',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  twitter_url: 'https://x.com/johndoe',
  instagram_url: 'https://instagram.com/johndoe',
  resume_url: '#',
  resume_file_url: '',
  show_education: true,
  show_certifications: true,
  show_achievements: true,
  show_personal_projects: true,
  active_template: 'teal-dark',
  variant_career: 'cards',
  variant_work: 'carousel',
  variant_techstack: 'logos',
  techstack_brightness: 1.0,
  career_entries: [
    {
      role: 'Junior Developer',
      company: 'Startup Labs',
      year: '2021',
      description:
        'Built responsive web apps with React.js and Node.js. Collaborated on '
        + 'UI/UX design and database schema design using MongoDB.',
      order: 0,
    },
    {
      role: 'Full Stack Developer',
      company: 'Tech Corp',
      year: '2022',
      description:
        'Led a team of 3 engineers to deliver a SaaS platform from scratch. '
        + 'Designed REST APIs, implemented CI/CD pipelines and reduced load time by 40%.',
      order: 1,
    },
    {
      role: 'Senior Engineer',
      company: 'Innovate Inc.',
      year: 'NOW',
      description:
        'Architecting micro-frontend systems and serverless backends. '
        + 'Mentoring junior developers and driving code quality standards.',
      order: 2,
    },
  ],
  projects: [
    {
      title: 'ShopEase',
      category: 'E-Commerce Platform',
      tools: 'Next.js, NestJS, PostgreSQL, Stripe',
      image_url: '',
      project_url: '',
      order: 0,
    },
    {
      title: 'TaskFlow',
      category: 'Project Management',
      tools: 'React, Node.js, MongoDB, Socket.io',
      image_url: '',
      project_url: '',
      order: 1,
    },
    {
      title: 'DataViz Pro',
      category: 'Analytics Dashboard',
      tools: 'React, D3.js, Python, FastAPI',
      image_url: '',
      project_url: '',
      order: 2,
    },
    {
      title: 'ChatSync',
      category: 'Real-time Messaging',
      tools: 'React, Node.js, WebSockets, Redis',
      image_url: '',
      project_url: '',
      order: 3,
    },
  ],
  whatido_sections: [
    {
      category: 'FRONTEND',
      title: 'Building Interactive UIs',
      description:
        'Crafting performant, responsive interfaces with modern frameworks. '
        + 'From SPAs to micro-frontends, I deliver pixel-perfect experiences.',
      tags: ['React.js', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind'],
      order: 0,
    },
    {
      category: 'BACKEND',
      title: 'Scalable Server Architecture',
      description:
        'Designing robust APIs and microservices. From REST to GraphQL, '
        + 'I build backends that scale.',
      tags: ['Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Python'],
      order: 1,
    },
  ],
  techstack_images: [
    { name: 'React', image_url: '/images/react2.webp', order: 0 },
    { name: 'Next.js', image_url: '/images/next2.webp', order: 1 },
    { name: 'Node.js', image_url: '/images/node2.webp', order: 2 },
    { name: 'Express', image_url: '/images/express.webp', order: 3 },
    { name: 'MongoDB', image_url: '/images/mongo.webp', order: 4 },
    { name: 'MySQL', image_url: '/images/mysql.webp', order: 5 },
    { name: 'TypeScript', image_url: '/images/typescript.webp', order: 6 },
    { name: 'JavaScript', image_url: '/images/javascript.webp', order: 7 },
  ],
  education_entries: [
    {
      degree: 'B.Tech (Electronics & Communication)',
      institution: 'State Engineering College',
      year: '2019',
      grade: '77%',
      order: 0,
    },
    {
      degree: 'Higher Secondary (12th)',
      institution: 'City Convent School (CBSE)',
      year: '2015',
      grade: '63.8%',
      order: 1,
    },
  ],
  certifications: [
    { title: 'C++ Programming', issuer: 'IIT Kharagpur', year: '2020', order: 0 },
    { title: 'Data Structures & Algorithms in Java', issuer: 'Udemy', year: '2021', order: 1 },
    { title: 'Full Stack Web Development', issuer: 'Udemy', year: '2022', order: 2 },
  ],
  achievements: [
    {
      text: 'Published research paper on "Text Extraction from Digital Images" in International Journal of Recent Research Aspects.',
      order: 0,
    },
    { text: 'Secured 1st Rank in DSA based Code Rank programming competition.', order: 1 },
    {
      text: 'Designed and deployed an E-commerce application using Django and PostgreSQL on VPS.',
      order: 2,
    },
    { text: 'Delivered 4 major product releases with zero downtime in a production environment.', order: 3 },
  ],
  personal_projects: [
    {
      title: 'DevFolio Builder',
      description: 'A full-stack portfolio builder with resume autofill, theme switching, and admin panel.',
      tech_stack: ['React', 'Django', 'TypeScript', 'PostgreSQL'],
      github_url: 'https://github.com',
      live_url: '',
      order: 0,
    },
    {
      title: 'TaskFlow CLI',
      description: 'A command-line task manager with priority queues and deadline reminders.',
      tech_stack: ['Python', 'SQLite', 'Rich'],
      github_url: 'https://github.com',
      live_url: '',
      order: 1,
    },
    {
      title: 'AskAI Chrome Extension',
      description: 'Browser extension that summarises any webpage using OpenAI APIs.',
      tech_stack: ['JavaScript', 'OpenAI API', 'Chrome Extensions'],
      github_url: 'https://github.com',
      live_url: 'https://example.com',
      order: 2,
    },
  ],
};

export const PortfolioContext = createContext<PortfolioContextType>({
  data: DEFAULT,
  loading: false,
  error: null,
});

interface PortfolioProviderProps extends PropsWithChildren {
  /**
   * When set, fetches the portfolio for this specific slug instead of the
   * default first-profile endpoint. Pass '__host__' to resolve by Host header
   * (used for subdomain / custom-domain deployments).
   */
  slug?: string;
}

export const PortfolioProvider = ({ children, slug }: PortfolioProviderProps) => {
  const [data, setData] = useState<PortfolioProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let fetcher: Promise<PortfolioProfile>;
    if (slug === '__host__') {
      fetcher = fetchPortfolioByHost();
    } else if (slug) {
      fetcher = fetchPortfolioBySlug(slug);
    } else {
      fetcher = fetchPortfolio();
    }
    fetcher
      .then(setData)
      .catch(() => {
        // Fallback to default data when backend is not running
        setData(DEFAULT);
        setError('Using default data — connect backend to load live data.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <PortfolioContext.Provider value={{ data: data ?? DEFAULT, loading, error }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
