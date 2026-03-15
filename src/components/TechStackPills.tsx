import { usePortfolio } from '../context/PortfolioContext';
import './styles/TechStackPills.css';

// Assign a consistent hue offset to each skill name for variety
function getHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default function TechStackPills() {
  const { data } = usePortfolio();
  const skills = data?.techstack_images ?? [];

  return (
    <section className="tsp-section" id="tech-stack">
      <div className="tsp-inner section-container">
        <h2 className="tsp-heading">
          Tech <span>Stack</span>
        </h2>
        <div className="tsp-pills">
          {skills.map((skill, idx) => {
            const hue = getHue(skill.name);
            return (
              <span
                key={skill.id ?? idx}
                className="tsp-pill"
                style={{
                  '--pill-hue': String(hue),
                } as React.CSSProperties}
              >
                {skill.image_url && (
                  <img
                    src={skill.image_display || skill.image_url}
                    alt={skill.name}
                    className="tsp-pill-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {skill.name}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
