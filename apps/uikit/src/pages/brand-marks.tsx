import * as React from "react";

import {
  PrefaceAppIcon,
  PrefaceLogo,
  PrefaceMark,
  PrefaceWordmark,
  type AppIconSkin,
} from "@usepreface/ui/brand";

import { AssetCard, CopyButton } from "../components/asset";
import { Page, Section, Specimen } from "../components/bench";

const tones = [
  ["deep", "Deep", "On light surfaces", "bg-white"],
  ["ice", "Ice", "On dark surfaces", "bg-brand-slate"],
  ["white", "White", "On signal blue and photos", "bg-brand-signal"],
  ["ink", "Ink", "One-colour print on light", "bg-brand-frost"],
] as const;

/**
 * SVG twin of <PrefaceAppIcon> for export. Same skins: gradient or slate square, optional dither
 * dots that fade from one corner, and the Facet mark at 56%.
 */
function AppIconSvg({ skin, size = 96 }: { skin: AppIconSkin; size?: number }) {
  const id = React.useId().replace(/:/g, "");
  const r = Math.round(size * 0.225);
  const mark = Math.round(size * 0.56);
  const markW = Math.round((mark * 24) / 27);
  const dots = skin === "dither" || skin === "hybrid";
  const step = Math.max(4, size / 40);
  const corner = skin === "dither" ? [0, 0] : [size, size];
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Preface app icon, ${skin}`}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width={size} height={size} rx={r} />
        </clipPath>
        <linearGradient id={`${id}-dither`} x1="0" y1="0" x2="1" y2="1.2">
          <stop stopColor="#2F6BFF" />
          <stop offset="0.55" stopColor="#5C97FF" />
          <stop offset="1" stopColor="#8EC0FF" />
        </linearGradient>
        <pattern id={`${id}-dots`} width={step} height={step} patternUnits="userSpaceOnUse">
          <circle
            cx={step / 2}
            cy={step / 2}
            r={Math.max(0.75, size / 200)}
            fill={skin === "dither" ? "#FFFFFF" : "#4D96FF"}
            fillOpacity={skin === "dither" ? 0.4 : 0.6}
          />
        </pattern>
        <radialGradient
          id={`${id}-fade`}
          cx={corner[0]}
          cy={corner[1]}
          r={size * 1.1}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width={size} height={size} fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect
          width={size}
          height={size}
          fill={skin === "dither" ? `url(#${id}-dither)` : skin === "frost" ? "#F5F9FF" : "#16191F"}
        />
        {dots ? (
          <rect width={size} height={size} fill={`url(#${id}-dots)`} mask={`url(#${id}-mask)`} />
        ) : null}
        {skin === "frost" ? (
          <rect
            x={0.5}
            y={0.5}
            width={size - 1}
            height={size - 1}
            rx={r - 0.5}
            fill="none"
            stroke="#E5E8ED"
          />
        ) : null}
      </g>
      <PrefaceMark
        tone={skin === "dither" ? "white" : skin === "frost" ? "deep" : "ice"}
        size={mark}
        x={(size - markW) / 2}
        y={(size - mark) / 2}
        title=""
        aria-hidden
      />
    </svg>
  );
}

