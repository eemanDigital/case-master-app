import { Link } from "react-router-dom";
import LogoMark from "../LogoMark.jsx";
import { footerLinks } from "../data/homePageData";

const socialLinks = ["𝕏", "in", "fb", "●"];

export default function Footer() {
  return (
    <footer className="lm-footer">
      <div className="lm-footer-inner">
        <div className="lm-footer-top">
          <div>
            <div className="lm-logo" style={{ marginBottom: 12 }}>
              <div className="lm-logo-mark">
                <LogoMark />
              </div>
              <span className="lm-logo-name">LawMaster</span>
            </div>
            <p className="lm-footer-tagline">
              The modern legal practice management platform built for
              Nigerian law firms.
            </p>
            <div className="lm-social-row">
              {socialLinks.map((s, i) => (
                <a key={i} href="#" className="lm-social-btn">{s}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="lm-footer-col-title">Product</div>
            <ul className="lm-footer-links">
              {footerLinks.product.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="lm-footer-col-title">Company</div>
            <ul className="lm-footer-links">
              {footerLinks.company.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="lm-footer-col-title">Legal</div>
            <ul className="lm-footer-links">
              {footerLinks.legal.map((l) => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="lm-footer-bottom">
          <p className="lm-footer-copy">
            © 2026 LawMaster Technologies Ltd. All rights reserved.
          </p>
          <div className="lm-footer-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
            <Link to="/cookie-policy">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
