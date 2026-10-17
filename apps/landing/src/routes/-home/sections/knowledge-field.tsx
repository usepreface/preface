import * as React from "react";

import { seeded } from "@usepreface/ui/patterns";

import { useInView } from "../../../hooks/use-in-view";
import { useReducedMotion } from "../../../hooks/use-reduced-motion";
import { Eyebrow } from "../components/eyebrow";

/*
 * Figma "Knowledge field": a monospace glyph field behind one sentence. Motion note from the
 * design: glyphs flicker every 80 ms, 3% of them per frame.
 */

const W = 1440;
const H = 520;
const CELL = 7.8;
const LINE = 20;
const COLS = Math.floor(W / CELL);
const ROWS = Math.floor(H / LINE);
const GLYPHS = "[1]{}#/:;.·+=<>*~|".split("");

function initialField(seed: number) {
  const { rnd, rr } = seeded(seed);
  const rows: string[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: string[] = [];
    for (let c = 0; c < COLS; c++) {
      const v = Math.sin(c * 0.06 + r * 0.2) + Math.sin(c * 0.025 - r * 0.11) + rr(-0.6, 0.6);
      row.push(v > 0.25 ? (GLYPHS[Math.floor(rnd() * GLYPHS.length)] ?? ".") : " ");
    }
    rows.push(row);
  }
  return rows;
}

function GlyphField() {
  const ref = React.useRef<SVGSVGElement>(null);
  const field = React.useRef(initialField(21));
  const [, setFrame] = React.useState(0);
  const inView = useInView(ref, "120px");
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (!inView || reduced) {
      return;
    }
    const filled: [number, number][] = [];
    field.current.forEach((row, r) => row.forEach((ch, c) => ch !== " " && filled.push([r, c])));
    const perFrame = Math.max(1, Math.round(filled.length * 0.03));
    const id = window.setInterval(() => {
      for (let i = 0; i < perFrame; i++) {
        const cell = filled[Math.floor(Math.random() * filled.length)];
        const row = cell && field.current[cell[0]];
        if (cell && row) {
          row[cell[1]] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? ".";
        }
      }
      setFrame((f) => f + 1);
    }, 80);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full [mask-image:radial-gradient(ellipse_62%_75%_at_50%_55%,transparent_0%,rgb(0_0_0/0.04)_42%,rgb(0_0_0/0.45)_75%,transparent_100%)] dark:[mask-image:radial-gradient(ellipse_62%_75%_at_50%_55%,transparent_0%,rgb(0_0_0/0.04)_42%,rgb(0_0_0/0.6)_75%,transparent_100%)]"
    >
      <g
        fill="var(--landing-field)"
        fontFamily="var(--font-mono)"
        fontSize={13}
        style={{ whiteSpace: "pre" }}
      >
        {field.current.map((row, i) => (
          <text key={i} x={0} y={(i + 1) * LINE - 5} xmlSpace="preserve">
            {row.join("")}
          </text>
        ))}
      </g>
    </svg>
  );
}

export function KnowledgeField() {
  return (
    <section
      aria-labelledby="field-title"
      className="relative overflow-hidden bg-(--landing-canvas) px-5 py-20 sm:px-8 lg:py-35"
    >
      <GlyphField />
      <div className="relative mx-auto flex max-w-240 flex-col items-center gap-7 text-center">
        <Eyebrow data-reveal="">Every answer has a source</Eyebrow>
        <p
          id="field-title"
          data-reveal=""
          style={{ "--delay": "120ms" } as React.CSSProperties}
          className="font-display text-[1.875rem] leading-9 font-medium tracking-[-0.02em] text-balance text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-13"
        >
          Your docs, code and conversations already know the answer. Preface finds it, cites it, and
          stays out of the way.
        </p>
      </div>
    </section>
  );
}
