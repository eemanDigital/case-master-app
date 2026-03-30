import { useReveal, useCounter } from "../hooks";
import { stats } from "../data/homePageData";

function StatBox({ end, suffix, label }) {
  const { ref, val } = useCounter(end, suffix);
  return (
    <div className="lm-stat-box">
      <div ref={ref} className="lm-stat-num">
        {val}
        <span>{suffix}</span>
      </div>
      <div className="lm-stat-label">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  const rStats = useReveal();

  return (
    <section id="metrics" className="lm-stats">
      <div className="lm-section-inner">
        <div ref={rStats} className="lm-reveal" style={{ textAlign: "center" }}>
          <div className="lm-eyebrow" style={{ justifyContent: "center" }}>
            <div className="lm-eyebrow-line" />
            By the numbers
          </div>
          <h2 className="lm-h2" style={{ maxWidth: 460, margin: "0 auto" }}>
            Results that speak
            <br />
            for themselves
          </h2>
          <div className="lm-stats-grid">
            {stats.map((s, i) => (
              <StatBox key={i} end={s.end} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
