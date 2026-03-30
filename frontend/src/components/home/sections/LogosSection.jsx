import { useReveal } from "../hooks";
import { firms } from "../data/homePageData";

export default function LogosSection() {
  const rLogos = useReveal();

  return (
    <div ref={rLogos} className="lm-logos lm-reveal">
      <div className="lm-logos-inner">
        <p className="lm-logos-lbl">
          Trusted by leading chambers across Nigeria
        </p>
        <div className="lm-logos-row">
          {firms.map((f) => (
            <div key={f} className="lm-firm">{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
