import { useState, useEffect, useRef } from "react";

export function useCounter(end, suffix = "") {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const num = parseFloat(end);
          const isFloat = String(end).includes(".");
          const duration = 1400;
          const step = 16;
          const inc = num / (duration / step);
          let cur = 0;

          const t = setInterval(() => {
            cur += inc;
            if (cur >= num) {
              cur = num;
              clearInterval(t);
            }
            setVal(isFloat ? cur.toFixed(1) : Math.floor(cur));
          }, step);
        }
      },
      { threshold: 0.3 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);

  return { ref, val, suffix };
}
