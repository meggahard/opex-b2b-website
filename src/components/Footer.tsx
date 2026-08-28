'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

const footerLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Calculator', href: '#calculator' },
  { label: 'Business Case', href: '#business-case' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
];

// Updated pricing tiers — Premium Pricing Architecture (ZAR) with asset-size differentiator
// USD equivalent: 1 ZAR ≈ 0.054 USD (rounded to clean figures)
const implementationTiers = [
  {
    name: 'Fast Floor Audit',
    lines: 'Any size facility',
    priceZAR: 'R12,500–R17,500',
    priceUSD: '$680–$950',
    weeks: 'Flat fee · credited back',
    accent: true,
  },
  {
    name: 'Foundry Starter',
    lines: '1–3 production lines',
    priceZAR: 'R85,000–R125,000',
    priceUSD: '$4,600–$6,750',
    weeks: '8–10 wks',
    accent: false,
  },
  {
    name: 'Floor Connect Pro',
    lines: '4–10 production lines',
    priceZAR: 'R195,000–R295,000',
    priceUSD: '$10,500–$16,000',
    weeks: '10–14 wks',
    accent: false,
  },
  {
    name: 'Enterprise Floor',
    lines: '11+ lines / work centres',
    priceZAR: 'R420,000–R650,000',
    priceUSD: '$22,700–$35,100',
    weeks: '14–20 wks',
    accent: false,
  },
];

const WHATSAPP_LINK = 'https://chat.whatsapp.com/EYeFXhxqXoHCTEai4xDlFs';

export default function Footer() {
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedback?.trim()) return;
    setSendingFeedback(true);
    try {
      const accessKey = (process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? '')?.trim();
      if (accessKey) {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: accessKey,
            subject: 'OpEx Strategy — Website Feedback',
            from_name: 'Website Visitor',
            message: feedback,
            botcheck: '',
          }),
        });
      }
      setFeedbackSent(true);
      setFeedback('');
      setTimeout(() => setFeedbackSent(false), 4000);
    } catch {
      setFeedbackSent(true);
      setFeedback('');
      setTimeout(() => setFeedbackSent(false), 4000);
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleWhatsAppFeedback = () => {
    window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="border-t border-border bg-background" role="contentinfo" aria-label="Site footer">
      {/* Implementation tiers strip */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Implementation Tiers
              </span>
              <span className="text-xs text-muted-foreground font-body">
                Priced by asset complexity — production lines / work centres
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              {implementationTiers?.map((tier) => (
                <div
                  key={tier?.name}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-card border ${
                    tier?.accent
                      ? 'bg-amber/10 border-amber/30' :'bg-card border-border'
                  }`}
                >
                  <div>
                    <div className={`text-xs font-black ${tier?.accent ? 'text-amber' : 'text-foreground'}`}>{tier?.name}</div>
                    <div className="text-xs text-muted-foreground">{tier?.lines}</div>
                  </div>
                  <div className="h-8 w-px bg-border" aria-hidden="true" />
                  <div>
                    <div className={`text-xs font-black ${tier?.accent ? 'text-amber' : 'text-amber'}`}>{tier?.priceZAR}</div>
                    <div className="text-xs text-muted-foreground">{tier?.priceUSD} · {tier?.weeks}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-body">
              * USD pricing applies when non-ZAR currency is selected. Tier complexity is determined by number of production lines or work centres — a direct measure of implementation scope.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback section */}
      <div className="border-b border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Share Feedback</div>
              <p className="text-xs text-muted-foreground font-body max-w-xs">
                We&apos;re still improving — your feedback helps us build a better tool.
              </p>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {feedbackSent ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm font-bold text-green-700">Thank you for your feedback!</span>
                </div>
              ) : (
                <>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e?.target?.value)}
                    placeholder="Share your thoughts, suggestions, or report an issue..."
                    rows={2}
                    className="input-field flex-1 resize-none text-sm"
                    aria-label="Feedback text"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <button
                      onClick={handleSendFeedback}
                      disabled={sendingFeedback || !feedback?.trim()}
                      className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Send feedback"
                    >
                      {sendingFeedback ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          Send
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleWhatsAppFeedback}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-2xl border border-green-500/40 text-green-600 hover:bg-green-50 transition-colors whitespace-nowrap"
                      aria-label="Send feedback via WhatsApp"
                      title="Join our WhatsApp group to share feedback"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </>
              )}
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
                { label: 'WhatsApp', href: WHATSAPP_LINK, icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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
