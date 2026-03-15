import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import "./styles/Navbar.css";
import { usePortfolio } from "../context/PortfolioContext";

gsap.registerPlugin(ScrollTrigger);

// Native polyfill matching the ScrollSmoother API used by this project
export const smoother = {
  paused: (v: boolean) => {
    document.body.style.overflow = v ? "hidden" : "auto";
  },
  scrollTo: (target: string | null, _animate?: boolean, _position?: string) => {
    if (!target) return;
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  },
  scrollTop: (y: number) => {
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
  },
};

const Navbar = () => {
  const { data } = usePortfolio();
  useEffect(() => {
    smoother.scrollTop(0);
    smoother.paused(true);

    const links = document.querySelectorAll(".header ul a");
    links.forEach((elem) => {
      const element = elem as HTMLAnchorElement;
      element.addEventListener("click", (e) => {
        if (window.innerWidth > 1024) {
          e.preventDefault();
          const section = element.getAttribute("data-href");
          smoother.scrollTo(section, true, "top top");
        }
      });
    });
    window.addEventListener("resize", () => {
      ScrollTrigger.refresh();
    });
  }, []);
  return (
    <>
      <div className="header">
        <a href="/#" className="navbar-title" data-cursor="disable">
          {data?.navbar_initials ?? 'RC'}
        </a>
        <a
          href={`mailto:${data?.email ?? ''}`}
          className="navbar-connect"
          data-cursor="disable"
        >
          {data?.email}
        </a>
        <ul>
          <li>
            <a data-href="#about" href="#about">
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
