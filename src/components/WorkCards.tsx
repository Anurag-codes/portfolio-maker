import { usePortfolio } from '../context/PortfolioContext';
import WorkImage from './WorkImage';
import './styles/WorkCards.css';

export default function WorkCards() {
  const { data } = usePortfolio();
  const projects = data?.projects ?? [];

  return (
    <section className="wc-section" id="work">
      <div className="wc-inner section-container">
        <h2 className="wc-heading">
          My <span>Work</span>
        </h2>
        <div className="wc-grid">
          {projects.map((project, idx) => (
            <a
              key={project.id ?? idx}
              className="wc-card"
              href={project.project_url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor={project.project_url ? undefined : 'disable'}
            >
              <div className="wc-card-img">
                <WorkImage
                  image={project.image_display || project.image_url}
                  alt={project.title}
                />
                <div className="wc-card-overlay">
                  {project.project_url && (
                    <span className="wc-view-btn">View Project ↗</span>
                  )}
                </div>
              </div>
              <div className="wc-card-body">
                <div className="wc-card-top">
                  <span className="wc-card-num">0{idx + 1}</span>
                  <span className="wc-card-category">{project.category}</span>
                </div>
                <h3 className="wc-card-title">{project.title}</h3>
                {project.tools && (
                  <div className="wc-tools">
                    {project.tools.split(',').map((t, i) => (
                      <span key={i} className="wc-tool-tag">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
