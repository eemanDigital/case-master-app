import { Link } from "react-router-dom";
import { useReveal } from "../hooks";
import { plans } from "../data/homePageData";

export default function PricingSection() {
  const rPH = useReveal();
  const rPG = useReveal();

  return (
    <section id="pricing" className="lm-pricing">
      <div className="lm-section-inner">
        <div ref={rPH} className="lm-reveal" style={{ textAlign: "center" }}>
          <div className="lm-eyebrow" style={{ justifyContent: "center" }}>
            <div className="lm-eyebrow-line" />
            Pricing
          </div>
          <h2 className="lm-h2" style={{ maxWidth: 440, margin: "0 auto" }}>
            Simple, transparent pricing
          </h2>
          <p className="lm-sub" style={{ margin: "14px auto 48px", textAlign: "center" }}>
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
        <div ref={rPG} className="lm-reveal lm-rd2 lm-pricing-grid">
          {plans.map((p, i) => (
            <div key={i} className={`lm-plan ${p.popular ? "lm-plan-popular" : ""}`}>
              {p.popular && <div className="lm-plan-badge">Most Popular</div>}
              <div className="lm-plan-name">{p.name}</div>
              <div className="lm-plan-desc">{p.desc}</div>
              <div className="lm-plan-price">
                {p.price === "Custom" ? (
                  <span style={{ fontSize: 28 }}>Custom</span>
                ) : (
                  <>${p.price}</>
                )}
                {p.period && <span>{p.period}</span>}
              </div>
              <div className="lm-plan-divider" />
              <ul className="lm-plan-features">
                {p.features.map((f, j) => (
                  <li key={j} className="lm-plan-feature">
                    <div className="lm-plan-check">✓</div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/users/login"
                className={`lm-plan-cta ${p.popular ? "lm-plan-cta-primary" : "lm-plan-cta-ghost"}`}
              >
                {p.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
