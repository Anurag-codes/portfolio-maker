import { useEffect, useRef } from "react";
import "./styles/WhatIDo.css";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePortfolio } from "../context/PortfolioContext";

const WhatIDo = () => {
  const { data } = usePortfolio();
  const sections = data?.whatido_sections ?? [];
  const containerRef = useRef<(HTMLDivElement | null)[]>([]);
  const setRef = (el: HTMLDivElement | null, index: number) => {
    containerRef.current[index] = el;
  };
  useEffect(() => {
    if (ScrollTrigger.isTouch) {
      containerRef.current.forEach((container) => {
        if (container) {
          container.classList.remove("what-noTouch");
          container.addEventListener("click", () => handleClick(container));
        }
      });
    }
    return () => {
      containerRef.current.forEach((container) => {
        if (container) {
          container.removeEventListener("click", () => handleClick(container));
        }
      });
    };
  }, []);
  const sectionCount = Math.max(sections.length, 1);

  return (
    <div className="whatIDO">
      <div className="what-box">
        <h2 className="what-heading">
          W<span className="hat-h2">HAT</span> I
          <span className="what-do-line"><span className="do-h2">DO</span></span>
        </h2>
      </div>
      <div className="what-box">
        <div
          className="what-box-in"
          style={{ "--section-count": sectionCount } as React.CSSProperties}
        >
          <div className="what-border2">
            <svg width="100%">
              <line x1="0" y1="0" x2="0" y2="100%" stroke="white" strokeWidth="2" strokeDasharray="7,7" />
              <line x1="100%" y1="0" x2="100%" y2="100%" stroke="white" strokeWidth="2" strokeDasharray="7,7" />
            </svg>
          </div>
          {sections.map((section, idx) => (
            <div
              key={section.id ?? idx}
              className="what-content what-noTouch"
              ref={(el) => setRef(el, idx)}
            >
              <div className="what-border1">
                <svg height="100%">
                  {idx === 0 && (
                    <line x1="0" y1="0" x2="100%" y2="0" stroke="white" strokeWidth="2" strokeDasharray="6,6" />
                  )}
                  <line x1="0" y1="100%" x2="100%" y2="100%" stroke="white" strokeWidth="2" strokeDasharray="6,6" />
                </svg>
              </div>
              <div className="what-corner"></div>
              <div className="what-content-in">
                <h3>{section.category}</h3>
                <h4>{section.title}</h4>
                <p>{section.description}</p>
                <h5>Skillset &amp; tools</h5>
                <div className="what-content-flex">
                  {section.tags.map((tag, tIdx) => (
                    <div className="what-tags" key={tIdx}>{tag}</div>
                  ))}
                </div>
                <div className="what-arrow"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatIDo;

function handleClick(container: HTMLDivElement) {
  container.classList.toggle("what-content-active");
  container.classList.remove("what-sibling");
  if (container.parentElement) {
    const siblings = Array.from(container.parentElement.children);

    siblings.forEach((sibling) => {
      if (sibling !== container) {
        sibling.classList.remove("what-content-active");
        sibling.classList.toggle("what-sibling");
      }
    });
  }
}
