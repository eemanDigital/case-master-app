import { useReveal } from "../hooks";
import { features } from "../data/homePageData";

export default function FeaturesSection() {
  const rFH = useReveal();
  const rFG = useReveal();

  return (
    <section id="features" className="lm-features">
      <div className="lm-section-inner">
        <div ref={rFH} className="lm-reveal">
          <div className="lm-eyebrow">
            <div className="lm-eyebrow-line" />
            Capabilities
          </div>
          <h2 className="lm-h2">
            One platform.
            <br />
            Every workflow.
          </h2>
          <p className="lm-sub">
            Everything a modern law firm needs — designed with the precision
            your practice demands.
          </p>
        </div>
        <div ref={rFG} className="lm-reveal lm-rd2 lm-feat-grid">
          {features.map((f, i) => (
            <div key={i} className="lm-feat-card">
              <div className="lm-feat-ico">{f.ico}</div>
              <div className="lm-feat-title">{f.title}</div>
              <div className="lm-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
