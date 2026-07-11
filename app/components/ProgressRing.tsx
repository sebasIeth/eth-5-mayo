"use client";

import { useEffect, useRef, useState } from "react";

const TARGET = 80;
const SIZE = 260;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProgressRing() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pct, setPct] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = () => {
      if (started.current) return;
      started.current = true;

      if (prefersReduced) {
        setPct(TARGET);
        return;
      }

      const duration = 1600;
      let startTs: number | null = null;

      const tick = (ts: number) => {
        if (startTs === null) startTs = ts;
        const progress = Math.min((ts - startTs) / duration, 1);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setPct(Math.round(eased * TARGET));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) run();
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  return (
    <div className="ring" ref={ref} role="img" aria-label={`${TARGET}% mínimo requerido para obtener el Sello`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          className="ring__track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
        />
        <circle
          className="ring__value"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring__center" aria-hidden="true">
        <div className="ring__pct">
          {pct}
          <span>%</span>
        </div>
        <div className="ring__caption">mínimo requerido</div>
      </div>
    </div>
  );
}
