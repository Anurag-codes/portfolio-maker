import { PropsWithChildren } from "react";
import "./styles/Landing.css";
import { usePortfolio } from "../context/PortfolioContext";

const Landing = ({ children }: PropsWithChildren) => {
  const { data } = usePortfolio();

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              {data?.first_name.toUpperCase()}
              &ensp;
              {data?.last_name.toUpperCase()}
            </h1>
          </div>
          <div className="landing-info">
            <h3>{data?.title_prefix}</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">{data?.title_option1}</div>
              <div className="landing-h2-2">{data?.title_option2}</div>
            </h2>
            <h2>
              <div className="landing-h2-info">{data?.title_option2}</div>
              <div className="landing-h2-info-1">{data?.title_option1}</div>
            </h2>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
