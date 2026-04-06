import React, { memo, useEffect, useState, useCallback } from "react";
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

const TemplateRow = memo(function TemplateRow({ template, index }) {
  return (
    <div 
      className="lm-matter-row" 
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="lm-m-av" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
      <div className="lm-m-info">
        <div className="lm-m-name">{template.t}</div>
        <div className="lm-m-type">{template.c}</div>
      </div>
      <span className="lm-pill lm-pill-blue">Available</span>
    </div>
  );
});

const BenefitItem = memo(function BenefitItem({ benefit, index }) {
  return (
    <li 
      className="lm-benefit" 
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="lm-benefit-ico" aria-hidden="true">{benefit.ico}</div>
      <div>
        <div className="lm-benefit-title">{benefit.t}</div>
        <div className="lm-benefit-desc">{benefit.d}</div>
      </div>
    </li>
  );
});

const TemplatesShowcase = memo(function TemplatesShowcase() {
  const rTR = useReveal();
  const rTL = useReveal();
  const [isMobile, setIsMobile] = useState(false);

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return (
    <section id="templates" className="lm-showcase" aria-label="Templates showcase">
      <div className="lm-showcase-inner">
        <div ref={rTR} className="lm-reveal lm-showcase-text">
          <div className="lm-eyebrow">
            <div className="lm-eyebrow-line" aria-hidden="true" />
            Legal Templates
          </div>
          <h2 className="lm-h2">
            Generate documents
            {!isMobile && <br />}
            <span className="lm-h2-accent">in seconds.</span>
          </h2>
          <p className="lm-showcase-desc">
            Access a library of Nigerian legal document templates. Fill in
            dynamic placeholders and generate ready-to-use documents in minutes.
          </p>
          <ul className="lm-benefits" aria-label="Template benefits">
            {templateBenefits.map((b, i) => (
              <BenefitItem key={i} benefit={b} index={i} />
            ))}
          </ul>
        </div>

        <div ref={rTL} className="lm-reveal lm-rd2 lm-showcase-visual">
          <div className="lm-showcase-screen" role="img" aria-label="Template library preview">
            <div className="lm-screen-hdr">
              <span className="lm-screen-title">Legal Templates Library</span>
              <span className="lm-pill lm-pill-blue" aria-label="15 templates available">
                <span aria-hidden="true">●</span> 15+ templates
              </span>
            </div>
            <div className="lm-screen-body">
              {templates.map((m, i) => (
                <TemplateRow key={i} template={m} index={i} />
              ))}
              {isMobile && (
                <div className="lm-screen-more">
                  <span>+ 9 more templates</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default TemplatesShowcase;
