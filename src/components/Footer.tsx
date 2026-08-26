'use client';

import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

const footerLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Calculator', href: '#calculator' },
  { label: 'Business Case', href: '#business-case' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
];

const implementationTiers = [
  { name: 'Foundry Starter', size: '20–75 employees', price: 'R28K–R45K', weeks: '8–10 wks' },
  { name: 'Floor Connect Pro', size: '75–250 employees', price: 'R55K–R95K', weeks: '10–14 wks' },
  { name: 'Enterprise Floor', size: '250–500 employees', price: 'R95K–R180K', weeks: '14–20 wks' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background" role="contentinfo" aria-label="Site footer">
      {/* Implementation tiers strip */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Implementation Tiers
              </span>
            </div>
            <div className="flex flex-wrap gap-4 flex-1">
              {implementationTiers?.map((tier) => (
                <div key={tier?.name} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-card">
                  <div>
                    <div className="text-xs font-black text-foreground">{tier?.name}</div>
                    <div className="text-xs text-muted-foreground">{tier?.size}</div>
                  </div>
                  <div className="h-8 w-px bg-border" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-black text-amber">{tier?.price}</div>
                    <div className="text-xs text-muted-foreground">{tier?.weeks}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 bg-amber/10 border border-amber/20 rounded-2xl px-4 py-2.5 text-center">
              <div className="text-xs font-black text-amber">Fast Floor Audit</div>
              <div className="text-xs text-foreground/70">R3,500–R5,000</div>
              <div className="text-xs text-muted-foreground">Credited to implementation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Left — Logo + tagline + address */}
          <div className="flex flex-col gap-3 max-w-sm">
            <div className="flex items-center gap-2.5">
              <AppLogo size={32} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-body">
              Smart Factory Integration Platform — ERPNext + openMES. Floor-to-finance visibility for SME manufacturers. Open source. No vendor lock-in. 8–14 week deployment.
            </p>
            <address className="not-italic text-xs text-muted-foreground leading-relaxed font-body">
              1st Floor, Block B, Black River Park<br />
              2 Fir Street, Observatory<br />
              Cape Town, 7925<br />
              South Africa
            </address>
          </div>

          {/* Right — links + social */}
          <div className="flex flex-col items-start md:items-end gap-4">
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer navigation">
              {footerLinks?.map((link) => (
                link?.href?.startsWith('#') ? (
                  <button
                    key={link?.label}
                    onClick={() => {
                      const el = document.querySelector(link?.href);
                      if (el) el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                    aria-label={`Navigate to ${link?.label}`}
                  >
                    {link?.label}
                  </button>
                ) : (
                  <Link
                    key={link?.label}
                    href={link?.href}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
                  >
                    {link?.label}
                  </Link>
                )
              ))}
            </nav>
            <div className="flex items-center gap-4">
              {[
                { label: 'LinkedIn', href: '#', icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                )},
                { label: 'Twitter', href: '#', icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                )},
              ]?.map((social) => (
                <a
                  key={social?.label}
                  href={social?.href}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  aria-label={`OpEx Strategy on ${social?.label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social?.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm font-semibold text-muted-foreground">
            © 2026 OpEx Strategy. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground font-body text-center sm:text-right">
            30–60% lower TCO than SAP/Oracle/Plex over 3 years · No annual license cost · ISA-95 compliant
          </p>
        </div>
      </div>
    </footer>
  );
}
