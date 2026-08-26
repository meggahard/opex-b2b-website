'use client';
import React, { useEffect, useRef } from 'react';
import AppLogo from '@/components/ui/AppLogo';

const proofMetrics = [
  { label: 'Scrap Rate', before: '8%', after: '2%', icon: '↓' },
  { label: 'On-Time Delivery', before: '78%', after: '94%', icon: '↑' },
  { label: 'Plant Audit', value: '4 min', icon: '⚡' },
];

const stats = [
  { value: '74%', label: 'SME manufacturers lack operational visibility' },
  { value: '64%', label: 'manage production on spreadsheets' },
  { value: '35–45%', label: 'average SME OEE vs 85% world-class' },
];

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      const blob1 = heroRef.current.querySelector('.blob-1') as HTMLElement;
      const blob2 = heroRef.current.querySelector('.blob-2') as HTMLElement;
      if (blob1) blob1.style.transform = `translateY(${scrollY * 0.15}px)`;
      if (blob2) blob2.style.transform = `translateY(${scrollY * -0.1}px)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCalculator = () => {
    const el = document.getElementById('calculator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const openAuditModal = () => {
    const event = new CustomEvent('openAuditModal');
    window.dispatchEvent(event);
    setTimeout(() => {
      const el = document.getElementById('report-cta');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen hero-gradient overflow-hidden flex flex-col justify-center"
      aria-label="Hero — OpEx Strategy Financial Impact Platform"
    >
      {/* Background depth layers */}
      <div
        className="blob-1 absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full animate-blob"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      <div
        className="blob-2 absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full animate-blob-delayed"
        style={{ background: 'radial-gradient(circle, rgba(45,90,142,0.3) 0%, transparent 65%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(248,250,252,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(248,250,252,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left — main content */}
          <div className="lg:col-span-7 space-y-8">
            {/* Eyebrow */}
            <div className="reveal-item inline-flex items-center gap-3 px-4 py-2 rounded-full border border-amber/30 bg-amber/10">
              <span className="w-2 h-2 rounded-full bg-amber animate-pulse-glow" />
              <span className="text-amber text-xs font-bold tracking-widest uppercase">
                Smart Factory Integration Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="reveal-item text-hero-xl font-black text-primary-foreground leading-none tracking-tight" data-delay="0.1">
              See your manufacturing costs in{' '}
              <span className="relative inline-block">
                <span className="text-amber">10 minutes</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 300 6" fill="none" aria-hidden="true">
                  <path d="M0 3 Q75 0 150 3 Q225 6 300 3" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </span>{' '}
              using your Annual Report.
            </h1>

            {/* Sub-headline */}
            <p className="reveal-item text-xl text-primary-foreground/70 leading-relaxed max-w-2xl font-body" data-delay="0.2">
              Connect shopfloor OEE data to boardroom metrics — in your own financial terms, on screen, in the first conversation. No equipment connection needed.
            </p>

            {/* CTAs */}
            <div className="reveal-item flex flex-wrap items-center gap-4" data-delay="0.3">
              <button
                onClick={scrollToCalculator}
                className="btn-primary magnetic-btn animate-pulse-glow"
                aria-label="Start calculating your financial impact"
              >
                Calculate My Financial Impact
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={openAuditModal}
                className="btn-outline magnetic-btn"
                aria-label="Book a Fast Floor Audit"
              >
                Book a Fast Floor Audit
              </button>
            </div>

            {/* Market stats */}
            <div className="reveal-item grid grid-cols-3 gap-4 pt-4" data-delay="0.4">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="text-2xl font-black text-amber font-display">{stat.value}</div>
                  <div className="text-xs text-primary-foreground/50 leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — proof metric cards */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="reveal-item glass-card rounded-4xl p-8 space-y-6 border border-white/10" data-delay="0.2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AppLogo size={36} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber bg-amber/10 px-3 py-1 rounded-full">
                  Live Preview
                </span>
              </div>
              <div className="bg-primary rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-primary-foreground/60 text-xs font-bold uppercase tracking-widest">OEE Score</span>
                  <span className="text-amber text-xs font-bold">Baseline → Target</span>
                </div>
                <div className="flex items-end gap-4">
                  <div className="space-y-1">
                    <div className="text-primary-foreground/40 text-xs">Current</div>
                    <div className="text-4xl font-black text-primary-foreground">58.4%</div>
                  </div>
                  <div className="text-amber text-2xl mb-1">→</div>
                  <div className="space-y-1">
                    <div className="text-amber/80 text-xs">Target</div>
                    <div className="text-4xl font-black text-amber">65.6%</div>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-amber rounded-full h-2 w-[65.6%] transition-all duration-1000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-input rounded-2xl p-4">
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Annual Saving</div>
                  <div className="text-2xl font-black text-primary">R682K</div>
                </div>
                <div className="bg-input rounded-2xl p-4">
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Payback</div>
                  <div className="text-2xl font-black text-primary">&lt;1 mo</div>
                </div>
              </div>
            </div>

            {proofMetrics.map((metric, i) => (
              <div
                key={metric.label}
                className={`absolute glass-card rounded-2xl px-4 py-3 border border-white/10 shadow-card animate-float${i % 2 === 1 ? '-delayed' : ''}`}
                style={{
                  top: i === 0 ? '-2rem' : i === 1 ? '45%' : 'auto',
                  bottom: i === 2 ? '-2rem' : 'auto',
                  left: i === 1 ? '-3rem' : 'auto',
                  right: i === 0 ? '-2rem' : i === 2 ? '-2rem' : 'auto',
                  zIndex: 10,
                }}
                aria-label={`${metric.label} improvement metric`}
              >
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{metric.label}</div>
                {'before' in metric ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-muted-foreground line-through">{metric.before}</span>
                    <span className="text-amber text-sm">→</span>
                    <span className="text-sm font-black text-primary">{metric.after}</span>
                  </div>
                ) : (
                  <div className="text-lg font-black text-amber mt-1">{metric.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40" aria-hidden="true">
        <span className="text-primary-foreground text-xs font-bold uppercase tracking-widest">Scroll to begin</span>
        <div className="w-px h-8 bg-primary-foreground/40" />
      </div>
    </section>
  );
}
