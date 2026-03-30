import { Link } from "react-router-dom";
import LogoMark from "../LogoMark.jsx";
import { navLinks } from "../data/homePageData";
import { useScrolled } from "../hooks";

export default function Navbar() {
  const scrolled = useScrolled(40);

  return (
    <nav className={`lm-nav ${scrolled ? "scrolled" : ""}`} style={{ paddingTop: 3 }}>
      <div className="lm-nav-inner">
        <Link to="/" className="lm-logo">
          <div className="lm-logo-mark">
            <LogoMark />
          </div>
          <span className="lm-logo-name">LawMaster</span>
        </Link>
        <ul className="lm-nav-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
        <div className="lm-nav-actions">
          <Link to="/users/login" className="lm-btn lm-btn-ghost">
            Sign in
          </Link>
          <Link to="/register" className="lm-btn lm-btn-primary">
            Get started →
          </Link>
        </div>
      </div>
    </nav>
  );
}
