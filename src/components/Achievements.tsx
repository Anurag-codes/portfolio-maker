import { useContext } from 'react';
import { PortfolioContext } from '../context/PortfolioContext';
import './styles/Achievements.css';

export default function Achievements() {
  const { data } = useContext(PortfolioContext);
  const items = data?.achievements ?? [];

  return (
    <section className="achievements-section" id="achievements">
      <div className="achievements-inner">
        <div className="achievements-heading-wrap">
          <p className="achievements-sub">Milestones</p>
          <h2 className="achievements-heading">Achievements</h2>
        </div>
        <div className="achievements-list">
          {items.map((item, i) => (
            <div className="achievement-item" key={item.id ?? i}>
              <span className="achievement-num">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="achievement-content">
                <div className="achievement-line" />
                <p className="achievement-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
