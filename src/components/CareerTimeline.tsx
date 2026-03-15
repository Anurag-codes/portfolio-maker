import { usePortfolio } from '../context/PortfolioContext';
import './styles/CareerTimeline.css';

export default function CareerTimeline() {
  const { data } = usePortfolio();
  const entries = data?.career_entries ?? [];

  return (
    <section className="ct-section" id="career">
      <div className="ct-inner section-container">
        <h2 className="ct-heading">
          My career <span>&</span>
          <br />experience
        </h2>
        <div className="ct-timeline">
          {entries.map((entry, idx) => (
            <div className="ct-item" key={entry.id ?? idx}>
              <div className="ct-left">
                <span className="ct-year">{entry.year}</span>
              </div>
              <div className="ct-connector">
                <div className="ct-dot" />
                {idx < entries.length - 1 && <div className="ct-line" />}
              </div>
              <div className="ct-right">
                <h3 className="ct-role">{entry.role}</h3>
                <p className="ct-company">{entry.company}</p>
                <p className="ct-desc">{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
