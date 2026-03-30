import { Link } from "react-router-dom";
import { useReveal } from "../hooks";
import { testimonials } from "../data/homePageData";

export default function TestimonialsSection() {
  const rTH = useReveal();
  const rTG = useReveal();

  return (
    <section id="testimonials" className="lm-testimonials">
      <div className="lm-section-inner">
        <div ref={rTH} className="lm-reveal">
          <div className="lm-eyebrow">
            <div className="lm-eyebrow-line" />
            Testimonials
          </div>
          <h2 className="lm-h2">
            Practitioners who
            <br />
            made the switch.
          </h2>
        </div>
        <div ref={rTG} className="lm-reveal lm-rd2 lm-testi-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="lm-testi-card">
              <div className="lm-stars">★★★★★</div>
              <div className="lm-testi-qmark">"</div>
              <p className="lm-testi-quote">{t.q}</p>
              <div className="lm-testi-author">
                <div className="lm-testi-av">{t.init}</div>
                <div>
                  <div className="lm-testi-name">{t.name}</div>
                  <div className="lm-testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
