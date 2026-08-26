'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import DigitalTwinView from './DigitalTwinView';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardProfile {
  // Step 1 – Company Identity
  companyName: string;
  companyCode: string;
  country: string;
  currency: string;
  timezone: string;
  siteName: string;
  // Step 2 – Value Stream
  valueStreamName: string;
  productName: string;
  productCode: string;
  rawMaterialName: string;
  rawMaterialCode: string;
  rawMaterialCost: number;
  finishedGoodCost: number;
  batchSize: number;
  // Step 3 – Work Cells & Process
  workCells: WorkCellInput[];
  // Step 4 – Operations Profile
  laborRatePerHour: number;
  shiftHoursPerDay: number;
  daysPerWeek: number;
  targetOEE: number;
}

export interface WorkCellInput {
  id: string;
  name: string;
  cycleTimeMinutes: number;
  operationType: 'production' | 'quality' | 'maintenance';
}

// ─── Contract Generator ───────────────────────────────────────────────────────

function generateContract(p: WizardProfile) {
  const ts = new Date().toISOString();
  const slug = p.companyCode.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const contractId = `${slug}-single-value-stream-v2`;

  const workCellDefs = p.workCells.map((wc, i) => ({
    identity: {
      canonical_id: `work_cell:${slug}-ws-0${i + 1}`,
      source_system: 'smartfactory',
      source_key: `${p.companyCode}-WS-0${i + 1}`,
      external_ids: { erpnext: `${p.companyCode}-WS-0${i + 1}`, openmes: null },
    },
    line_code: `${p.companyCode}-LINE-01`,
    code: `${p.companyCode}-WS-0${i + 1}`,
    name: wc.name,
    equipment_class: `${p.companyCode}-WS`,
    erpnext_workstation: `${p.companyCode}-WS-0${i + 1}`,
    openmes_workstation_code: `${p.companyCode}-WS-0${i + 1}`,
    capabilities: [wc.operationType],
  }));

  const processSegments = p.workCells.map((wc, i) => ({
    identity: {
      canonical_id: `segment:${wc.name.toLowerCase().replace(/\s+/g, '-')}`,
      source_system: 'smartfactory',
      source_key: wc.name.toUpperCase().replace(/\s+/g, '-'),
      external_ids: { erpnext: wc.name, openmes: null },
    },
    sequence: i + 1,
    code: wc.name.toUpperCase().replace(/\s+/g, '-'),
    name: wc.name,
    operation_type: wc.operationType,
    standard_duration_minutes: wc.cycleTimeMinutes,
    work_cell_code: `${p.companyCode}-WS-0${i + 1}`,
    erpnext_operation: wc.name,
    openmes_step_name: wc.name,
  }));

  const contract = {
    contract_version: 'smartfactory.manufacturing.v2',
    contract_id: contractId,
    generated_at: ts,
    identity: {
      canonical_id: `contract:${slug}:single-stream-v2`,
      source_system: 'smartfactory',
      source_key: `${p.companyCode}-SINGLE-STREAM-V2`,
    },
    enterprise: {
      identity: { canonical_id: `enterprise:${slug}`, source_system: 'smartfactory', source_key: p.companyCode },
      code: p.companyCode,
      name: p.companyName,
    },
    company: {
      identity: {
        canonical_id: `company:${slug}`,
        source_system: 'smartfactory',
        source_key: p.companyCode,
        external_ids: { erpnext: p.companyName, openmes: null },
      },
      code: p.companyCode,
      name: p.companyName,
      country: p.country,
      currency: p.currency,
      timezone: p.timezone,
    },
    sites: [
      {
        identity: {
          canonical_id: `site:${slug}-plant`,
          source_system: 'smartfactory',
          source_key: `${p.companyCode}-PLANT`,
          external_ids: { erpnext: null, openmes: null },
        },
        code: `${p.companyCode}-PLANT`,
        name: p.siteName,
        company_code: p.companyCode,
        country: p.country,
        timezone: p.timezone,
      },
    ],
    areas: [
      {
        identity: {
          canonical_id: `area:${slug}-production`,
          source_system: 'smartfactory',
          source_key: `${p.companyCode}-PRODUCTION`,
          external_ids: { erpnext: null, openmes: null },
        },
        site_code: `${p.companyCode}-PLANT`,
        code: `${p.companyCode}-PRODUCTION`,
        name: `${p.valueStreamName} Area`,
      },
    ],
    lines: [
      {
        identity: {
          canonical_id: `line:${slug}-line-01`,
          source_system: 'smartfactory',
          source_key: `${p.companyCode}-LINE-01`,
          external_ids: { erpnext: null, openmes: null },
        },
        area_code: `${p.companyCode}-PRODUCTION`,
        code: `${p.companyCode}-LINE-01`,
        name: `${p.valueStreamName} Line 01`,
        is_active: true,
      },
    ],
    work_cells: workCellDefs,
    items: [
      {
        identity: {
          canonical_id: `item:${slug}-rm-001`,
          source_system: 'smartfactory',
          source_key: `${p.companyCode}-RM-001`,
          external_ids: { erpnext: `${p.companyCode}-RM-001`, openmes: null },
        },
        code: `${p.companyCode}-RM-001`,
        name: p.rawMaterialName,
        uom: 'Kg',
        material_type: 'raw_material',
        cost: { amount: p.rawMaterialCost, currency: p.currency, source: 'standard' },
        tracking_type: 'lot',
      },
      {
        identity: {
          canonical_id: `item:${slug}-fg-001`,
          source_system: 'smartfactory',
          source_key: `${p.companyCode}-FG-001`,
          external_ids: { erpnext: `${p.companyCode}-FG-001`, openmes: null },
        },
        code: `${p.companyCode}-FG-001`,
        name: p.productName,
        uom: 'Nos',
        material_type: 'finished_good',
        cost: { amount: p.finishedGoodCost, currency: p.currency, source: 'standard' },
        tracking_type: 'lot',
      },
    ],
    boms: [
      {
        identity: {
          canonical_id: `bom:${slug}-fg-001:001`,
          source_system: 'smartfactory',
          source_key: `${p.companyCode}-FG-001-001`,
          external_ids: { erpnext: null, openmes: null },
        },
        parent_item_code: `${p.companyCode}-FG-001`,
        revision: '001',
        components: [
          {
            component_item_code: `${p.companyCode}-RM-001`,
            quantity: { value: p.batchSize, uom: 'Kg' },
            scrap_percentage: 2,
            process_segment_id: processSegments[0]?.identity.canonical_id ?? 'segment:production',
          },
        ],
      },
    ],
    process_segments: processSegments,
    work_centres: p.workCells.map((wc, i) => ({
      identity: {
        canonical_id: `work_centre:${slug}-ws-0${i + 1}`,
        source_system: 'smartfactory',
        source_key: `${p.companyCode}-WS-0${i + 1}`,
        external_ids: { erpnext: `${p.companyCode}-WS-0${i + 1}`, openmes: `${i + 1}` },
      },
      work_cell_code: `${p.companyCode}-WS-0${i + 1}`,
      code: `${p.companyCode}-WS-0${i + 1}`,
      name: wc.name,
      capacity: Math.round(60 / wc.cycleTimeMinutes),
      capacity_uom: 'units_per_hour',
      connectivity: 'simulated',
      connection_code: `${p.companyCode}-SIM-MQTT-0${i + 1}`,
    })),
    personnel_classes: [
      {
        personnel_class_id: 'personnel-class:operator',
        name: 'Production Operator',
        hourly_rate: p.laborRatePerHour,
        currency: p.currency,
        erpnext_employee_id: null,
      },
    ],
    cost_rules: [
      {
        cost_rule_id: `cost-rule:${slug}-production`,
        currency: p.currency,
        labor_rate_source: 'personnel-class:operator',
        equipment_rate_per_hour: 0,
        erpnext_activity_type: 'Production',
        openmes_cost_center_code: `${p.companyCode}-PROD`,
      },
    ],
    quality_profiles: [
      {
        identity: {
          canonical_id: `quality_profile:${slug}-final-inspection`,
          source_system: 'smartfactory',
          source_key: `${p.companyCode}-NC-001`,
          external_ids: { erpnext: null, openmes: null },
        },
        code: `${p.companyCode}-NC-001`,
        name: `${p.productName} Final Inspection`,
        scope: 'final',
        checks: [{ code: 'VISUAL-PASS', name: 'Visual pass', type: 'pass_fail' }],
      },
    ],
    tracking_profiles: [
      {
        item_code: `${p.companyCode}-RM-001`,
        tracking_type: 'lot',
        traceability_required: true,
        lot_fields: ['lot_number', 'supplier_lot_no', 'received_at'],
        serial_fields: [],
      },
      {
        item_code: `${p.companyCode}-FG-001`,
        tracking_type: 'lot',
        traceability_required: true,
        lot_fields: ['lot_number', 'work_order_id', 'produced_at'],
        serial_fields: [],
      },
    ],
    warehouse_policy: {
      mode: 'existing_only',
      creation_permitted: false,
      allowed_erpnext_warehouses: [
        `Stores - ${p.companyCode}`,
        `Work In Progress - ${p.companyCode}`,
        `Finished Goods - ${p.companyCode}`,
      ],
    },
    mappings: [
      {
        mapping_id: `map:company:${slug}`,
        entity_type: 'company',
        canonical_id: `company:${slug}`,
        erpnext: { doctype: 'Company', name: p.companyName },
        openmes: { resource: 'companies', id: null, code: p.companyCode },
        status: 'unprovisioned',
      },
      {
        mapping_id: `map:item:${slug}-fg-001`,
        entity_type: 'item',
        canonical_id: `item:${slug}-fg-001`,
        erpnext: { doctype: 'Item', name: `${p.companyCode}-FG-001` },
        openmes: { resource: 'product-types', id: null, code: `${p.companyCode}-FG-001` },
        status: 'unprovisioned',
      },
    ],
  };

  return contract;
}

