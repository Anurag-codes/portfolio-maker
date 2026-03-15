export interface Template {
  id: string;
  name: string;
  description: string;
  preview: {
    bg: string;
    accent: string;
    secondary: string;
  };
  vars: Record<string, string>;
}

export interface VariantOption {
  id: string;
  label: string;
  description: string;
  preview: string; // emoji icon
}

export interface ComponentVariantDef {
  key: 'variant_career' | 'variant_work' | 'variant_techstack';
  label: string;
  icon: string;
  options: VariantOption[];
}

export const TEMPLATES: Template[] = [
  // ── Dark / Tech themes ────────────────────────────────────────────────────
  {
    id: 'teal-dark',
    name: 'Ocean Teal',
    description: 'Dark bg with refreshing teal — the classic default',
    preview: { bg: '#0a0e17', accent: '#5eead4', secondary: '#818cf8' },
    vars: {
      '--backgroundColor': '#0a0e17',
      '--accentColor': '#5eead4',
      '--accentColorDark': '#0d9488',
      '--accentSecondary': '#818cf8',
    },
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    description: 'Mystical dark with electric purple and sky-blue tones',
    preview: { bg: '#0d0a1e', accent: '#c084fc', secondary: '#38bdf8' },
    vars: {
      '--backgroundColor': '#0d0a1e',
      '--accentColor': '#c084fc',
      '--accentColorDark': '#9333ea',
      '--accentSecondary': '#38bdf8',
    },
  },
  {
    id: 'amber-night',
    name: 'Amber Night',
    description: 'Warm amber glow radiating from a deep dark background',
    preview: { bg: '#0f0a02', accent: '#fbbf24', secondary: '#f87171' },
    vars: {
      '--backgroundColor': '#0f0a02',
      '--accentColor': '#fbbf24',
      '--accentColorDark': '#d97706',
      '--accentSecondary': '#f87171',
    },
  },
  {
    id: 'rose-noir',
    name: 'Rose Noir',
    description: 'Dramatic rose-pink with deep noir and lavender accents',
    preview: { bg: '#130812', accent: '#f472b6', secondary: '#a78bfa' },
    vars: {
      '--backgroundColor': '#130812',
      '--accentColor': '#f472b6',
      '--accentColorDark': '#ec4899',
      '--accentSecondary': '#a78bfa',
    },
  },
  {
    id: 'neon-green',
    name: 'Neon Green',
    description: 'Hacker-style dark canvas with vivid lime-green accents',
    preview: { bg: '#050f05', accent: '#4ade80', secondary: '#38bdf8' },
    vars: {
      '--backgroundColor': '#050f05',
      '--accentColor': '#4ade80',
      '--accentColorDark': '#16a34a',
      '--accentSecondary': '#38bdf8',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Deep navy cosmos with electric blue and magenta highlights',
    preview: { bg: '#030712', accent: '#60a5fa', secondary: '#f472b6' },
    vars: {
      '--backgroundColor': '#030712',
      '--accentColor': '#60a5fa',
      '--accentColorDark': '#2563eb',
      '--accentSecondary': '#f472b6',
    },
  },
  {
    id: 'slate-cyan',
    name: 'Slate Cyan',
    description: 'Cool charcoal slate with crisp cyan and warm orange punch',
    preview: { bg: '#0f172a', accent: '#22d3ee', secondary: '#fb923c' },
    vars: {
      '--backgroundColor': '#0f172a',
      '--accentColor': '#22d3ee',
      '--accentColorDark': '#0891b2',
      '--accentSecondary': '#fb923c',
    },
  },
  // ── Light / Non-tech themes ───────────────────────────────────────────────
  {
    id: 'fresh-cream',
    name: 'Fresh Cream',
    description: 'Warm off-white with sage green — great for creatives, designers & writers',
    preview: { bg: '#fafaf7', accent: '#4a7c59', secondary: '#c2693e' },
    vars: {
      '--backgroundColor': '#fafaf7',
      '--accentColor': '#4a7c59',
      '--accentColorDark': '#2d5a3d',
      '--accentSecondary': '#c2693e',
      '--textPrimary': '#1c1c1c',
      '--textSecondary': '#4a4a4a',
      '--cardBg': '#f0eeea',
      '--borderColor': '#d4d0c8',
    },
  },
  {
    id: 'cloud-lavender',
    name: 'Cloud Lavender',
    description: 'Soft lavender background — elegant for professionals & consultants',
    preview: { bg: '#f5f3ff', accent: '#7c3aed', secondary: '#db2777' },
    vars: {
      '--backgroundColor': '#f5f3ff',
      '--accentColor': '#7c3aed',
      '--accentColorDark': '#5b21b6',
      '--accentSecondary': '#db2777',
      '--textPrimary': '#1e1b4b',
      '--textSecondary': '#4c1d95',
      '--cardBg': '#ede9fe',
      '--borderColor': '#c4b5fd',
    },
  },
  {
    id: 'sandy-shore',
    name: 'Sandy Shore',
    description: 'Warm sandy tones with ocean blue — perfect for freelancers & marketers',
    preview: { bg: '#fdf6ec', accent: '#1d6fa4', secondary: '#e07b39' },
    vars: {
      '--backgroundColor': '#fdf6ec',
      '--accentColor': '#1d6fa4',
      '--accentColorDark': '#145480',
      '--accentSecondary': '#e07b39',
      '--textPrimary': '#1a1209',
      '--textSecondary': '#4a3728',
      '--cardBg': '#f4ead8',
      '--borderColor': '#d8c8a8',
    },
  },
];

export const COMPONENT_VARIANTS: ComponentVariantDef[] = [
  {
    key: 'variant_career',
    label: 'Career Section',
    icon: '💼',
    options: [
      {
        id: 'cards',
        label: 'Cards',
        description: 'Stacked cards with role, company and description',
        preview: '▬▬▬',
      },
      {
        id: 'timeline',
        label: 'Timeline',
        description: 'Vertical timeline with milestones and connecting line',
        preview: '⦿─⦿',
      },
      {
        id: 'compact',
        label: 'Compact List',
        description: 'Minimal single-line rows — clean and scannable',
        preview: '≡≡≡',
      },
    ],
  },
  {
    key: 'variant_work',
    label: 'Projects Section',
    icon: '🗂️',
    options: [
      {
        id: 'carousel',
        label: 'Carousel',
        description: 'Full-width sliding carousel with image and details',
        preview: '◀ ■ ▶',
      },
      {
        id: 'grid',
        label: 'Grid Cards',
        description: 'Compact grid of project cards with tools listed',
        preview: '▪▪\n▪▪',
      },
      {
        id: 'masonry',
        label: 'Masonry',
        description: 'Pinterest-style varying height cards for visual work',
        preview: '▪▬\n▬▪',
      },
    ],
  },
  {
    key: 'variant_techstack',
    label: 'Tech Stack Section',
    icon: '🔧',
    options: [
      {
        id: 'logos',
        label: 'Logo Grid',
        description: 'Technology logos in a scrolling animated grid',
        preview: '⬡⬡⬡',
      },
      {
        id: 'pills',
        label: 'Pill Tags',
        description: 'Colorful text badges arranged in a flowing layout',
        preview: '● ● ●',
      },
      {
        id: 'bars',
        label: 'Skill Bars',
        description: 'Horizontal progress bars showing proficiency levels',
        preview: '━━━━',
      },
    ],
  },
];
