import { useContext } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import './styles/PersonalProjects.css';

export default function PersonalProjects() {
  const { data } = useContext(PortfolioContext);
  const projects = data?.personal_projects ?? [];

  return (
    <section className="pp-section" id="personal-projects">
      <div className="pp-inner section-container">
        <div className="pp-heading-wrap">
          <p className="pp-sub">What I've Built</p>
          <h2 className="pp-heading">Projects</h2>
        </div>
        <div className="pp-grid">
          {projects.map((proj, i) => (
            <div className="pp-card" key={proj.id ?? i}>
              <div className="pp-card-header">
                <span className="pp-card-icon">🚀</span>
                <div className="pp-card-links">
                  {proj.github_url && (
                    <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="pp-link" aria-label="GitHub">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                    </a>
                  )}
                  {proj.live_url && (
                    <a href={proj.live_url} target="_blank" rel="noopener noreferrer" className="pp-link" aria-label="Live Demo">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              <h3 className="pp-card-title">{proj.title}</h3>
              {proj.description && (
                <p className="pp-card-desc">{proj.description}</p>
              )}
              {proj.tech_stack && proj.tech_stack.length > 0 && (
                <div className="pp-tags">
                  {proj.tech_stack.map((tag, ti) => (
                    <span className="pp-tag" key={ti}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