export function BrandMarksPage() {
  return (
    <Page
      figma="02 Logo · 04 App icons"
      title="Logo & app icons"
      description="The Facet mark, wordmark, lockups and app icons as React components. Hover a tile to copy its JSX or download it as SVG or PNG."
    >
      <Section title="Lockups" className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["Horizontal", "<PrefaceLogo size={32} />", <PrefaceLogo key="h" size={32} />, ""],
            [
              "Stacked",
              '<PrefaceLogo layout="stacked" size={28} />',
              <PrefaceLogo key="s" layout="stacked" size={28} />,
              "",
            ],
            [
              "On slate",
              '<PrefaceLogo tone="ice" />',
              <PrefaceLogo
                key="sl"
                size={28}
                tone="ice"
                className="[&_[data-slot=preface-wordmark]]:text-white"
              />,
              "bg-brand-slate",
            ],
            [
              "On signal",
              '<PrefaceLogo tone="white" />',
              <PrefaceLogo
                key="sg"
                size={28}
                tone="white"
                className="[&_[data-slot=preface-wordmark]]:text-white"
              />,
              "bg-brand-signal",
            ],
          ] as const
        ).map(([name, code, node, bg]) => (
          <div
            key={name}
            className="group/lock relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm"
          >
            <div className={`flex min-h-40 items-center justify-center p-8 ${bg}`}>{node}</div>
            <div className="flex items-center gap-2 border-t px-3 py-2">
              <span className="flex-1 text-13 font-medium">{name}</span>
              <code className="truncate font-mono text-2xs text-fg-tertiary">{code}</code>
              <CopyButton value={code} label="Copy JSX" toastLabel="Copied JSX" />
            </div>
          </div>
        ))}
      </Section>

      <Section
        title="Mark"
        description="Exports are the cropped 24 × 27 mark. Ice and deep carry the facet gradient."
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {tones.map(([tone, name, use, bg]) => (
            <AssetCard
              key={tone}
              name={name}
              caption={use}
              fileName={`preface-mark-${tone}`}
              code={`<PrefaceMark tone="${tone}" size={48} />`}
              stageClassName={`min-h-44 ${bg}`}
            >
              <PrefaceMark tone={tone} size={72} />
            </AssetCard>
          ))}
        </div>
      </Section>

      <Section
        title="Mark sizes"
        description="At 20px and below, compact raises facet contrast so the mark holds up as a favicon."
      >
        <div className="flex flex-wrap items-end gap-8 rounded-xl border bg-card p-8">
          {[12, 16, 20, 24, 32, 48, 64, 96].map((s) => (
            <div key={s} className="flex flex-col items-center gap-3">
              <PrefaceMark
                size={s}
                compact={s <= 20}
                className="transition-transform duration-300 hover:scale-110"
              />
              <span className="font-mono text-2xs text-fg-tertiary">{s}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Wordmark"
        description="Space Grotesk Medium at -3.5% tracking. Never set it in another face."
      >
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-8">
          <PrefaceWordmark className="text-7xl" />
          <PrefaceWordmark className="text-3xl text-fg-secondary" />
        </div>
      </Section>

      <Section
        title="App icons"
        description="Glacier is the product icon, Dither is for marketing, Hybrid for social avatars, Frost on light."
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(["glacier", "dither", "hybrid", "frost"] as const).map((skin) => (
            <AssetCard
              key={skin}
              name={skin[0]?.toUpperCase() + skin.slice(1)}
              caption={`skin="${skin}"`}
              fileName={`preface-app-icon-${skin}`}
              code={`<PrefaceAppIcon skin="${skin}" size={64} />`}
              stageClassName="min-h-44"
            >
              <span className="transition-transform duration-300 group-hover/asset:scale-105 group-hover/asset:-rotate-2">
                <AppIconSvg skin={skin} />
              </span>
            </AssetCard>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-5 rounded-xl border bg-card p-6">
          {(["glacier", "dither", "hybrid", "frost"] as const).map((skin) => (
            <div key={skin} className="flex flex-wrap items-end gap-5">
              <span className="w-16 text-overline text-fg-tertiary">{skin}</span>
              {[16, 20, 32, 48, 64, 96, 128].map((s) => (
                <PrefaceAppIcon key={s} skin={skin} size={s} />
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Favicons" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[16, 32].map((s) => (
          <Specimen key={s} label={`${s} × ${s}`} className="justify-center gap-6">
            <PrefaceAppIcon size={s} />
            <PrefaceMark size={s} compact />
          </Specimen>
        ))}
      </Section>
    </Page>
  );
}
