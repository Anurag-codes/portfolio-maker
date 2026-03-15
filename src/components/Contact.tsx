import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";
import { usePortfolio } from "../context/PortfolioContext";

const Contact = () => {
  const { data } = usePortfolio();

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>Contact</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${data?.email}`} data-cursor="disable">
                {data?.email}
              </a>
            </p>
            <h4>Education</h4>
            <p>{data?.education}</p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            {data?.github_url && (
              <a href={data.github_url} target="_blank" data-cursor="disable" className="contact-social">
                Github <MdArrowOutward />
              </a>
            )}
            {data?.linkedin_url && (
              <a href={data.linkedin_url} target="_blank" data-cursor="disable" className="contact-social">
                Linkedin <MdArrowOutward />
              </a>
            )}
            {data?.twitter_url && (
              <a href={data.twitter_url} target="_blank" data-cursor="disable" className="contact-social">
                Twitter <MdArrowOutward />
              </a>
            )}
            {data?.instagram_url && (
              <a href={data.instagram_url} target="_blank" data-cursor="disable" className="contact-social">
                Instagram <MdArrowOutward />
              </a>
            )}
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>{data?.copyright_name}</span>
            </h2>
            <h5>
              <MdCopyright /> {data?.copyright_year}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
