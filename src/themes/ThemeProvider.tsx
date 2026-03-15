import { useContext, useEffect } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import { TEMPLATES } from './templates';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useContext(PortfolioContext);

  useEffect(() => {
    const templateId = data?.active_template ?? 'teal-dark';
    const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
    const root = document.documentElement;
    Object.entries(template.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [data?.active_template]);

  return <>{children}</>;
}
