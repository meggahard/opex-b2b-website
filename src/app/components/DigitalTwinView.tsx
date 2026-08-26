'use client';
import React, { useState, useCallback, useEffect, useId } from 'react';
import type { WizardProfile } from './DigitalTwinWizard';

interface DigitalTwinViewProps {
  profile: WizardProfile;
  contract: object | null;
  onDownload: () => void;
  onReset: () => void;
}

// ─── Traceability Scenario ────────────────────────────────────────────────────

interface TraceEvent {
  time: string;
  event: string;
  lot: string;
  location: string;
  type: 'consume' | 'produce' | 'inspect' | 'complaint' | 'resolve';
}

function buildTraceEvents(profile: WizardProfile): TraceEvent[] {
  const rmLot = `${profile.companyCode}-RAW-LOT-001`;
  const fgLot = `${profile.companyCode}-FG-LOT-001`;
  const events: TraceEvent[] = [
    { time: '08:00', event: `Received ${profile.rawMaterialName}`, lot: rmLot, location: 'Stores', type: 'consume' },
    { time: '08:05', event: `Issued to ${profile.workCells[0]?.name ?? 'Production'}`, lot: rmLot, location: 'WIP', type: 'consume' },
  ];
  profile.workCells.forEach((wc, i) => {
    events.push({
      time: `08:${String(10 + i * 10).padStart(2, '0')}`,
      event: `Processed at ${wc.name}`,
      lot: i < profile.workCells.length - 1 ? rmLot : fgLot,
      location: wc.name,
      type: wc.operationType === 'quality' ? 'inspect' : 'produce',
    });
  });
  events.push({ time: '09:30', event: `${profile.productName} transferred to Finished Goods`, lot: fgLot, location: 'Finished Goods', type: 'produce' });
  events.push({ time: '11:00', event: 'Customer complaint received — product defect reported', lot: fgLot, location: 'Customer', type: 'complaint' });
  events.push({ time: '11:05', event: `Lot ${fgLot} traced back to ${rmLot}`, lot: fgLot, location: 'Quality', type: 'resolve' });
  events.push({ time: '11:08', event: `Root cause: ${profile.workCells.find(w => w.operationType === 'quality')?.name ?? 'Inspection'} step — parameter deviation`, lot: rmLot, location: 'Quality', type: 'resolve' });
  return events;
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function DigitalTwinView({ profile, contract, onDownload, onReset }: DigitalTwinViewProps) {
  const [activeTab, setActiveTab] = useState<'twin' | 'traceability' | 'ledger' | 'contract'>('twin');
  const [batchQty, setBatchQty] = useState(profile.batchSize);
  const [oeeAvailability, setOeeAvailability] = useState(85);
  const [oeePerformance, setOeePerformance] = useState(90);
  const [oeeQuality, setOeeQuality] = useState(95);
  const [scrapRate, setScrapRate] = useState(2);
  const [traceStep, setTraceStep] = useState(-1);
  const traceEvents = buildTraceEvents(profile);
  const uniqueId = useId();

  // Derived calculations
  const oee = (oeeAvailability * oeePerformance * oeeQuality) / 10000;
  const totalCycleTime = profile.workCells.reduce((s, wc) => s + wc.cycleTimeMinutes, 0);
  const effectiveBatch = Math.round(batchQty * (1 - scrapRate / 100));
  const materialCost = batchQty * profile.rawMaterialCost;
  const laborHours = (totalCycleTime / 60) * (batchQty / profile.batchSize);
  const laborCost = laborHours * profile.laborRatePerHour;
  const scrapCost = (batchQty - effectiveBatch) * profile.rawMaterialCost;
  const totalBatchCost = materialCost + laborCost;
  const unitCost = effectiveBatch > 0 ? totalBatchCost / effectiveBatch : 0;
  const revenue = effectiveBatch * profile.finishedGoodCost;
  const margin = revenue > 0 ? ((revenue - totalBatchCost) / revenue) * 100 : 0;

  // Stock ledger
  const rmConsumed = batchQty;
  const fgProduced = effectiveBatch;
  const scrapped = batchQty - effectiveBatch;

  // Animate trace on tab switch
  useEffect(() => {
    if (activeTab === 'traceability') {
      setTraceStep(-1);
      let i = 0;
      const interval = setInterval(() => {
        setTraceStep(i);
        i++;
        if (i >= traceEvents.length) clearInterval(interval);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [activeTab, traceEvents.length]);

  const tabs = [
    { id: 'twin', label: 'Digital Twin', icon: '🏭' },
    { id: 'traceability', label: 'Traceability', icon: '🔍' },
    { id: 'ledger', label: 'Stock & Cost', icon: '📒' },
    { id: 'contract', label: 'Data Contract', icon: '📄' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div
        className="rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, #0B1929, #1E3A5F)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-black uppercase tracking-widest">Digital Twin Active</span>
          </div>
          <h3 className="text-white font-black text-xl">{profile.companyName}</h3>
          <p className="text-primary-foreground/50 text-sm">{profile.valueStreamName} · {profile.siteName}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onDownload}
            className="btn-primary py-2.5 px-5 text-xs"
            aria-label="Download ISA-95 data contract"
          >
            ↓ Download Contract
          </button>
          <button
            onClick={onReset}
            className="btn-outline py-2.5 px-5 text-xs"
            aria-label="Start over with a new profile"
          >
            ↺ New Profile
          </button>
        </div>
      </div>

      {/* OEE live bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'OEE', value: oee.toFixed(1), unit: '%', color: oee >= 70 ? '#22c55e' : oee >= 50 ? '#f59e0b' : '#ef4444' },
          { label: 'Availability', value: oeeAvailability, unit: '%', color: '#3b82f6' },
          { label: 'Performance', value: oeePerformance, unit: '%', color: '#8b5cf6' },
          { label: 'Quality', value: oeeQuality, unit: '%', color: '#10b981' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-2xl p-4 border border-border shadow-card text-center">
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
            <div className="text-2xl font-black" style={{ color: m.color }}>{m.value}{m.unit}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-input rounded-2xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-200 ${
              activeTab === t.id
                ? 'bg-white text-primary shadow-card'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={`Switch to ${t.label} tab`}
          >
            <span className="hidden sm:inline">{t.icon} </span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
        {activeTab === 'twin' && (
          <TwinTab
            profile={profile}
            oeeAvailability={oeeAvailability}
            oeePerformance={oeePerformance}
            oeeQuality={oeeQuality}
            setOeeAvailability={setOeeAvailability}
            setOeePerformance={setOeePerformance}
            setOeeQuality={setOeeQuality}
            batchQty={batchQty}
            setBatchQty={setBatchQty}
            scrapRate={scrapRate}
            setScrapRate={setScrapRate}
            oee={oee}
            effectiveBatch={effectiveBatch}
            unitCost={unitCost}
            margin={margin}
            uniqueId={uniqueId}
          />
        )}
        {activeTab === 'traceability' && (
          <TraceabilityTab profile={profile} traceEvents={traceEvents} traceStep={traceStep} />
        )}
        {activeTab === 'ledger' && (
          <LedgerTab
            profile={profile}
            batchQty={batchQty}
            setBatchQty={setBatchQty}
            scrapRate={scrapRate}
            setScrapRate={setScrapRate}
            rmConsumed={rmConsumed}
            fgProduced={fgProduced}
            scrapped={scrapped}
            materialCost={materialCost}
            laborCost={laborCost}
            scrapCost={scrapCost}
            totalBatchCost={totalBatchCost}
            unitCost={unitCost}
            revenue={revenue}
            margin={margin}
            uniqueId={uniqueId}
          />
        )}
        {activeTab === 'contract' && (
          <ContractTab contract={contract} onDownload={onDownload} />
        )}
      </div>
    </div>
  );
}

// ─── Twin Tab ─────────────────────────────────────────────────────────────────

interface TwinTabProps {
  profile: WizardProfile;
  oeeAvailability: number;
  oeePerformance: number;
  oeeQuality: number;
  setOeeAvailability: (v: number) => void;
  setOeePerformance: (v: number) => void;
  setOeeQuality: (v: number) => void;
  batchQty: number;
  setBatchQty: (v: number) => void;
  scrapRate: number;
  setScrapRate: (v: number) => void;
  oee: number;
  effectiveBatch: number;
  unitCost: number;
  margin: number;
  uniqueId: string;
}

function TwinTab({
  profile, oeeAvailability, oeePerformance, oeeQuality,
  setOeeAvailability, setOeePerformance, setOeeQuality,
  batchQty, setBatchQty, scrapRate, setScrapRate,
  oee, effectiveBatch, unitCost, margin, uniqueId,
}: TwinTabProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Production flow diagram */}
      <div>
        <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Production Flow</div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* Raw material */}
          <div className="flex-shrink-0 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-200 flex flex-col items-center justify-center gap-1">
              <span className="text-xl">📦</span>
              <span className="text-xs font-bold text-blue-700">RM</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 max-w-16 truncate">{profile.rawMaterialName}</div>
          </div>
          <FlowArrow />
          {/* Work cells */}
          {profile.workCells.map((wc, i) => (
            <React.Fragment key={wc.id}>
              <div className="flex-shrink-0 text-center">
                <div
                  className={`w-20 h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 ${
                    wc.operationType === 'quality' ?'bg-green-50 border-green-200'
                      : wc.operationType === 'maintenance' ?'bg-orange-50 border-orange-200' :'bg-amber/10 border-amber/30'
                  }`}
                >
                  <span className="text-lg">{wc.operationType === 'quality' ? '🔬' : wc.operationType === 'maintenance' ? '🔧' : '⚙️'}</span>
                  <span className="text-xs font-bold text-primary">{wc.cycleTimeMinutes}m</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 max-w-20 truncate">{wc.name}</div>
              </div>
              {i < profile.workCells.length - 1 && <FlowArrow />}
            </React.Fragment>
          ))}
          <FlowArrow />
          {/* Finished good */}
          <div className="flex-shrink-0 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center justify-center gap-1">
              <span className="text-xl">✅</span>
              <span className="text-xs font-bold text-emerald-700">FG</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 max-w-16 truncate">{profile.productName}</div>
          </div>
        </div>
      </div>

      {/* Sliders + KPIs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-5">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Adjust Operations</div>
          <SliderRow
            id={`${uniqueId}-avail`}
            label="Availability"
            value={oeeAvailability}
            onChange={setOeeAvailability}
            color="#3b82f6"
          />
          <SliderRow
            id={`${uniqueId}-perf`}
            label="Performance"
            value={oeePerformance}
            onChange={setOeePerformance}
            color="#8b5cf6"
          />
          <SliderRow
            id={`${uniqueId}-qual`}
            label="Quality Rate"
            value={oeeQuality}
            onChange={setOeeQuality}
            color="#10b981"
          />
          <SliderRow
            id={`${uniqueId}-scrap`}
            label="Scrap Rate"
            value={scrapRate}
            onChange={setScrapRate}
            min={0}
            max={20}
            color="#ef4444"
            suffix="%"
          />
          <div>
            <label className="input-label" htmlFor={`${uniqueId}-batch`}>Batch Size (units)</label>
            <input
              id={`${uniqueId}-batch`}
              type="number"
              className="input-field"
              value={batchQty}
              min={1}
              onChange={(e) => setBatchQty(Number(e.target.value))}
              aria-label="Batch size"
            />
          </div>
        </div>

        {/* Live KPIs */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Live Response</div>
          <KpiCard label="OEE Score" value={`${oee.toFixed(1)}%`} sub="Availability × Performance × Quality" accent={oee >= 70} />
          <KpiCard label="Effective Output" value={`${effectiveBatch} units`} sub={`from ${batchQty} started`} />
          <KpiCard label="Unit Cost" value={`${profile.currency} ${unitCost.toFixed(2)}`} sub="material + labour" />
          <KpiCard label="Batch Margin" value={`${margin.toFixed(1)}%`} sub="revenue vs total cost" accent={margin > 20} />
        </div>
      </div>
    </div>
  );
}

// ─── Traceability Tab ─────────────────────────────────────────────────────────

function TraceabilityTab({ profile, traceEvents, traceStep }: { profile: WizardProfile; traceEvents: TraceEvent[]; traceStep: number }) {
  const typeConfig = {
    consume: { color: '#3b82f6', bg: '#eff6ff', icon: '📦', label: 'Material Move' },
    produce: { color: '#10b981', bg: '#f0fdf4', icon: '✅', label: 'Produced' },
    inspect: { color: '#8b5cf6', bg: '#f5f3ff', icon: '🔬', label: 'Inspection' },
    complaint: { color: '#ef4444', bg: '#fef2f2', icon: '⚠️', label: 'Complaint' },
    resolve: { color: '#f59e0b', bg: '#fffbeb', icon: '🔍', label: 'Trace' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50 border border-red-200">
        <span className="text-2xl flex-shrink-0">⚠️</span>
        <div>
          <div className="font-black text-red-700 text-sm">Customer Complaint Scenario</div>
          <p className="text-red-600 text-xs mt-1 font-body">
            A customer reports a defect in <strong>{profile.productName}</strong>. Watch how the Digital Twin traces the issue back through the entire production chain — from finished goods to raw material lot — in seconds.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {traceEvents.map((evt, i) => {
          const cfg = typeConfig[evt.type];
          const visible = i <= traceStep;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-500 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ background: cfg.bg, borderColor: `${cfg.color}30` }}
              aria-hidden={!visible}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: `${cfg.color}20` }}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-xs text-muted-foreground">{evt.time}</span>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 rounded-full border border-border text-primary">{evt.lot}</span>
                </div>
                <div className="text-sm font-bold text-foreground mt-0.5">{evt.event}</div>
                <div className="text-xs text-muted-foreground">{evt.location}</div>
              </div>
            </div>
          );
        })}
      </div>

      {traceStep >= traceEvents.length - 1 && (
        <div className="p-4 rounded-2xl bg-amber/10 border border-amber/30 text-center">
          <div className="font-black text-amber text-sm">🎯 Full Traceability in {traceEvents.length} steps</div>
          <p className="text-muted-foreground text-xs mt-1">
            From customer complaint to raw material lot — complete genealogy captured automatically by the Digital Twin.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Ledger Tab ───────────────────────────────────────────────────────────────

interface LedgerTabProps {
  profile: WizardProfile;
  batchQty: number;
  setBatchQty: (v: number) => void;
  scrapRate: number;
  setScrapRate: (v: number) => void;
  rmConsumed: number;
  fgProduced: number;
  scrapped: number;
  materialCost: number;
  laborCost: number;
  scrapCost: number;
  totalBatchCost: number;
  unitCost: number;
  revenue: number;
  margin: number;
  uniqueId: string;
}

function LedgerTab({
  profile, batchQty, setBatchQty, scrapRate, setScrapRate,
  rmConsumed, fgProduced, scrapped,
  materialCost, laborCost, scrapCost, totalBatchCost, unitCost, revenue, margin,
  uniqueId,
}: LedgerTabProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Adjust Run Parameters</div>
          <div>
            <label className="input-label" htmlFor={`${uniqueId}-ledger-batch`}>Batch Size (units)</label>
            <input
              id={`${uniqueId}-ledger-batch`}
              type="number"
              className="input-field"
              value={batchQty}
              min={1}
              onChange={(e) => setBatchQty(Number(e.target.value))}
              aria-label="Batch size for ledger"
            />
          </div>
          <SliderRow
            id={`${uniqueId}-ledger-scrap`}
            label="Scrap Rate"
            value={scrapRate}
            onChange={setScrapRate}
            min={0}
            max={20}
            color="#ef4444"
            suffix="%"
          />
          <div className="p-4 rounded-2xl bg-input space-y-2">
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Unit Costs</div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Raw Material / Kg</span>
              <span className="font-black">{profile.currency} {profile.rawMaterialCost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Labour / Hour</span>
              <span className="font-black">{profile.currency} {profile.laborRatePerHour}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selling Price / Unit</span>
              <span className="font-black">{profile.currency} {profile.finishedGoodCost}</span>
            </div>
          </div>
        </div>

        {/* Live ledger */}
        <div className="space-y-4">
          {/* Stock ledger */}
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Stock Ledger</div>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-input">
                    <th className="text-left px-4 py-2 text-xs font-black uppercase tracking-wide text-muted-foreground">Item</th>
                    <th className="text-right px-4 py-2 text-xs font-black uppercase tracking-wide text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-2 text-xs font-black uppercase tracking-wide text-muted-foreground">Movement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{profile.rawMaterialName}</td>
                    <td className="px-4 py-3 text-right font-black text-red-500">-{rmConsumed} Kg</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">Stores → WIP</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{profile.productName}</td>
                    <td className="px-4 py-3 text-right font-black text-green-600">+{fgProduced} Nos</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">WIP → FG Store</td>
                  </tr>
                  {scrapped > 0 && (
                    <tr className="border-t border-border bg-red-50">
                      <td className="px-4 py-3 font-medium text-red-600">Scrap</td>
                      <td className="px-4 py-3 text-right font-black text-red-500">-{scrapped} units</td>
                      <td className="px-4 py-3 text-right text-xs text-red-400">Written off</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost ledger */}
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Cost Ledger</div>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <LedgerRow label="Material Cost" value={materialCost} currency={profile.currency} />
                  <LedgerRow label="Labour Cost" value={laborCost} currency={profile.currency} />
                  {scrapCost > 0 && <LedgerRow label="Scrap Loss" value={scrapCost} currency={profile.currency} highlight="red" />}
                  <tr className="border-t-2 border-border bg-input">
                    <td className="px-4 py-3 font-black text-primary">Total Batch Cost</td>
                    <td className="px-4 py-3 text-right font-black text-primary">{profile.currency} {totalBatchCost.toFixed(0)}</td>
                  </tr>
                  <LedgerRow label="Unit Cost" value={unitCost} currency={profile.currency} decimals={2} />
                  <LedgerRow label="Revenue" value={revenue} currency={profile.currency} highlight="green" />
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-bold">Gross Margin</td>
                    <td className={`px-4 py-3 text-right font-black ${margin > 20 ? 'text-green-600' : margin > 0 ? 'text-amber' : 'text-red-500'}`}>
                      {margin.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contract Tab ─────────────────────────────────────────────────────────────

function ContractTab({ contract, onDownload }: { contract: object | null; onDownload: () => void }) {
  const [expanded, setExpanded] = useState<string[]>(['identity', 'company']);
  const toggle = (key: string) =>
    setExpanded((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  if (!contract) return null;
  const c = contract as Record<string, unknown>;

  const sections = [
    { key: 'identity', label: 'Contract Identity', icon: '🆔' },
    { key: 'company', label: 'Company', icon: '🏢' },
    { key: 'sites', label: 'Sites & Areas', icon: '📍' },
    { key: 'work_cells', label: 'Work Cells', icon: '⚙️' },
    { key: 'items', label: 'Items & BOMs', icon: '📦' },
    { key: 'process_segments', label: 'Process Segments', icon: '🔄' },
    { key: 'cost_rules', label: 'Cost Rules', icon: '💰' },
    { key: 'tracking_profiles', label: 'Tracking Profiles', icon: '🔍' },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">ISA-95 Master Data Contract</div>
          <div className="font-black text-primary text-sm mt-0.5">{c.contract_id as string}</div>
        </div>
        <button onClick={onDownload} className="btn-primary py-2 px-5 text-xs" aria-label="Download contract JSON">
          ↓ Download JSON
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Version', value: 'v2' },
          { label: 'Work Cells', value: String((c.work_cells as unknown[])?.length ?? 0) },
          { label: 'Process Steps', value: String((c.process_segments as unknown[])?.length ?? 0) },
        ].map((m) => (
          <div key={m.label} className="bg-input rounded-2xl p-3">
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wide">{m.label}</div>
            <div className="font-black text-primary text-lg">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sections.map((sec) => {
          const data = c[sec.key];
          const isOpen = expanded.includes(sec.key);
          return (
            <div key={sec.key} className="rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => toggle(sec.key)}
                className="w-full flex items-center justify-between px-4 py-3 bg-input hover:bg-muted transition-colors"
                aria-expanded={isOpen}
                aria-label={`Toggle ${sec.label} section`}
              >
                <div className="flex items-center gap-2">
                  <span>{sec.icon}</span>
                  <span className="font-black text-sm text-primary">{sec.label}</span>
                </div>
                <span className="text-muted-foreground text-xs">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="p-4 bg-white">
                  <pre className="text-xs text-foreground overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function FlowArrow() {
  return (
    <div className="flex-shrink-0 text-muted-foreground text-lg" aria-hidden="true">→</div>
  );
}

interface SliderRowProps {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  color?: string;
  suffix?: string;
}

function SliderRow({ id, label, value, onChange, min = 0, max = 100, color = '#f59e0b', suffix = '%' }: SliderRowProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="input-label mb-0">{label}</label>
        <span className="text-sm font-black" style={{ color }}>{value}{suffix}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, #e2e8f0 ${((value - min) / (max - min)) * 100}%, #e2e8f0 100%)`,
          accentColor: color,
        }}
        aria-label={`${label} slider`}
      />
    </div>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border ${accent ? 'bg-amber/5 border-amber/30' : 'bg-input border-border'}`}>
      <div>
        <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      </div>
      <div className={`text-xl font-black ${accent ? 'text-amber' : 'text-primary'}`}>{value}</div>
    </div>
  );
}

function LedgerRow({ label, value, currency, highlight, decimals = 0 }: { label: string; value: number; currency: string; highlight?: 'red' | 'green'; decimals?: number }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
      <td className={`px-4 py-2.5 text-right font-bold ${highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-500' : 'text-foreground'}`}>
        {currency} {value.toFixed(decimals)}
      </td>
    </tr>
  );
}
