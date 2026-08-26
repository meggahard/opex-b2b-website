'use client';
import React, { useState, useEffect } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import Link from 'next/link';

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Calculator', href: '#calculator' },
  { label: 'Business Case', href: '#business-case' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openAuditModal = () => {
    setMenuOpen(false);
    // Dispatch custom event to open audit modal in ReportCTASection
    const event = new CustomEvent('openAuditModal');
    window.dispatchEvent(event);
    // Scroll to CTA section
    setTimeout(() => {
      const el = document.getElementById('report-cta');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-5'}`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`flex items-center justify-between rounded-full px-6 py-3 transition-all duration-500 ${
              scrolled ? 'glass-nav shadow-card' : 'bg-transparent'
            }`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="OpEx Strategy — Home">
              <AppLogo
                size={34}
                className="group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className={`text-xs font-black uppercase tracking-widest transition-colors ${
                    scrolled
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-primary-foreground/60 hover:text-primary-foreground'
                  }`}
                  aria-label={`Navigate to ${link.label} section`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <button
                onClick={openAuditModal}
                className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                  scrolled
                    ? 'border-border text-foreground hover:bg-muted'
                    : 'border-primary-foreground/30 text-primary-foreground/80 hover:bg-primary-foreground/10'
                }`}
                aria-label="Book a Fast Floor Audit"
              >
                Book Audit
              </button>
              <button
                onClick={() => handleNavClick('#calculator')}
                className="hidden sm:inline-flex btn-primary py-2.5 px-5 text-xs"
                aria-label="Start calculating your financial impact"
              >
                Calculate Impact
              </button>
              {/* Mobile hamburger */}
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-40 flex flex-col"
          style={{ background: 'rgba(11,25,41,0.97)', backdropFilter: 'blur(20px)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-2xl font-black uppercase tracking-widest text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label={`Navigate to ${link.label} section`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={openAuditModal}
              className="text-xl font-black uppercase tracking-widest text-amber/80 hover:text-amber transition-colors"
            >
              Book Audit
            </button>
            <button
              onClick={() => handleNavClick('#calculator')}
              className="btn-primary mt-4 text-base px-10 py-4"
              aria-label="Start calculating your financial impact"
            >
              Calculate Impact
            </button>
          </div>
        </div>
      )}
    </>
  );
}
