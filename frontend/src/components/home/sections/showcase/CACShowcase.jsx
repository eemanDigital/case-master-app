import React, { memo } from "react";
import { useReveal } from "../../hooks";
import { cacBenefits } from "../../data/homePageData";

const entities = [
  { n: "Babcock Industries Ltd", t: "Private Company", s: "Compliant", p: "lm-pill-blue" },
  { n: "Greenfield Ventures Ltd", t: "Small Private Co.", s: "Due in 14 days", p: "lm-pill-amber" },
  { n: "Prime Assets LP", t: "Limited Partnership", s: "Overdue", p: "lm-pill-rose" },
  { n: "Metro Trust Trustees", t: "Inc. Trustees", s: "Compliant", p: "lm-pill-blue" },
];

const CACShowcase = memo(function CACShowcase() {
  const rCL = useReveal();
  const rCR = useReveal();

  return (
    <section id="cac-compliance" className="lm-showcase">
      <div className="lm-showcase-inner">
        <div ref={rCL} className="lm-reveal">
          <div className="lm-showcase-screen">
            <div className="lm-screen-hdr">
              <span className="lm-screen-title">CAC Compliance Dashboard</span>
              <span className="lm-pill lm-pill-blue">● PRO</span>
            </div>
            <div className="lm-screen-body">
              {entities.map((m, i) => (
                <div key={i} className="lm-matter-row">
                  <div className="lm-m-av">🏢</div>
                  <div className="lm-m-info">
                    <div className="lm-m-name">{m.n}</div>
                    <div className="lm-m-type">{m.t}</div>
                  </div>
                  <span className={`lm-pill ${m.p}`} style={{ marginRight: 8 }}>
                    {m.s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div ref={rCR} className="lm-reveal lm-rd2">
          <div className="lm-eyebrow">
            <div className="lm-eyebrow-line" />
            CAC Compliance Module
          </div>
          <h2 className="lm-h2">
            Never miss a
            <br />
            regulatory deadline.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 300, lineHeight: 1.72 }}>
            Comprehensive CAC compliance tracking for Nigerian entities
            under CAMA 2020. Monitor all 9 entity types, calculate
            penalties, and generate advisory letters automatically.
          </p>
          <ul className="lm-benefits">
            {cacBenefits.map((b, i) => (
              <li key={i} className="lm-benefit">
                <div className="lm-benefit-ico">{b.ico}</div>
                <div>
                  <div className="lm-benefit-title">{b.t}</div>
                  <div className="lm-benefit-desc">{b.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
});

export default CACShowcase;
