const LEGEND = [
  { num: 1, desc: "Structured facts only — no free text the model can misread." },
  { num: 2, desc: "Rephrases and ranks by relevance; instructed never to invent a fact, a location, or a stat." },
  { num: 3, desc: "Every output field is Zod-checked before it ever reaches the page." },
  { num: 4, desc: "Click-to-edit before export — a bad phrase gets fixed by hand, not a full re-run." },
];

export function BlueprintPipeline() {
  return (
    <div>
      <p className="blueprint-mono text-[11px] tracking-[0.1em] uppercase text-[var(--bp-accent)] mb-1 mt-0">
        Fig. 1
      </p>
      <h2 className="text-[20px] font-normal mb-4">System pipeline, as built</h2>
      <div className="border border-[var(--bp-panel-line)] p-5 pt-7">
        <svg viewBox="0 0 900 260" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="90" width="150" height="70" fill="var(--bp-panel)" stroke="var(--bp-line)" strokeWidth="1.3" />
          <text x="85" y="118" textAnchor="middle" className="blueprint-mono" fontSize="10.5" fill="var(--bp-line)" letterSpacing="0.03em">PROFILE STORE</text>
          <text x="85" y="134" textAnchor="middle" className="blueprint-mono" fontSize="8.5" fill="var(--bp-line-dim)">lib/my-profile.ts</text>

          <rect x="235" y="70" width="180" height="110" fill="var(--bp-panel)" stroke="var(--bp-line)" strokeWidth="1.3" />
          <text x="325" y="105" textAnchor="middle" className="blueprint-mono" fontSize="10.5" fill="var(--bp-line)" letterSpacing="0.03em">TAILORING ENGINE</text>
          <text x="325" y="120" textAnchor="middle" className="blueprint-mono" fontSize="8.5" fill="var(--bp-line-dim)">Claude Sonnet, prompt-</text>
          <text x="325" y="132" textAnchor="middle" className="blueprint-mono" fontSize="8.5" fill="var(--bp-line-dim)">bound to source facts</text>
          <text x="325" y="152" textAnchor="middle" className="blueprint-mono" fontSize="8.5" fill="var(--bp-line-dim)">lib/claude.ts</text>

          <rect x="490" y="90" width="150" height="70" fill="var(--bp-panel)" stroke="var(--bp-line)" strokeWidth="1.3" />
          <text x="565" y="118" textAnchor="middle" className="blueprint-mono" fontSize="10.5" fill="var(--bp-line)" letterSpacing="0.03em">SCHEMA GATE</text>
          <text x="565" y="134" textAnchor="middle" className="blueprint-mono" fontSize="8.5" fill="var(--bp-line-dim)">Zod validation</text>

          <rect x="715" y="55" width="175" height="60" fill="var(--bp-panel)" stroke="var(--bp-line)" strokeWidth="1.3" />
          <text x="802" y="82" textAnchor="middle" className="blueprint-mono" fontSize="10.5" fill="var(--bp-line)" letterSpacing="0.03em">RÉSUMÉ OUTPUT</text>
          <text x="802" y="97" textAnchor="middle" className="blueprint-mono" fontSize="8.5" fill="var(--bp-line-dim)">editable, one page</text>

          <rect x="715" y="145" width="175" height="60" fill="var(--bp-panel)" stroke="var(--bp-line)" strokeWidth="1.3" />
          <text x="802" y="172" textAnchor="middle" className="blueprint-mono" fontSize="10.5" fill="var(--bp-line)" letterSpacing="0.03em">COVER LETTER</text>
          <text x="802" y="187" textAnchor="middle" className="blueprint-mono" fontSize="8.5" fill="var(--bp-line-dim)">editable, on demand</text>

          <path d="M160,125 L235,125" stroke="var(--bp-line-dim)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          <path d="M415,125 L490,125" stroke="var(--bp-line-dim)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          <path d="M640,110 L715,85" stroke="var(--bp-line-dim)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          <path d="M640,140 L715,175" stroke="var(--bp-line-dim)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
          <polygon points="230,121 238,125 230,129" fill="var(--bp-line-dim)" />
          <polygon points="485,121 493,125 485,129" fill="var(--bp-line-dim)" />

          {[
            { cx: 85, cy: 70, n: 1 },
            { cx: 325, cy: 45, n: 2 },
            { cx: 565, cy: 70, n: 3 },
            { cx: 802, cy: 30, n: 4 },
          ].map(({ cx, cy, n }) => (
            <g key={n}>
              <circle cx={cx} cy={cy} r="10" fill="var(--bp-bg)" stroke="var(--bp-accent)" strokeWidth="1.3" />
              <text x={cx} y={cy + 4} textAnchor="middle" className="blueprint-mono" fontSize="10" fill="var(--bp-accent)" fontWeight="600">
                {n}
              </text>
            </g>
          ))}
        </svg>

        <div className="grid gap-x-6 gap-y-3.5 mt-5 sm:grid-cols-2">
          {LEGEND.map((item) => (
            <div key={item.num} className="text-[13px]">
              <span className="blueprint-mono text-[var(--bp-accent)] font-semibold mr-1.5">{item.num}</span>
              <span className="text-[var(--bp-line-dim)]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
