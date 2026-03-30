import React, { memo } from "react";
import { useReveal } from "../../hooks";
import { templateBenefits } from "../../data/homePageData";

const templates = [
  { t: "Employment Contract", c: "Contracts" },
  { t: "Service Agreement", c: "Contracts" },
  { t: "Writ of Summons", c: "Court Processes" },
  { t: "Affidavit of Loss", c: "Court Processes" },
  { t: "Deed of Assignment", c: "Property" },
  { t: "Memorandum of Understanding", c: "Corporate" },
];

const TemplatesShowcase = memo(function TemplatesShowcase() {
  const rTR = useReveal();
  const rTL = useReveal();

  return (
    <section id="templates" className="lm-showcase">
      <div className="lm-showcase-inner">
        <div ref={rTR} className="lm-reveal">
          <div className="lm-eyebrow">
            <div className="lm-eyebrow-line" />
            Legal Templates
          </div>
          <h2 className="lm-h2">
            Generate documents
            <br />
            in seconds.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 300, lineHeight: 1.72 }}>
            Access a library of Nigerian legal document templates. Fill in
            dynamic placeholders and generate ready-to-use documents in minutes.
          </p>
          <ul className="lm-benefits">
            {templateBenefits.map((b, i) => (
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

        <div ref={rTL} className="lm-reveal lm-rd2">
          <div className="lm-showcase-screen">
            <div className="lm-screen-hdr">
              <span className="lm-screen-title">Legal Templates Library</span>
              <span className="lm-pill lm-pill-blue">● 15+ templates</span>
            </div>
            <div className="lm-screen-body">
              {templates.map((m, i) => (
                <div key={i} className="lm-matter-row">
                  <div className="lm-m-av">📄</div>
                  <div className="lm-m-info">
                    <div className="lm-m-name">{m.t}</div>
                    <div className="lm-m-type">{m.c}</div>
                  </div>
                  <span className="lm-pill lm-pill-blue" style={{ marginRight: 8 }}>
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default TemplatesShowcase;
