'use client';
import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { OEEData, FinancialData } from './CalculatorSection';

interface Props {
  oeeData: OEEData;
  financialData: FinancialData;
  onOEEChange: (d: OEEData) => void;
}

function computeImpact(oeeData: OEEData, financialData: FinancialData) {
  // ── Derive current-state A/P/Q from granular inputs ──
  const derivedAvailability = oeeData.scheduledHours > 0
    ? Math.min(100, Math.max(0, ((oeeData.scheduledHours - oeeData.plannedDowntime - oeeData.unplannedDowntime) / oeeData.scheduledHours) * 100))
    : oeeData.availability;

  const derivedPerformance = oeeData.targetRate > 0
    ? Math.min(100, Math.max(0, (oeeData.actualRate / oeeData.targetRate) * 100))
    : oeeData.performance;

  const derivedQuality = oeeData.totalUnits > 0
    ? Math.min(100, Math.max(0, ((oeeData.totalUnits - oeeData.qualityLossUnits) / oeeData.totalUnits) * 100))
    : oeeData.quality;

  // ── Safe targets (floored at baseline) ──
  const safeTargetAvailability = Math.max(oeeData.targetAvailability, derivedAvailability);
  const safeTargetPerformance = Math.max(oeeData.targetPerformance, derivedPerformance);
  const safeTargetQuality = Math.max(oeeData.targetQuality, derivedQuality);

  const baseOEE = (derivedAvailability / 100) * (derivedPerformance / 100) * (derivedQuality / 100);
  const targetOEE = (safeTargetAvailability / 100) * (safeTargetPerformance / 100) * (safeTargetQuality / 100);
  const oeeDelta = targetOEE - baseOEE;

  const baseCOGS = financialData.cogs * 1000;

  // Availability loss
  const uptimeFraction = oeeData.scheduledHours > 0
    ? oeeData.unplannedDowntime / Math.max(oeeData.scheduledHours, 1)
    : (1 - derivedAvailability / 100);
  const downtimeLoss = baseCOGS * uptimeFraction * 0.7;

  // Quality loss
  const qualityLossFraction = oeeData.totalUnits > 0
    ? oeeData.qualityLossUnits / Math.max(oeeData.totalUnits, 1)
    : (1 - derivedQuality / 100);
  const qualityLoss = baseCOGS * qualityLossFraction * 2.1;

  // Performance loss
  const rateLossFraction = oeeData.targetRate > 0
    ? Math.max(0, (oeeData.targetRate - oeeData.actualRate) / Math.max(oeeData.targetRate, 1))
    : Math.max(0, 1 - derivedPerformance / 100);
  const performanceLoss = baseCOGS * rateLossFraction * 0.5;

  const totalRecoverable = downtimeLoss + qualityLoss + performanceLoss;

  // Annual saving from OEE improvement
  const annualSaving = oeeDelta > 0 ? baseCOGS * oeeDelta * 0.65 : 0;

  // DuPont ratios — all from calculated financial totals
  const grossProfit = financialData.revenue - financialData.cogs;
  const grossMargin = financialData.revenue > 0 ? (grossProfit / financialData.revenue) * 100 : 0;
  const ebit = financialData.revenue - financialData.cogs - financialData.operatingExpenses;
  const ebitMargin = financialData.revenue > 0 ? (ebit / financialData.revenue) * 100 : 0;
  const netProfitMargin = financialData.revenue > 0 ? (financialData.netIncome / financialData.revenue) * 100 : 0;
  const assetTurnover = financialData.totalAssets > 0 ? financialData.revenue / financialData.totalAssets : 0;
  const equityMultiplier = financialData.totalEquity > 0 ? financialData.totalAssets / financialData.totalEquity : 0;
  const roe = equityMultiplier > 0 ? (netProfitMargin / 100) * assetTurnover * equityMultiplier * 100 : 0;

  // Improved DuPont
  const improvedCOGS = (baseCOGS - annualSaving) / 1000;
  const improvedNetIncome = financialData.netIncome + annualSaving / 1000;
  const improvedNPM = financialData.revenue > 0 ? (improvedNetIncome / financialData.revenue) * 100 : 0;
  const improvedAT = financialData.totalAssets > 0 ? financialData.revenue / financialData.totalAssets : 0;
  const improvedROE = equityMultiplier > 0 ? (improvedNPM / 100) * improvedAT * equityMultiplier * 100 : 0;

  const nwc = financialData.currentAssets - financialData.currentLiabilities;
  const capitalEmployed = financialData.fixedAssets + Math.max(0, nwc);
  const rona = capitalEmployed > 0 ? (financialData.netIncome / capitalEmployed) * 100 : 0;
  const improvedRONA = capitalEmployed > 0 ? (improvedNetIncome / capitalEmployed) * 100 : 0;

  const paybackMonths = annualSaving > 0
    ? (financialData.implementationCost * 1000) / (annualSaving / 12)
    : 0;

  const baseCostPerUnit = financialData.unitsProduced > 0 ? baseCOGS / financialData.unitsProduced : 0;
  const targetCostPerUnit = financialData.unitsProduced > 0 && baseOEE > 0 && targetOEE > 0
    ? baseCostPerUnit * (baseOEE / targetOEE)
    : baseCostPerUnit;

  return {
    baseOEE: baseOEE * 100,
    targetOEE: targetOEE * 100,
    oeeDelta: oeeDelta * 100,
    downtimeLoss,
    qualityLoss,
    performanceLoss,
    totalRecoverable,
    annualSaving,
    grossMargin,
    ebitMargin,
    netProfitMargin,
    assetTurnover,
    equityMultiplier,
    roe,
    improvedNPM,
    improvedAT,
    improvedROE,
    rona,
    improvedRONA,
    paybackMonths,
    improvedCOGS,
    improvedNetIncome,
    baseCostPerUnit,
    targetCostPerUnit,
    derivedAvailability,
    derivedPerformance,
    derivedQuality,
    safeTargetAvailability,
    safeTargetPerformance,
    safeTargetQuality,
  };
}