// ─── Step Definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Company Identity', icon: '🏭' },
  { id: 2, label: 'Value Stream', icon: '🔄' },
  { id: 3, label: 'Work Cells', icon: '⚙️' },
  { id: 4, label: 'Operations Profile', icon: '📊' },
];

const defaultProfile: WizardProfile = {
  companyName: '',
  companyCode: '',
  country: 'ZA',
  currency: 'ZAR',
  timezone: 'Africa/Johannesburg',
  siteName: '',
  valueStreamName: '',
  productName: '',
  productCode: '',
  rawMaterialName: '',
  rawMaterialCode: '',
  rawMaterialCost: 120,
  finishedGoodCost: 480,
  batchSize: 10,
  workCells: [
    { id: 'wc-1', name: 'Material Preparation', cycleTimeMinutes: 5, operationType: 'production' },
    { id: 'wc-2', name: 'Assembly', cycleTimeMinutes: 15, operationType: 'production' },
    { id: 'wc-3', name: 'Final Inspection', cycleTimeMinutes: 5, operationType: 'quality' },
  ],
  laborRatePerHour: 150,
  shiftHoursPerDay: 8,
  daysPerWeek: 5,
  targetOEE: 75,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DigitalTwinWizard() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<WizardProfile>(defaultProfile);
  const [launched, setLaunched] = useState(false);
  const [contract, setContract] = useState<ReturnType<typeof generateContract> | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const update = useCallback(<K extends keyof WizardProfile>(key: K, value: WizardProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const autoCode = (name: string) =>
    name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join('')
      .substring(0, 6);

  const handleLaunch = () => {
    const generated = generateContract(profile);
    setContract(generated);
    setLaunched(true);
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDownload = () => {
    if (!contract) return;
    const blob = new Blob([JSON.stringify(contract, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.contract_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setLaunched(false);
    setContract(null);
    setStep(1);
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const canProceed = () => {
    if (step === 1) return profile.companyName.trim().length > 1 && profile.siteName.trim().length > 1;
    if (step === 2) return profile.valueStreamName.trim().length > 1 && profile.productName.trim().length > 1 && profile.rawMaterialName.trim().length > 1;
    if (step === 3) return profile.workCells.length > 0 && profile.workCells.every((wc) => wc.name.trim().length > 0);
    return true;
  };

  return (
    <section
      id="digital-twin"
      ref={sectionRef}
      className="relative py-24 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 50%, #F8FAFC 100%)' }}
      aria-label="From Company Profile to Digital Twin"
    >
      {/* ── COMING SOON FREEZE OVERLAY ── */}
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-center"
        style={{ background: 'rgba(11,25,41,0.82)', backdropFilter: 'blur(6px)' }}
        aria-label="Digital Twin — Coming Soon"
      >
        <div className="text-center px-6 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-amber/20 border border-amber/40 rounded-full px-5 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
            <span className="text-amber text-xs font-black uppercase tracking-widest">Coming Soon</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Digital Twin Wizard</h2>
          <p className="text-white/60 font-body text-base leading-relaxed mb-6">
            Transform your company profile into a live Digital Twin with real-time traceability, stock &amp; cost ledger updates, and OEE simulation. Launching after our Financial Impact Report goes live.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-center">
              <div className="text-xs text-white/40 font-bold uppercase tracking-widest mb-0.5">Phase 1</div>
              <div className="text-sm font-black text-white">Financial Impact Report</div>
              <div className="text-xs text-amber font-bold mt-0.5">✓ Live Now</div>
            </div>
            <div className="bg-amber/10 border border-amber/30 rounded-2xl px-4 py-2.5 text-center">
              <div className="text-xs text-amber/60 font-bold uppercase tracking-widest mb-0.5">Phase 2</div>
              <div className="text-sm font-black text-white">Digital Twin</div>
              <div className="text-xs text-amber/70 font-bold mt-0.5">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(30,58,95,0.12) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber/30 bg-amber/8 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
            <span className="text-amber text-xs font-black uppercase tracking-widest">Digital Twin Preview</span>
          </div>
          <h2 className="text-section-xl font-black text-primary leading-tight">
            Describe your factory.<br />
            <span className="text-amber">See it live in minutes.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body leading-relaxed">
            Enter your company profile below. We&apos;ll instantly build your Digital Twin — a live simulation of your production flow, traceability, and cost ledger — no equipment connection needed.
          </p>
        </div>

        {!launched ? (
          <WizardForm
            step={step}
            profile={profile}
            update={update}
            autoCode={autoCode}
            canProceed={canProceed}
            onNext={() => setStep((s) => Math.min(s + 1, 4))}
            onBack={() => setStep((s) => Math.max(s - 1, 1))}
            onLaunch={handleLaunch}
          />
        ) : (
          <DigitalTwinView
            profile={profile}
            contract={contract}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </div>
    </section>
  );
}

// ─── Wizard Form ──────────────────────────────────────────────────────────────

interface WizardFormProps {
  step: number;
  profile: WizardProfile;
  update: <K extends keyof WizardProfile>(key: K, value: WizardProfile[K]) => void;
  autoCode: (name: string) => string;
  canProceed: () => boolean;
  onNext: () => void;
  onBack: () => void;
  onLaunch: () => void;
}

function WizardForm({ step, profile, update, autoCode, canProceed, onNext, onBack, onLaunch }: WizardFormProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Step progress */}
      <div className="flex items-center justify-between mb-10 relative">
        <div
          className="absolute top-5 left-0 right-0 h-px"
          style={{ background: 'var(--border)', zIndex: 0 }}
          aria-hidden="true"
        />
        {STEPS.map((s) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
                step === s.id
                  ? 'bg-amber text-primary shadow-amber scale-110'
                  : step > s.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white border-2 border-border text-muted-foreground'
              }`}
            >
              {step > s.id ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span>{s.icon}</span>
              )}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wide hidden sm:block ${step === s.id ? 'text-primary' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step card */}
      <div
        className="bg-white rounded-3xl shadow-card border border-border p-8 space-y-6"
        style={{ boxShadow: '0 8px 40px rgba(11,25,41,0.08)' }}
      >
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Step {step} of {STEPS.length}
          </div>
          <h3 className="text-2xl font-black text-primary">{STEPS[step - 1].label}</h3>
        </div>

        {step === 1 && <Step1 profile={profile} update={update} autoCode={autoCode} />}
        {step === 2 && <Step2 profile={profile} update={update} />}
        {step === 3 && <Step3 profile={profile} update={update} />}
        {step === 4 && <Step4 profile={profile} update={update} />}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            onClick={onBack}
            disabled={step === 1}
            className="btn-dark py-2.5 px-6 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Go to previous step"
          >
            ← Back
          </button>
          {step < 4 ? (
            <button
              onClick={onNext}
              disabled={!canProceed()}
              className="btn-primary py-2.5 px-8 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Go to next step"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onLaunch}
              className="btn-primary py-3 px-10 text-sm animate-pulse-glow"
              aria-label="Launch your Digital Twin"
            >
              🚀 Launch My Digital Twin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Company Identity ─────────────────────────────────────────────────

function Step1({ profile, update, autoCode }: { profile: WizardProfile; update: WizardFormProps['update']; autoCode: (n: string) => string }) {
  const countries = ['ZA', 'US', 'GB', 'DE', 'AU', 'IN', 'NG', 'KE', 'BR', 'CA'];
  const currencies = ['ZAR', 'USD', 'GBP', 'EUR', 'AUD', 'INR', 'NGN', 'KES', 'BRL', 'CAD'];
  const timezones = [
    'Africa/Johannesburg', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Australia/Sydney',
  ];

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm font-body">
        Tell us who you are. This becomes the foundation of your ISA-95 master data contract.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="input-label">Company Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Acme Manufacturing"
            value={profile.companyName}
            onChange={(e) => {
              update('companyName', e.target.value);
              if (!profile.companyCode || profile.companyCode === autoCode(profile.companyName)) {
                update('companyCode', autoCode(e.target.value));
              }
            }}
            aria-label="Company name"
          />
        </div>
        <div>
          <label className="input-label">Company Code</label>
          <input
            className="input-field"
            placeholder="ACME"
            value={profile.companyCode}
            onChange={(e) => update('companyCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8))}
            aria-label="Company code"
          />
        </div>
        <div>
          <label className="input-label">Site / Plant Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Main Plant"
            value={profile.siteName}
            onChange={(e) => update('siteName', e.target.value)}
            aria-label="Site name"
          />
        </div>
        <div>
          <label className="input-label">Country</label>
          <select className="input-field" value={profile.country} onChange={(e) => update('country', e.target.value)} aria-label="Country">
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Currency</label>
          <select className="input-field" value={profile.currency} onChange={(e) => update('currency', e.target.value)} aria-label="Currency">
            {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="input-label">Timezone</label>
          <select className="input-field" value={profile.timezone} onChange={(e) => update('timezone', e.target.value)} aria-label="Timezone">
            {timezones.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Value Stream ─────────────────────────────────────────────────────

function Step2({ profile, update }: { profile: WizardProfile; update: WizardFormProps['update'] }) {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm font-body">
        Define your primary value stream — the product you make and the materials you use.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="input-label">Value Stream / Production Line Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Blending & Packaging Line"
            value={profile.valueStreamName}
            onChange={(e) => update('valueStreamName', e.target.value)}
            aria-label="Value stream name"
          />
        </div>
        <div>
          <label className="input-label">Finished Product Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Premium Blend 500g"
            value={profile.productName}
            onChange={(e) => update('productName', e.target.value)}
            aria-label="Product name"
          />
        </div>
        <div>
          <label className="input-label">Finished Good Unit Cost ({profile.currency})</label>
          <input
            type="number"
            className="input-field"
            value={profile.finishedGoodCost}
            min={1}
            onChange={(e) => update('finishedGoodCost', Number(e.target.value))}
            aria-label="Finished good unit cost"
          />
        </div>
        <div>
          <label className="input-label">Raw Material Name *</label>
          <input
            className="input-field"
            placeholder="e.g. Bulk Blend Powder"
            value={profile.rawMaterialName}
            onChange={(e) => update('rawMaterialName', e.target.value)}
            aria-label="Raw material name"
          />
        </div>
        <div>
          <label className="input-label">Raw Material Cost / Kg ({profile.currency})</label>
          <input
            type="number"
            className="input-field"
            value={profile.rawMaterialCost}
            min={1}
            onChange={(e) => update('rawMaterialCost', Number(e.target.value))}
            aria-label="Raw material cost per kg"
          />
        </div>
        <div className="col-span-2">
          <label className="input-label">Standard Batch Size (units per run)</label>
          <input
            type="number"
            className="input-field"
            value={profile.batchSize}
            min={1}
            onChange={(e) => update('batchSize', Number(e.target.value))}
            aria-label="Batch size"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Work Cells ───────────────────────────────────────────────────────

function Step3({ profile, update }: { profile: WizardProfile; update: WizardFormProps['update'] }) {
  const addCell = () => {
    const newCells: WorkCellInput[] = [
      ...profile.workCells,
      { id: `wc-${Date.now()}`, name: '', cycleTimeMinutes: 10, operationType: 'production' },
    ];
    update('workCells', newCells);
  };

  const removeCell = (id: string) => {
    update('workCells', profile.workCells.filter((wc) => wc.id !== id));
  };

  const updateCell = (id: string, field: keyof WorkCellInput, value: string | number) => {
    update(
      'workCells',
      profile.workCells.map((wc) => (wc.id === id ? { ...wc, [field]: value } : wc))
    );
  };

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm font-body">
        Define the work cells in your production line. Each cell becomes an ISA-95 Work Centre with its own cycle time and OEE baseline.
      </p>
      <div className="space-y-3">
        {profile.workCells.map((wc, i) => (
          <div
            key={wc.id}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-input"
          >
            <div className="w-7 h-7 rounded-full bg-amber/20 text-amber flex items-center justify-center text-xs font-black flex-shrink-0">
              {i + 1}
            </div>
            <input
              className="input-field flex-1 py-2 text-sm"
              placeholder="Work cell name"
              value={wc.name}
              onChange={(e) => updateCell(wc.id, 'name', e.target.value)}
              aria-label={`Work cell ${i + 1} name`}
            />
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                type="number"
                className="input-field w-16 py-2 text-sm text-center"
                value={wc.cycleTimeMinutes}
                min={1}
                onChange={(e) => updateCell(wc.id, 'cycleTimeMinutes', Number(e.target.value))}
                aria-label={`Cycle time for work cell ${i + 1}`}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">min</span>
            </div>
            <select
              className="input-field w-28 py-2 text-xs flex-shrink-0"
              value={wc.operationType}
              onChange={(e) => updateCell(wc.id, 'operationType', e.target.value as WorkCellInput['operationType'])}
              aria-label={`Operation type for work cell ${i + 1}`}
            >
              <option value="production">Production</option>
              <option value="quality">Quality</option>
              <option value="maintenance">Maintenance</option>
            </select>
            {profile.workCells.length > 1 && (
              <button
                onClick={() => removeCell(wc.id)}
                className="w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs flex-shrink-0 transition-colors"
                aria-label={`Remove work cell ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {profile.workCells.length < 6 && (
        <button
          onClick={addCell}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-muted-foreground text-sm font-bold hover:border-amber hover:text-amber transition-colors"
          aria-label="Add work cell"
        >
          + Add Work Cell
        </button>
      )}
    </div>
  );
}

// ─── Step 4: Operations Profile ───────────────────────────────────────────────

function Step4({ profile, update }: { profile: WizardProfile; update: WizardFormProps['update'] }) {
  const totalCycleTime = profile.workCells.reduce((s, wc) => s + wc.cycleTimeMinutes, 0);
  const unitsPerShift = Math.floor((profile.shiftHoursPerDay * 60) / totalCycleTime);
  const weeklyCapacity = unitsPerShift * profile.daysPerWeek;

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm font-body">
        Set your operational parameters. These drive the Digital Twin&apos;s cost and OEE calculations.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Labour Rate / Hour ({profile.currency})</label>
          <input
            type="number"
            className="input-field"
            value={profile.laborRatePerHour}
            min={1}
            onChange={(e) => update('laborRatePerHour', Number(e.target.value))}
            aria-label="Labour rate per hour"
          />
        </div>
        <div>
          <label className="input-label">Shift Hours / Day</label>
          <input
            type="number"
            className="input-field"
            value={profile.shiftHoursPerDay}
            min={1}
            max={24}
            onChange={(e) => update('shiftHoursPerDay', Number(e.target.value))}
            aria-label="Shift hours per day"
          />
        </div>
        <div>
          <label className="input-label">Production Days / Week</label>
          <input
            type="number"
            className="input-field"
            value={profile.daysPerWeek}
            min={1}
            max={7}
            onChange={(e) => update('daysPerWeek', Number(e.target.value))}
            aria-label="Production days per week"
          />
        </div>
        <div>
          <label className="input-label">Target OEE (%)</label>
          <input
            type="number"
            className="input-field"
            value={profile.targetOEE}
            min={10}
            max={100}
            onChange={(e) => update('targetOEE', Number(e.target.value))}
            aria-label="Target OEE percentage"
          />
        </div>
      </div>

      {/* Preview summary */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: 'linear-gradient(135deg, #0B1929, #1E3A5F)' }}>
        <div className="text-xs font-black uppercase tracking-widest text-amber mb-3">Capacity Preview</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-primary-foreground/50 text-xs mb-1">Total Cycle Time</div>
            <div className="text-white font-black text-lg">{totalCycleTime} min</div>
          </div>
          <div>
            <div className="text-primary-foreground/50 text-xs mb-1">Units / Shift</div>
            <div className="text-amber font-black text-lg">{unitsPerShift}</div>
          </div>
          <div>
            <div className="text-primary-foreground/50 text-xs mb-1">Weekly Capacity</div>
            <div className="text-white font-black text-lg">{weeklyCapacity.toLocaleString()}</div>
          </div>
        </div>
        <div className="text-primary-foreground/40 text-xs pt-1">
          At {profile.targetOEE}% OEE → effective output: <span className="text-amber font-bold">{Math.round(weeklyCapacity * profile.targetOEE / 100).toLocaleString()} units/week</span>
        </div>
      </div>
    </div>
  );
}
