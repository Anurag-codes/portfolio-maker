import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { useEffect } from "react";
import HoverLinks from "./HoverLinks";
import { usePortfolio } from "../context/PortfolioContext";

const SocialIcons = () => {
  const { data } = usePortfolio();
  useEffect(() => {
    const social = document.getElementById("social") as HTMLElement;

    social.querySelectorAll("span").forEach((item) => {
      const elem = item as HTMLElement;
      const link = elem.querySelector("a") as HTMLElement;

      const rect = elem.getBoundingClientRect();
      let mouseX = rect.width / 2;
      let mouseY = rect.height / 2;
      let currentX = 0;
      let currentY = 0;

      const updatePosition = () => {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        link.style.setProperty("--siLeft", `${currentX}px`);
        link.style.setProperty("--siTop", `${currentY}px`);

        requestAnimationFrame(updatePosition);
      };

      const onMouseMove = (e: MouseEvent) => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 40 && x > 10 && y < 40 && y > 5) {
          mouseX = x;
          mouseY = y;
        } else {
          mouseX = rect.width / 2;
          mouseY = rect.height / 2;
        }
      };

      document.addEventListener("mousemove", onMouseMove);

      updatePosition();

      return () => {
        elem.removeEventListener("mousemove", onMouseMove);
      };
    });
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        {data?.github_url && (
          <span>
            <a href={data.github_url} target="_blank">
              <FaGithub />
            </a>
          </span>
        )}
        {data?.linkedin_url && (
          <span>
            <a href={data.linkedin_url} target="_blank">
              <FaLinkedinIn />
            </a>
          </span>
        )}
        {data?.twitter_url && (
          <span>
            <a href={data.twitter_url} target="_blank">
              <FaXTwitter />
            </a>
          </span>
        )}
        {data?.instagram_url && (
          <span>
            <a href={data.instagram_url} target="_blank">
              <FaInstagram />
            </a>
          </span>
        )}
      </div>
      <a className="resume-button" href={data?.resume_url || '#'} target="_blank">
        <HoverLinks text="RESUME" />
        <span>
          <TbNotes />
        </span>
      </a>
    </div>
  );
};

export default SocialIcons;
