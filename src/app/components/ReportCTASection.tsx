'use client';
import React, { useState, useEffect } from 'react';
import type { LeadData } from './CalculatorSection';

interface Props {
  onLeadSubmit: (data: LeadData) => void;
  submitted: boolean;
}

const companySizes = ['20–75 employees', '75–250 employees', '250–500 employees'];
const industries = [
  'Food & Beverage',
  'Metal Fabrication',
  'Discrete Manufacturing',
  'Process Manufacturing',
  'Other',
];
const revenueRanges = ['<R5M', 'R5–20M', 'R20–100M', 'R100M+'];

const RECIPIENT_EMAIL = 'meggalogic@gmail.com';

function LeadForm({
  title,
  subtitle,
  onSubmit,
  onCancel,
  submitLabel = 'Generate My Report',
}: {
  title: string;
  subtitle: string;
  onSubmit: (data: LeadData) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<LeadData>({
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    email: '',
    phone: '',
    country: '',
    companySize: '',
    industry: '',
    revenueRange: '',
    challenge: '',
    wantsAudit: false,
    privacyConsent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [web3Error, setWeb3Error] = useState('');

  const update = (key: keyof LeadData, val: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LeadData, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Required';
    if (!form.lastName.trim()) newErrors.lastName = 'Required';
    if (!form.company.trim()) newErrors.company = 'Required';
    if (!form.jobTitle.trim()) newErrors.jobTitle = 'Required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Valid email required';
    if (!form.companySize) newErrors.companySize = 'Required';
    if (!form.industry) newErrors.industry = 'Required';
    if (!form.privacyConsent) newErrors.privacyConsent = 'Please accept to continue';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setWeb3Error('');

    try {
      const accessKey = (process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? '').trim();

      if (!accessKey) {
        setWeb3Error('Web3Forms access key is missing. Please set NEXT_PUBLIC_WEB3FORMS_KEY in your .env file.');
        setSubmitting(false);
        return;
      }

      const payload = {
        access_key: accessKey,
        subject: `${submitLabel} — ${form.company} (${form.firstName} ${form.lastName})`,
        from_name: `${form.firstName} ${form.lastName}`,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        company: form.company,
        job_title: form.jobTitle,
        phone: form.phone || 'Not provided',
        country: form.country || 'Not specified',
        company_size: form.companySize,
        industry: form.industry,
        revenue_range: form.revenueRange || 'Not specified',
        challenge: form.challenge || 'Not specified',
        wants_audit: form.wantsAudit ? 'Yes' : 'No',
        form_type: submitLabel,
        botcheck: '',
      };

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        onSubmit(form);
      } else {
        setWeb3Error(result.message || 'Submission failed. Please try again.');
      }
    } catch {
      setWeb3Error('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-4xl p-8 md:p-10 shadow-card">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1 font-body text-sm">{subtitle}</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors flex-shrink-0 ml-4"
            aria-label="Close form"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-6" aria-label="Lead capture form">
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { key: 'firstName' as const, label: 'First Name', type: 'text', required: true },
            { key: 'lastName' as const, label: 'Last Name', type: 'text', required: true },
            { key: 'company' as const, label: 'Company Name', type: 'text', required: true },
            { key: 'jobTitle' as const, label: 'Job Title / Role', type: 'text', required: true },
            { key: 'email' as const, label: 'Email Address', type: 'email', required: true },
            { key: 'phone' as const, label: 'Phone Number', type: 'tel', required: false },
            { key: 'country' as const, label: 'Country', type: 'text', required: false },
          ].map((field) => (
            <div key={field.key}>
              <label className="input-label" htmlFor={`field-${field.key}-${submitLabel}`}>
                {field.label}{field.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
              </label>
              <input
                id={`field-${field.key}-${submitLabel}`}
                type={field.type}
                value={form[field.key] as string}
                onChange={(e) => update(field.key, e.target.value)}
                className={`input-field ${errors[field.key] ? 'border-red-400' : ''}`}
                aria-required={field.required}
              />
              {errors[field.key] && (
                <p className="text-red-500 text-xs mt-1" role="alert">{errors[field.key]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="input-label" htmlFor={`field-companySize-${submitLabel}`}>
              Company Size <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id={`field-companySize-${submitLabel}`}
              value={form.companySize}
              onChange={(e) => update('companySize', e.target.value)}
              className={`input-field ${errors.companySize ? 'border-red-400' : ''}`}
            >
              <option value="">Select size</option>
              {companySizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.companySize && <p className="text-red-500 text-xs mt-1" role="alert">{errors.companySize}</p>}
          </div>
          <div>
            <label className="input-label" htmlFor={`field-industry-${submitLabel}`}>
              Industry <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id={`field-industry-${submitLabel}`}
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
              className={`input-field ${errors.industry ? 'border-red-400' : ''}`}
            >
              <option value="">Select industry</option>
              {industries.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            {errors.industry && <p className="text-red-500 text-xs mt-1" role="alert">{errors.industry}</p>}
          </div>
          <div>
            <label className="input-label" htmlFor={`field-revenueRange-${submitLabel}`}>Annual Revenue Range</label>
            <select
              id={`field-revenueRange-${submitLabel}`}
              value={form.revenueRange}
              onChange={(e) => update('revenueRange', e.target.value)}
              className="input-field"
            >
              <option value="">Select range</option>
              {revenueRanges.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor={`field-challenge-${submitLabel}`}>What is your biggest operational challenge? (optional)</label>
          <textarea
            id={`field-challenge-${submitLabel}`}
            value={form.challenge}
            onChange={(e) => update('challenge', e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="e.g. High scrap rates, unplanned downtime, poor OTD..."
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.wantsAudit}
              onChange={(e) => update('wantsAudit', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-primary"
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              I&apos;m interested in a Fast Floor Audit to validate these numbers on-site.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.privacyConsent}
              onChange={(e) => update('privacyConsent', e.target.checked)}
              className={`mt-0.5 w-4 h-4 rounded border-border text-primary ${errors.privacyConsent ? 'border-red-400' : ''}`}
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              I agree to be contacted by OpEx Strategy regarding this analysis. <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.privacyConsent && <p className="text-red-500 text-xs" role="alert">{errors.privacyConsent}</p>}
        </div>

        {web3Error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-red-600 text-sm">{web3Error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 justify-center"
            aria-label={submitLabel}
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                {submitLabel}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-outline px-6">
              Cancel
            </button>
          )}
        </div>
        <p className="text-muted-foreground/50 text-xs font-body text-center">
          No credit card required. All calculations run in your browser. Your details are sent securely to OpEx Strategy.
        </p>
      </form>
    </div>
  );
}

export default function ReportCTASection({ onLeadSubmit, submitted }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditSubmitted, setAuditSubmitted] = useState(false);

  // Listen for audit modal open event from Header/Hero CTA
  React.useEffect(() => {
    const handler = () => setShowAuditModal(true);
    window.addEventListener('openAuditModal', handler);
    return () => window.removeEventListener('openAuditModal', handler);
  }, []);

  const handleAuditSubmit = (data: LeadData) => {
    setAuditSubmitted(true);
    setTimeout(() => {
      setShowAuditModal(false);
      setAuditSubmitted(false);
    }, 3000);
  };

  if (submitted) {
    return (
      <section id="report-cta" className="section-pad bg-background" aria-label="Report generation confirmation">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-card border border-green-200 rounded-4xl p-12 shadow-card">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-foreground mb-3">Your Report Is Ready</h2>
            <p className="text-muted-foreground font-body mb-6">
              Scroll down to view your full Financial Impact Report. Use the <strong>Download My Report</strong> button to save it as PDF.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById('full-report');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary"
              aria-label="View full financial impact report"
            >
              View Full Report
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Floor Audit Modal */}
      {showAuditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(11,25,41,0.85)', backdropFilter: 'blur(8px)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Book a Fast Floor Audit"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {auditSubmitted ? (
              <div className="bg-card rounded-4xl p-12 text-center shadow-card">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-foreground mb-3">Audit Request Received!</h2>
                <p className="text-muted-foreground font-body">
                  Thank you! Our team will contact you within 24 hours to schedule your Fast Floor Audit.
                </p>
              </div>
            ) : (
              <LeadForm
                title="Book a Fast Floor Audit"
                subtitle="2 days on-site · 48hr proposal · Fixed-fee implementation quote. Fully credited toward your implementation."
                onSubmit={handleAuditSubmit}
                onCancel={() => setShowAuditModal(false)}
                submitLabel="Book My Audit"
              />
            )}
          </div>
        </div>
      )}

      <section id="report-cta" className="section-pad" style={{ background: 'linear-gradient(135deg, #0B1929 0%, #1E3A5F 100%)' }} aria-labelledby="report-cta-heading">
        <div className="max-w-4xl mx-auto px-6">
          {!showForm ? (
            <div className="text-center space-y-8">
              <div className="reveal-item">
                <span className="text-xs font-bold uppercase tracking-widest text-amber/70 mb-3 block">
                  Final Step
                </span>
                <h2 id="report-cta-heading" className="text-section-xl font-black text-primary-foreground">
                  Generate My Financial<br />Impact Report
                </h2>
                <p className="text-primary-foreground/60 mt-4 text-lg font-body max-w-xl mx-auto">
                  Your personalised Before/After cost analysis — downloadable, shareable, boardroom-ready.
                </p>
              </div>

              <div className="reveal-item grid md:grid-cols-3 gap-4" data-delay="0.1">
                {[
                  { icon: '📊', title: 'DuPont Tree', desc: 'Visual ROE decomposition' },
                  { icon: '💰', title: 'Savings Breakdown', desc: 'Category-by-category analysis' },
                  { icon: '📈', title: 'Payback Chart', desc: '12-month ROI projection' },
                ].map((item) => (
                  <div key={item.title} className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-3xl p-5 text-left">
                    <div className="text-2xl mb-3" aria-hidden="true">{item.icon}</div>
                    <div className="text-sm font-black text-primary-foreground mb-1">{item.title}</div>
                    <div className="text-xs text-primary-foreground/50">{item.desc}</div>
                  </div>
                ))}
              </div>

              <div className="reveal-item flex flex-col sm:flex-row items-center justify-center gap-4" data-delay="0.2">
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary animate-pulse-glow text-base px-10 py-5"
                  aria-label="Open report generation form"
                >
                  Generate My Report
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="btn-outline text-base px-8 py-5 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  aria-label="Book a Fast Floor Audit"
                >
                  Book a Fast Floor Audit
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>
              </div>
              <p className="text-primary-foreground/30 text-xs font-body">
                No credit card required. All calculations run in your browser.
              </p>
            </div>
          ) : (
            <LeadForm
              title="Your Details"
              subtitle="We use this to personalise your report and follow up with implementation options."
              onSubmit={onLeadSubmit}
              onCancel={() => setShowForm(false)}
              submitLabel="Generate My Report"
            />
          )}
        </div>
      </section>
    </>
  );
}
