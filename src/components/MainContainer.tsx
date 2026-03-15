import { lazy, PropsWithChildren, Suspense, useContext, useEffect, useState } from "react";
import About from "./About";
import Achievements from "./Achievements";
import Career from "./Career";
import CareerTimeline from "./CareerTimeline";
import Certifications from "./Certifications";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Education from "./Education";
import Landing from "./Landing";
import Navbar from "./Navbar";
import PersonalProjects from "./PersonalProjects";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import WorkCards from "./WorkCards";
import TechStackPills from "./TechStackPills";
import setSplitText from "./utils/splitText";
import { PortfolioContext } from "../context/PortfolioContext";
import ThemeProvider from "../themes/ThemeProvider";

const TechStack = lazy(() => import("./TechStack"));

const MainContainer = ({ children }: PropsWithChildren) => {
  const { data } = useContext(PortfolioContext);
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );

  useEffect(() => {
    const resizeHandler = () => {
      setSplitText();
      setIsDesktopView(window.innerWidth > 1024);
    };
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isDesktopView]);

  return (
    <ThemeProvider>
      <div className="container-main">
        <Cursor />
        <Navbar />
        <SocialIcons />
        {isDesktopView && children}
        <div id="smooth-wrapper">
          <div id="smooth-content">
            <div className="container-main">
              <Landing>{!isDesktopView && children}</Landing>
              <About />
              <WhatIDo />
              {data?.variant_career === 'timeline'
                ? <CareerTimeline />
                : <Career />}
              {data?.show_education && <Education />}
              {data?.variant_work === 'grid'
                ? <WorkCards />
                : <Work />}
              {isDesktopView && (
                <Suspense fallback={<div>Loading....</div>}>
                  {data?.variant_techstack === 'pills'
                    ? <TechStackPills />
                    : <TechStack />}
                </Suspense>
              )}
              {data?.show_certifications && <Certifications />}
              {data?.show_achievements && <Achievements />}
              {data?.show_personal_projects && <PersonalProjects />}
              <Contact />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default MainContainer;
