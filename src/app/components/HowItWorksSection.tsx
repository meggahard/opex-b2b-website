import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Enter Financial Data',
    description: 'Use your Annual Report P&L data — Revenue, COGS, Operating Costs. Takes 3 minutes. No equipment connection, no IT setup.',
    detail: 'Revenue · COGS · Gross Margin · OpEx · Balance Sheet',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    time: '3 min',
    span: 'lg:col-span-5',
    accent: false,
  },
  {
    number: '02',
    title: 'Simulate OEE',
    description: 'Interactive sliders model your production performance. Adjust Availability, Performance, and Quality scores. No equipment connection needed.',
    detail: 'Availability · Performance · Quality → OEE%',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    time: '5 min',
    span: 'lg:col-span-7',
    accent: true,
  },
  {
    number: '03',
    title: 'Get Your Business Case',
    description: 'Instant Before/After Financial Impact Report. DuPont-validated cost analysis. Download or share — boardroom-ready in minutes.',
    detail: 'Before/After · DuPont Tree · ROI · Payback Period',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    time: '2 min',
    span: 'lg:col-span-12',
    accent: false,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-pad bg-background" aria-labelledby="how-it-works-heading">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-16 reveal-item">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
            The Process
          </span>
          <h2 id="how-it-works-heading" className="text-section-xl font-black text-foreground">
            From Annual Report to<br />
            <span className="text-amber">Business Case in 10 minutes.</span>
          </h2>
        </div>

        {/* Steps grid — asymmetric */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Step 1 — compact */}
          <div className="lg:col-span-5 reveal-item" data-delay="0.1">
            <div className="card-hover bg-card border border-border rounded-4xl p-8 h-full flex flex-col justify-between min-h-[280px] shadow-card">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground">
                  {steps?.[0]?.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {steps?.[0]?.time}
                  </span>
                  <span className="text-3xl font-black text-muted/80 font-display">{steps?.[0]?.number}</span>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">{steps?.[0]?.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4 font-body text-sm">{steps?.[0]?.description}</p>
                <div className="text-xs font-bold text-amber tracking-wide">{steps?.[0]?.detail}</div>
              </div>
            </div>
          </div>

          {/* Step 2 — wider, accent */}
          <div className="lg:col-span-7 reveal-item" data-delay="0.2">
            <div
              className="card-hover rounded-4xl p-8 h-full flex flex-col justify-between min-h-[280px] relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0B1929 0%, #1E3A5F 100%)' }}
            >
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="w-14 h-14 bg-amber/20 rounded-2xl flex items-center justify-center text-amber">
                  {steps?.[1]?.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber/70 bg-amber/10 px-3 py-1 rounded-full">
                    {steps?.[1]?.time}
                  </span>
                  <span className="text-3xl font-black text-white/20 font-display">{steps?.[1]?.number}</span>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{steps?.[1]?.title}</h3>
                <p className="text-white/60 leading-relaxed mb-4 font-body text-sm">{steps?.[1]?.description}</p>
                <div className="text-xs font-bold text-amber tracking-wide">{steps?.[1]?.detail}</div>
              </div>
              {/* OEE mini visualization */}
              <div className="relative z-10 mt-6 flex gap-3">
                {[
                  { label: 'Avail.', pct: 59 },
                  { label: 'Perf.', pct: 99 },
                  { label: 'Quality', pct: 100 },
                ]?.map((g) => (
                  <div key={g?.label} className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{g?.label}</div>
                    <div className="text-white font-black text-lg">{g?.pct}%</div>
                    <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber rounded-full"
                        style={{ width: `${g?.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 — full width */}
          <div className="lg:col-span-12 reveal-item" data-delay="0.3">
            <div className="card-hover bg-card border border-border rounded-4xl p-8 shadow-card">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-1 flex items-start gap-4">
                  <div className="w-14 h-14 bg-amber/10 rounded-2xl flex items-center justify-center text-amber flex-shrink-0">
                    {steps?.[2]?.icon}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {steps?.[2]?.time}
                    </span>
                    <span className="text-3xl font-black text-muted/80 font-display">{steps?.[2]?.number}</span>
                  </div>
                </div>
                <div className="md:col-span-1">
                  <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">{steps?.[2]?.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-body text-sm">{steps?.[2]?.description}</p>
                </div>
                <div className="md:col-span-1">
                  <div className="grid grid-cols-2 gap-3">
                    {['Before/After P&L', 'DuPont Tree', 'ROI Summary', 'Payback Chart']?.map((item) => (
                      <div key={item} className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-amber flex-shrink-0" />
                        <span className="text-xs font-bold text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight callout */}
        <div className="mt-10 reveal-item" data-delay="0.4">
          <div
            className="rounded-3xl p-6 border border-amber/20 flex flex-col md:flex-row items-start md:items-center gap-4"
            style={{ background: 'rgba(245,158,11,0.04)' }}
          >
            <div className="w-10 h-10 rounded-full bg-amber/20 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed font-body">
              <strong className="text-foreground font-bold">Key insight:</strong> A 5-point quality OEE improvement delivers approximately{' '}
              <strong className="text-amber">72% more net profit</strong> than a 5-point availability improvement for the same OEE gain — because quality losses carry a dual DuPont penalty on both Asset Turnover AND Net Profit Margin simultaneously.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
