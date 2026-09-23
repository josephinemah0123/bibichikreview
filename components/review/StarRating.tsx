"use client";
import { useRef, useState } from "react";
import { Star } from "lucide-react";
export function StarRating({ value, onChange, disabled = false }: { value: number; onChange: (value: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return <div className="rating-block">
    <div className="stars" role="radiogroup" aria-label="Rate your experience" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => <button key={n} ref={el => { refs.current[n - 1] = el; }} type="button" role="radio" aria-checked={value === n} aria-label={n + (n === 1 ? " star" : " stars")} tabIndex={value === n || (!value && n === 1) ? 0 : -1} disabled={disabled} className={"star " + ((hover || value) >= n ? "selected" : "")} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)} onKeyDown={e => {
        const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        const next = e.key === "Home" ? 1 : e.key === "End" ? 5 : delta ? ((n - 1 + delta + 5) % 5) + 1 : 0;
        if (next) { e.preventDefault(); setHover(0); onChange(next); refs.current[next - 1]?.focus(); }
      }}><Star aria-hidden="true" /></button>)}
    </div>
    <p className="rating-caption" aria-live="polite">{value ? value + " of 5 stars · " + ["", "Poor", "Fair", "Okay", "Good", "Wonderful"][value] : "Tap a star to share your experience"}</p>
  </div>;
}

