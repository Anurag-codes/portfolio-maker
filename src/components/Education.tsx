import { useContext } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import './styles/Education.css';

export default function Education() {
  const { data } = useContext(PortfolioContext);
  const entries = data?.education_entries ?? [];

  return (
    <section className="education-section" id="education">
      <div className="education-inner">
        <div className="education-heading-wrap">
          <p className="education-sub">Academic Background</p>
          <h2 className="education-heading">Education</h2>
        </div>
        <div className="education-grid">
          {entries.map((entry, i) => (
            <div className="edu-card" key={entry.id ?? i}>
              <div className="edu-card-accent" />
              <div className="edu-card-body">
                <div className="edu-card-top">
                  <h3 className="edu-degree">{entry.degree}</h3>
                  {entry.year && <span className="edu-year">{entry.year}</span>}
                </div>
                <p className="edu-institution">{entry.institution}</p>
                {entry.grade && (
                  <span className="edu-grade">{entry.grade}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
