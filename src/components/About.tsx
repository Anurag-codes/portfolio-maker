import "./styles/About.css";
import { usePortfolio } from "../context/PortfolioContext";

const About = () => {
  const { data } = usePortfolio();

  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">About Me</h3>
        <p className="para">{data?.about_text}</p>
      </div>
    </div>
  );
};

export default About;
