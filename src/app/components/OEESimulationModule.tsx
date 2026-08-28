'use client';
import React, { useState, useCallback } from 'react';
import type { OEEData, FinancialData } from './CalculatorSection';

interface Props {
  data: OEEData;
  financialData: FinancialData;
  onChange: (d: OEEData) => void;
}

interface GaugeProps {
  value: number;
  label: string;
  color: string;
  size?: number;
}

function OEEGauge({ value, label, color, size = 140 }: GaugeProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const offset = arcLength - (value / 100) * arcLength;
  const startAngle = 135;
  const cx = size / 2;
  const cy = size / 2;

  const getColor = (v: number, c: string) => {
    if (v < 60) return '#EF4444';
    if (v < 80) return '#F59E0B';
    return c;
  };

  const strokeColor = getColor(value, color);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${value.toFixed(1)}%`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(11,25,41,0.08)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset="0" transform={`rotate(${startAngle} ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={offset} transform={`rotate(${startAngle} ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s ease' }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="800" fill={strokeColor} fontFamily="var(--font-plus-jakarta-sans)">
          {value.toFixed(1)}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(11,25,41,0.4)" fontFamily="var(--font-plus-jakarta-sans)" letterSpacing="0.08em">
          {value < 60 ? '● LOW' : value < 80 ? '● MID' : '● GOOD'}
        </text>
      </svg>
      <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function ReadOnlySlider({ value, label, hint, color }: { value: number; label: string; hint?: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-sm font-black text-foreground">{label}</span>
          {hint && <span className="text-xs text-muted-foreground ml-2">{hint}</span>}
        </div>
        <span className="text-lg font-black" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div className="relative">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
        {/* 85% world-class marker */}
        <div className="absolute top-0 w-0.5 h-3 bg-muted-foreground/40 pointer-events-none" style={{ left: '85%' }} title="85% world-class" />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>0%</span>
        <span className="text-muted-foreground/60">85% world-class</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export default function OEESimulationModule({ data, financialData, onChange }: Props) {
  const sym = financialData.currencySymbol || 'R';

  // ── Derive A/P/Q from granular inputs (these ARE the current state) ──
  const derivedAvailability = data.scheduledHours > 0
    ? Math.min(100, Math.max(0, ((data.scheduledHours - data.plannedDowntime - data.unplannedDowntime) / data.scheduledHours) * 100))
    : data.availability;

  const derivedPerformance = data.targetRate > 0
    ? Math.min(100, Math.max(0, (data.actualRate / data.targetRate) * 100))
    : data.performance;

  const derivedQuality = data.totalUnits > 0
    ? Math.min(100, Math.max(0, ((data.totalUnits - data.qualityLossUnits) / data.totalUnits) * 100))
    : data.quality;

  // ── Composite OEE from derived values ──
  const oee = (derivedAvailability / 100) * (derivedPerformance / 100) * (derivedQuality / 100) * 100;

  // ── Target OEE — capped so targets cannot go below baseline ──
  const safeTargetAvailability = Math.max(data.targetAvailability, derivedAvailability);
  const safeTargetPerformance = Math.max(data.targetPerformance, derivedPerformance);
  const safeTargetQuality = Math.max(data.targetQuality, derivedQuality);
  const targetOEE = (safeTargetAvailability / 100) * (safeTargetPerformance / 100) * (safeTargetQuality / 100) * 100;

  const updateGranular = useCallback((key: keyof OEEData, val: number) => {
    const newData = { ...data, [key]: val };

    // ── Sync availability from time inputs ──
    if (['scheduledHours', 'plannedDowntime', 'unplannedDowntime'].includes(key as string)) {
      const sh = key === 'scheduledHours' ? val : newData.scheduledHours;
      const pd = key === 'plannedDowntime' ? val : newData.plannedDowntime;
      const ud = key === 'unplannedDowntime' ? val : newData.unplannedDowntime;
      if (sh > 0) {
        const newAvail = Math.min(100, Math.max(0, ((sh - pd - ud) / sh) * 100));
        newData.availability = newAvail;
        // Cap target so it never goes below new baseline
        newData.targetAvailability = Math.max(newData.targetAvailability, newAvail);
      }
    }

    // ── Sync performance from rate inputs ──
    if (['actualRate', 'targetRate'].includes(key as string)) {
      const ar = key === 'actualRate' ? val : newData.actualRate;
      const tr = key === 'targetRate' ? val : newData.targetRate;
      if (tr > 0) {
        const newPerf = Math.min(100, Math.max(0, (ar / tr) * 100));
        newData.performance = newPerf;
        newData.targetPerformance = Math.max(newData.targetPerformance, newPerf);
      }
    }

    // ── Sync quality from unit inputs ──
    if (['totalUnits', 'qualityLossUnits'].includes(key as string)) {
      const tu = key === 'totalUnits' ? val : newData.totalUnits;
      const ql = key === 'qualityLossUnits' ? val : newData.qualityLossUnits;
      if (tu > 0) {
        const newQual = Math.min(100, Math.max(0, ((tu - ql) / tu) * 100));
        newData.quality = newQual;
        newData.targetQuality = Math.max(newData.targetQuality, newQual);
      }
    }

    onChange(newData);
  }, [data, onChange]);

  const updateTarget = useCallback((key: 'targetAvailability' | 'targetPerformance' | 'targetQuality', val: number) => {
    // Determine the corresponding baseline value to enforce the floor
    const baselineMap: Record<string, number> = {
      targetAvailability: derivedAvailability,
      targetPerformance: derivedPerformance,
      targetQuality: derivedQuality,
    };
    const floor = baselineMap[key] ?? 0;
    onChange({ ...data, [key]: Math.max(floor, Math.min(100, val)) });
  }, [data, onChange, derivedAvailability, derivedPerformance, derivedQuality]);

  const getOEEColor = (v: number) => {
    if (v < 60) return '#EF4444';
    if (v < 80) return '#F59E0B';
    return '#22C55E';
  };

  const oeeColor = getOEEColor(oee);
  const targetOEEColor = getOEEColor(targetOEE);

  // Cost/Unit calculations — use computed COGS from financial data
  const baseCostPerUnit = financialData.unitsSold > 0
    ? (financialData.cogs * 1000) / financialData.unitsSold
    : 0;
  const targetCostPerUnit = financialData.unitsSold > 0 && oee > 0 && targetOEE > 0
    ? baseCostPerUnit * (oee / targetOEE)
    : baseCostPerUnit;

  return (
    <section
      id="oee-simulation"
      className="section-pad"
      style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)' }}
      aria-labelledby="oee-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 reveal-item">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Step 2 of 3</span>
          <h2 id="oee-heading" className="text-section-xl font-black text-foreground">
            Simulate Your OEE Performance
          </h2>
          <p className="text-muted-foreground mt-2 font-body">
            Granular production inputs are pre-synced from your financial data. Adjust to refine your baseline.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6 reveal-item" data-delay="0.1">

            {/* ── GRANULAR PRODUCTION INPUTS ── */}
            <div className="bg-card border border-amber/20 rounded-4xl p-8 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-foreground">Granular Production Inputs</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-amber bg-amber/10 px-3 py-1 rounded-full">
                  Baseline Data
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-5 font-body">
                These inputs drive the Baseline OEE. Editing them auto-updates Availability, Performance, and Quality below.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {[
                  { key: 'scheduledHours' as const, label: 'Scheduled Hours', suffix: 'hrs', hint: 'Total planned production hours', readOnly: false },
                  { key: 'plannedDowntime' as const, label: 'Planned Downtime', suffix: 'hrs', hint: 'Maintenance, changeovers', readOnly: false },
                  { key: 'unplannedDowntime' as const, label: 'Unplanned Downtime', suffix: 'hrs', hint: 'Breakdowns, stoppages', readOnly: false },
                  { key: 'actualRate' as const, label: 'Actual Production Rate', suffix: `${financialData.unitOfMeasure}/hr`, hint: 'Actual throughput', readOnly: false },
                  { key: 'targetRate' as const, label: 'Target Production Rate', suffix: `${financialData.unitOfMeasure}/hr`, hint: 'Nameplate capacity', readOnly: false },
                  { key: 'qualityLossUnits' as const, label: 'Quality Loss Units', suffix: financialData.unitOfMeasure, hint: 'Scrap + rework (enter manually)', readOnly: false },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="input-label">{field.label}</label>
                    {field.hint && <div className="text-xs text-muted-foreground mb-1">{field.hint}</div>}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={data[field.key]}
                        onChange={(e) => updateGranular(field.key, Number(e.target.value) || 0)}
                        className="input-field"
                        style={{ paddingRight: '4rem' }}
                        aria-label={field.label}
                      />
                      <span className="absolute right-3 text-muted-foreground text-xs font-bold pointer-events-none">{field.suffix}</span>
                    </div>
                  </div>
                ))}
                {/* Total Units Produced — read-only, auto-calculated = Good Units + Quality Loss */}
                <div>
                  <label className="input-label flex items-center gap-1.5">
                    Total Units Produced
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber bg-amber/10 px-1.5 py-0.5 rounded-full">Auto</span>
                  </label>
                  <div className="text-xs text-muted-foreground mb-1">Good Units + Quality Loss Units</div>
                  <div className="relative flex items-center rounded-2xl border bg-amber/5 border-amber/30 px-3 py-2.5">
                    <span className="text-sm font-black text-amber flex-1">{data.totalUnits.toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs font-bold ml-1">{financialData.unitOfMeasure}</span>
                  </div>
                </div>
              </div>
              {/* Auto-calculated derived fields */}
              <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-border">
                {[
                  { label: 'Line Uptime', value: `${Math.max(0, data.scheduledHours - data.plannedDowntime - data.unplannedDowntime).toFixed(0)} hrs` },
                  { label: 'Rate Loss', value: `${Math.max(0, data.targetRate - data.actualRate).toFixed(0)} ${financialData.unitOfMeasure}/hr` },
                  { label: 'Good Units', value: `${financialData.unitsSold.toLocaleString()}` },
                ].map((calc) => (
                  <div key={calc.label} className="bg-muted/50 rounded-2xl p-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{calc.label}</div>
                    <div className="text-base font-black text-foreground">{calc.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── BASELINE PERFORMANCE — read-only, driven by granular inputs ── */}
            <div className="bg-card border border-border rounded-4xl p-8 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground">Baseline Performance</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Current State — Read Only
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-6 font-body">
                These reflect your entered data. Edit the Granular Production Inputs above to adjust.
              </p>
              <div className="space-y-7">
                <ReadOnlySlider value={derivedAvailability} label="Availability" hint="Planned run time minus unplanned downtime" color="#3B82F6" />
                <ReadOnlySlider value={derivedPerformance} label="Performance" hint="Actual vs target production rate" color="#8B5CF6" />
                <ReadOnlySlider value={derivedQuality} label="Quality" hint="Good units vs total units produced" color="#22C55E" />
              </div>
              {/* Baseline OEE — accurate composite from derived values */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between bg-muted/30 rounded-2xl px-4 py-3">
                <span className="text-sm font-bold text-muted-foreground">Baseline OEE</span>
                <span className="text-2xl font-black" style={{ color: oeeColor }}>{oee.toFixed(1)}%</span>
              </div>
            </div>

            {/* ── TARGET PERFORMANCE — adjustable sliders, floored at baseline ── */}
            <div className="bg-card border border-amber/20 rounded-4xl p-8 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground">Target Performance</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-amber bg-amber/10 px-3 py-1 rounded-full">
                  Improved State
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-6 font-body">
                Targets are capped at a minimum of the current baseline — no negative improvement allowed.
              </p>
              <div className="space-y-7">
                {[
                  { key: 'targetAvailability' as const, label: 'Target Availability', baseline: derivedAvailability, color: '#F59E0B' },
                  { key: 'targetPerformance' as const, label: 'Target Performance', baseline: derivedPerformance, color: '#F59E0B' },
                  { key: 'targetQuality' as const, label: 'Target Quality', baseline: derivedQuality, color: '#F59E0B' },
                ].map((slider) => {
                  const currentVal = Math.max(data[slider.key], slider.baseline);
                  // Fill % relative to 0–100 range
                  const fillPct = currentVal;
                  // Baseline marker position
                  const baselinePct = slider.baseline;
                  return (
                    <div key={slider.key}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="text-sm font-black text-foreground">{slider.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            min: {slider.baseline.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-lg font-black text-amber">{currentVal.toFixed(1)}%</span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min={slider.baseline}
                          max="100"
                          step="0.1"
                          value={currentVal}
                          onChange={(e) => updateTarget(slider.key, parseFloat(e.target.value))}
                          className="slider-input"
                          style={{
                            // Normalize fill within the min–100 range so thumb aligns with fill
                            background: (() => {
                              const range = 100 - slider.baseline;
                              const filled = range > 0 ? ((currentVal - slider.baseline) / range) * 100 : 0;
                              return `linear-gradient(to right, #F59E0B 0%, #F59E0B ${filled}%, #E2E8F0 ${filled}%, #E2E8F0 100%)`;
                            })(),
                          }}
                          aria-label={`${slider.label} slider`}
                          aria-valuemin={slider.baseline}
                          aria-valuemax={100}
                          aria-valuenow={currentVal}
                        />
                        {/* Baseline marker on the track */}
                        <div
                          className="absolute -top-1 w-0.5 h-5 bg-blue-400/60 pointer-events-none"
                          style={{ left: `${baselinePct}%` }}
                          title={`Baseline: ${slider.baseline.toFixed(1)}%`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Baseline ({slider.baseline.toFixed(1)}%)</span>
                        <span>100%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Target OEE at bottom */}
              <div className="mt-6 pt-4 border-t border-amber/20 flex items-center justify-between bg-amber/5 rounded-2xl px-4 py-3">
                <span className="text-sm font-bold text-amber">Target OEE</span>
                <span className="text-2xl font-black text-amber">{targetOEE.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Right — gauges + OEE score */}
          <div className="lg:col-span-5 reveal-item" data-delay="0.15">
            <div className="sticky top-28 space-y-6">
              {/* Three gauges — show derived (accurate) values */}
              <div className="bg-primary rounded-4xl p-8">
                <div className="text-xs font-bold uppercase tracking-widest text-primary-foreground/50 mb-6 text-center">
                  OEE Component Scores
                </div>
                <div className="flex justify-around">
                  <OEEGauge value={derivedAvailability} label="Availability" color="#22C55E" />
                  <OEEGauge value={derivedPerformance} label="Performance" color="#22C55E" />
                  <OEEGauge value={derivedQuality} label="Quality" color="#22C55E" />
                </div>
                <div className="mt-4 flex justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-primary-foreground/40">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Below 60%
                  </span>
                  <span className="flex items-center gap-1 text-primary-foreground/40">
                    <span className="w-2 h-2 rounded-full bg-amber inline-block" /> 60–80%
                  </span>
                  <span className="flex items-center gap-1 text-primary-foreground/40">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Above 80%
                  </span>
                </div>
              </div>

              {/* Composite OEE card — accurate current state */}
              <div className="bg-card border border-border rounded-4xl p-6 shadow-card text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Composite OEE = Availability × Performance × Quality
                </div>
                <div className="text-7xl font-black font-display mb-1" style={{ color: oeeColor }}>
                  {oee.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  World-class benchmark: <strong className="text-foreground">85%</strong> — gap of{' '}
                  <strong style={{ color: oeeColor }}>{Math.max(0, 85 - oee).toFixed(1)}pp</strong>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-muted/50 rounded-2xl p-3">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Baseline</div>
                    <div className="text-2xl font-black" style={{ color: oeeColor }}>{oee.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground mt-1">A×P×Q</div>
                  </div>
                  <div className="bg-amber/10 border border-amber/20 rounded-2xl p-3">
                    <div className="text-xs font-bold uppercase tracking-widest text-amber mb-1">Target</div>
                    <div className="text-2xl font-black text-amber">{targetOEE.toFixed(1)}%</div>
                    <div className="text-xs text-amber/60 mt-1">A×P×Q</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Improvement:</span>
                  <span className="text-sm font-black text-amber">+{Math.max(0, targetOEE - oee).toFixed(1)}pp</span>
                </div>
              </div>

              {/* Cost/Unit — auto-updated */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-card">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Cost / {financialData.unitOfMeasure || 'Unit'}
                </div>
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Baseline</div>
                    <div className="text-2xl font-black text-foreground">
                      {sym}{baseCostPerUnit.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-amber text-xl mb-1">→</div>
                  <div>
                    <div className="text-xs text-amber">Target</div>
                    <div className="text-2xl font-black text-amber">
                      {sym}{targetCostPerUnit.toFixed(2)}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs text-green-600">Saving</div>
                    <div className="text-lg font-black text-green-600">
                      {sym}{(baseCostPerUnit - targetCostPerUnit).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
