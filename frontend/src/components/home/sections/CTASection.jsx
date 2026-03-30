import { Link } from "react-router-dom";
import { useReveal } from "../hooks";

export default function CTASection() {
  const rCta = useReveal();

  return (
    <section className="lm-cta">
      <div className="lm-cta-inner">
        <div ref={rCta} className="lm-reveal lm-cta-box">
          <h2 className="lm-cta-h2">
            Your practice deserves
            <br />
            <em>better infrastructure.</em>
          </h2>
          <p className="lm-cta-sub">
            Join 500+ Nigerian law firms running on LawMaster. Start free —
            no card required.
          </p>
          <div className="lm-cta-btns">
            <Link to="/users/login" className="lm-btn lm-btn-primary lm-btn-lg">
              Start 14-day free trial →
            </Link>
            <button className="lm-btn-outline-lg">Schedule a demo</button>
          </div>
        </div>
      </div>
    </section>
  );
}
