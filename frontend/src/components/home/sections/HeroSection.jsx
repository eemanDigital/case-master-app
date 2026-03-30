import { Link } from "react-router-dom";
import { useReveal } from "../hooks";
import PreviewCard from "./PreviewCard";

const avatars = ["AO", "FK", "CE", "BL", "MR"];

export default function HeroSection() {
  const rHero = useReveal();

  return (
    <section className="lm-hero">
      <div className="lm-hero-bg" />
      <div className="lm-hero-grid" />
      <div className="lm-hero-inner">
        <div ref={rHero} className="lm-reveal">
          <div className="lm-hero-badge">
            <div className="lm-badge-dot" />
            Now in public release — v2.0
          </div>
          <h1 className="lm-hero-h1">
            Legal practice,
            <br />
            <em>finally</em> under
            <br />
            your control.
          </h1>
          <p className="lm-hero-sub">
            LawMaster unifies matter management, client billing, court
            calendars, and compliance into one elegant platform — built for
            the modern Nigerian law firm.
          </p>
          <div className="lm-hero-ctas">
            <Link to="/users/login" className="lm-btn lm-btn-primary lm-btn-lg">
              Start free — 14 days
            </Link>
            <button className="lm-btn-secondary-lg">
              ▶ Watch 2-min demo
            </button>
          </div>
          <div className="lm-hero-trust">
            <div className="lm-hero-avatars">
              {avatars.map((i) => (
                <div key={i} className="lm-hero-avatar">{i}</div>
              ))}
            </div>
            <span className="lm-hero-trust-text">
              Trusted by 500+ attorneys across Nigeria
            </span>
          </div>
        </div>
        <PreviewCard />
      </div>
    </section>
  );
}
