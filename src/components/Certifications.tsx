import { useContext } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import './styles/Certifications.css';

export default function Certifications() {
  const { data } = useContext(PortfolioContext);
  const certs = data?.certifications ?? [];

  return (
    <section className="certs-section" id="certifications">
      <div className="certs-inner">
        <div className="certs-heading-wrap">
          <p className="certs-sub">Verified Skills</p>
          <h2 className="certs-heading">Certifications</h2>
        </div>
        <div className="certs-grid">
          {certs.map((cert, i) => (
            <div className="cert-card" key={cert.id ?? i}>
              <div className="cert-icon">🏆</div>
              <div className="cert-body">
                <h3 className="cert-title">{cert.title}</h3>
                <div className="cert-meta">
                  {cert.issuer && <span className="cert-issuer">{cert.issuer}</span>}
                  {cert.year && <span className="cert-year">{cert.year}</span>}
                </div>
              </div>
              <div className="cert-glow" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