const CustomTooltip = ({ active, payload, label, sym }: { active?: boolean; payload?: { value: number }[]; label?: string; sym?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-3 shadow-card">
        <p className="text-xs font-bold text-foreground">{label}</p>
        <p className="text-sm font-black text-amber">
          {sym || 'R'}{Math.abs(payload[0].value / 1000).toFixed(0)}K
        </p>
      </div>
    );
  }
  return null;
};

export default function WhatIfModule({ oeeData, financialData, onOEEChange }: Props) {
  const impact = useMemo(() => computeImpact(oeeData, financialData), [oeeData, financialData]);
  const sym = financialData.currencySymbol || 'R';

  const waterfallData = [
    { name: 'Baseline COGS', value: financialData.cogs * 1000, type: 'base' },
    { name: 'Downtime Losses', value: -impact.downtimeLoss, type: 'loss' },
    { name: 'Quality Losses', value: -impact.qualityLoss, type: 'loss' },
    { name: 'Rate Losses', value: -impact.performanceLoss, type: 'loss' },
    { name: 'Achievable State', value: financialData.cogs * 1000 - impact.totalRecoverable, type: 'result' },
  ];

  /**
   * Mirror-sync: updating a playground slider updates the same target in OEEData,
   * which is the single source of truth shared with Step 2.
   * Floor is enforced at the derived baseline value.
   */
  const updateTarget = useCallback((
    key: 'availability' | 'performance' | 'quality',
    newVal: number
  ) => {
    const targetKey = `target${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof OEEData;
    const baselineMap: Record<string, number> = {
      availability: impact.derivedAvailability,
      performance: impact.derivedPerformance,
      quality: impact.derivedQuality,
    };
    const floor = baselineMap[key] ?? 0;
    onOEEChange({ ...oeeData, [targetKey]: Math.max(floor, Math.min(100, newVal)) });
  }, [oeeData, onOEEChange, impact.derivedAvailability, impact.derivedPerformance, impact.derivedQuality]);

  return (
    <section
      id="what-if"
      className="section-pad bg-background"
      aria-labelledby="whatif-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 reveal-item">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
            What-If Scenarios · Playground
          </span>
          <h2 id="whatif-heading" className="text-section-xl font-black text-foreground">
            Financial Impact Waterfall
          </h2>
          <p className="text-muted-foreground mt-2 font-body">
            See where money is lost and how much is recoverable. Scenario sliders simulate OEE improvements in real time.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Waterfall chart */}
          <div className="lg:col-span-8 reveal-item" data-delay="0.1">
            <div className="bg-card border border-border rounded-4xl p-8 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black text-foreground">Cost Loss Breakdown</h3>
                <span className="text-xs text-muted-foreground font-body">{sym}000s</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,25,41,0.06)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B', fontFamily: 'var(--font-plus-jakarta-sans)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B', fontFamily: 'var(--font-plus-jakarta-sans)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${sym}${(Math.abs(v) / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<CustomTooltip sym={sym} />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {waterfallData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.type === 'base' ? '#1E3A5F' : entry.type === 'loss' ? '#EF4444' : '#22C55E'}
                          opacity={entry.type === 'loss' ? 0.8 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Loss summary */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                {[
                  { label: 'Downtime Losses', value: impact.downtimeLoss },
                  { label: 'Quality Losses', value: impact.qualityLoss },
                  { label: 'Rate Losses', value: impact.performanceLoss },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.label}</div>
                    <div className="text-xl font-black text-red-500">
                      {sym}{(item.value / 1000).toFixed(0)}K
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-amber/5 border border-amber/20 rounded-2xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Total Recoverable</span>
                <span className="text-xl font-black text-amber">
                  {sym}{(impact.totalRecoverable / 1000).toFixed(0)}K / year
                </span>
              </div>
            </div>

            {/* ── SCENARIO SLIDERS — Playground ── */}
            <div className="mt-6 bg-card border border-border rounded-4xl p-8 shadow-card">
              <h3 className="text-base font-black text-foreground mb-1">Scenario Sliders — Playground</h3>
              <p className="text-xs text-muted-foreground mb-2 font-body">
                Mirror-synced with Step 2 Target Performance. Adjusting either updates the other.
              </p>
              <p className="text-xs text-amber/80 font-bold mb-6">
                Sliders are floored at the current baseline — no negative improvement allowed.
              </p>
              <div className="space-y-8">
                {[
                  {
                    key: 'availability' as const,
                    label: 'Target Availability',
                    baseVal: impact.derivedAvailability,
                    targetVal: impact.safeTargetAvailability,
                    color: '#3B82F6',
                    savingPerPP: financialData.cogs * 1000 * 0.004,
                  },
                  {
                    key: 'quality' as const,
                    label: 'Target Quality',
                    baseVal: impact.derivedQuality,
                    targetVal: impact.safeTargetQuality,
                    color: '#22C55E',
                    savingPerPP: financialData.cogs * 1000 * 0.007,
                  },
                  {
                    key: 'performance' as const,
                    label: 'Target Performance',
                    baseVal: impact.derivedPerformance,
                    targetVal: impact.safeTargetPerformance,
                    color: '#8B5CF6',
                    savingPerPP: financialData.cogs * 1000 * 0.002,
                  },
                ].map((s) => {
                  const delta = Math.max(0, s.targetVal - s.baseVal);
                  const saving = delta * s.savingPerPP / 1000;
                  // Normalize fill within the min–100 range so thumb aligns with fill endpoint
                  const range = 100 - s.baseVal;
                  const filled = range > 0 ? ((s.targetVal - s.baseVal) / range) * 100 : 0;
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-sm font-black text-foreground">{s.label}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">Baseline: <strong>{s.baseVal.toFixed(1)}%</strong></span>
                            <span className="text-xs text-muted-foreground">→</span>
                            <span className="text-xs font-bold" style={{ color: s.color }}>Target: {s.targetVal.toFixed(1)}%</span>
                            {delta > 0 && (
                              <span className="text-xs font-bold text-green-600">(+{delta.toFixed(1)}pp)</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Est. saving</div>
                          <div className="text-sm font-black text-green-600">{sym}{saving.toFixed(0)}K</div>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={s.baseVal}
                        max="100"
                        step="0.1"
                        value={s.targetVal}
                        onChange={(e) => updateTarget(s.key, parseFloat(e.target.value))}
                        className="slider-input"
                        style={{
                          background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${filled}%, #E2E8F0 ${filled}%, #E2E8F0 100%)`,
                        }}
                        aria-label={`${s.label} scenario slider`}
                        aria-valuemin={s.baseVal}
                        aria-valuemax={100}
                        aria-valuenow={s.targetVal}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Baseline ({s.baseVal.toFixed(1)}%)</span>
                        <span>100%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Real-time OEE result */}
              <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="bg-muted/50 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Baseline OEE</div>
                  <div className="text-2xl font-black" style={{ color: impact.baseOEE < 60 ? '#EF4444' : impact.baseOEE < 80 ? '#F59E0B' : '#22C55E' }}>
                    {impact.baseOEE.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-amber/10 border border-amber/20 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-amber mb-1">Target OEE</div>
                  <div className="text-2xl font-black text-amber">{impact.targetOEE.toFixed(1)}%</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-green-600 mb-1">Annual Saving</div>
                  <div className="text-2xl font-black text-green-600">{sym}{(impact.annualSaving / 1000).toFixed(0)}K</div>
                </div>
              </div>

              <div className="mt-4 bg-amber/5 border border-amber/20 rounded-2xl p-4">
                <p className="text-xs text-foreground/70 leading-relaxed font-body">
                  <strong className="text-amber">Quality vs Availability:</strong> A 5-point quality improvement delivers ~72% more net profit than a 5-point availability improvement — because quality losses carry a dual DuPont penalty on both Asset Turnover AND Net Profit Margin simultaneously.
                </p>
              </div>
            </div>
          </div>

          {/* Right — DuPont summary + annual saving */}
          <div className="lg:col-span-4 reveal-item" data-delay="0.15">
            <div className="sticky top-28 space-y-5">
              {/* Annual saving highlight */}
              <div
                className="rounded-4xl p-6 text-primary-foreground"
                style={{ background: 'linear-gradient(135deg, #0B1929 0%, #1E3A5F 100%)' }}
              >
                <div className="text-xs font-bold uppercase tracking-widest text-primary-foreground/50 mb-4">
                  Projected Annual Saving
                </div>
                <div className="text-5xl font-black text-amber mb-1">
                  {sym}{(impact.annualSaving / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-primary-foreground/60 mb-4">
                  OEE improvement: +{impact.oeeDelta.toFixed(1)}pp
                </div>
                <div className="border-t border-primary-foreground/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-foreground/60">Implementation cost</span>
                    <span className="font-bold text-primary-foreground">
                      {sym}{financialData.implementationCost}K
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-foreground/60">Payback period</span>
                    <span className="font-black text-amber">
                      {impact.paybackMonths > 0 ? `${impact.paybackMonths.toFixed(1)} mo` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Ratios — live synced from calculated totals */}
              <div className="bg-card border border-border rounded-4xl p-6 shadow-card">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Key Ratios — Live
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Gross Margin', value: `${impact.grossMargin.toFixed(1)}%`, color: impact.grossMargin > 30 ? 'text-green-600' : 'text-amber' },
                    { label: 'EBIT Margin', value: `${impact.ebitMargin.toFixed(1)}%`, color: impact.ebitMargin > 10 ? 'text-green-600' : 'text-amber' },
                    { label: 'Cost/Unit', value: `${sym}${impact.baseCostPerUnit.toFixed(2)}`, color: 'text-foreground' },
                    { label: 'Asset Turnover', value: `${impact.assetTurnover.toFixed(2)}x`, color: 'text-foreground' },
                  ].map((ratio) => (
                    <div key={ratio.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-xs font-bold text-muted-foreground">{ratio.label}</span>
                      <span className={`text-sm font-black ${ratio.color}`}>{ratio.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DuPont ratios */}
              <div className="bg-card border border-border rounded-4xl p-6 shadow-card">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  DuPont Ratio Impact
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Net Profit Margin', base: impact.netProfitMargin, improved: impact.improvedNPM, suffix: '%' },
                    { label: 'Asset Turnover', base: impact.assetTurnover, improved: impact.improvedAT, suffix: 'x' },
                    { label: 'RONA', base: impact.rona, improved: impact.improvedRONA, suffix: '%' },
                    { label: 'ROE', base: impact.roe, improved: impact.improvedROE, suffix: '%' },
                  ].map((ratio) => (
                    <div key={ratio.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-muted-foreground">{ratio.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground line-through">
                            {ratio.base.toFixed(2)}{ratio.suffix}
                          </span>
                          <span className="text-sm font-black text-amber">
                            {ratio.improved.toFixed(2)}{ratio.suffix}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.abs(ratio.improved) * 5)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Savings breakdown */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-card">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Savings Breakdown
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'RM Packaging', value: impact.annualSaving * 0.18 },
                    { label: 'RM Ingredients', value: impact.annualSaving * 0.27 },
                    { label: 'Direct Labor (Variable)', value: impact.annualSaving * 0.55 },
                    { label: 'Direct Labor (Fixed)', value: 0, fixed: true },
                    { label: 'Indirect & Overhead', value: 0, fixed: true },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className={`text-xs font-black ${item.fixed ? 'text-muted-foreground' : 'text-green-600'}`}>
                        {item.fixed ? 'No change' : `${sym}${(item.value / 1000).toFixed(0)}K`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
