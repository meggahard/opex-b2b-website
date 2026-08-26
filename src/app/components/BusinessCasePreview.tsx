'use client';
import React, { useMemo } from 'react';
import type { FinancialData, OEEData } from './CalculatorSection';

interface Props {
  financialData: FinancialData;
  oeeData: OEEData;
}

function computeBusinessCase(fd: FinancialData, od: OEEData) {
  const baseOEE = (od.availability / 100) * (od.performance / 100) * (od.quality / 100) * 100;
  const targetOEE = (od.targetAvailability / 100) * (od.targetPerformance / 100) * (od.targetQuality / 100) * 100;
  const oeeDelta = targetOEE - baseOEE;

  const baseCOGS = fd.cogs * 1000;
  const annualSaving = Math.max(0, baseCOGS * (oeeDelta / 100) * 0.65);

  const baseGrossMargin = fd.revenue > 0 ? ((fd.revenue - fd.cogs) / fd.revenue) * 100 : 0;
  const improvedCOGS = (fd.cogs * 1000 - annualSaving) / 1000;
  const improvedGrossMargin = fd.revenue > 0 ? ((fd.revenue - improvedCOGS) / fd.revenue) * 100 : 0;

  const baseCostPerUnit = fd.unitsProduced > 0 ? (fd.cogs * 1000) / fd.unitsProduced : 0;
  const improvedCostPerUnit = fd.unitsProduced > 0 ? ((fd.cogs * 1000 - annualSaving)) / fd.unitsProduced : 0;

  const baseNPM = fd.revenue > 0 ? (fd.netIncome / fd.revenue) * 100 : 0;
  const improvedNetIncome = fd.netIncome + annualSaving / 1000;
  const improvedNPM = fd.revenue > 0 ? (improvedNetIncome / fd.revenue) * 100 : 0;

  const baseAT = fd.totalAssets > 0 ? fd.revenue / fd.totalAssets : 0;
  const improvedAT = fd.totalAssets > 0 ? fd.revenue / fd.totalAssets * (1 + oeeDelta * 0.003) : 0;

  const nwc = fd.currentAssets - fd.currentLiabilities;
  const baseRONA = (fd.fixedAssets + nwc) > 0 ? (fd.netIncome / (fd.fixedAssets + nwc)) * 100 : 0;
  const improvedRONA = (fd.fixedAssets + nwc) > 0 ? (improvedNetIncome / (fd.fixedAssets + nwc)) * 100 : 0;

  const paybackMonths = annualSaving > 0 ? (fd.implementationCost * 1000) / (annualSaving / 12) : 0;

  const downtimeLoss = baseCOGS * (od.scheduledHours > 0 ? od.unplannedDowntime / od.scheduledHours : 0.21) * 0.7;
  const qualityLoss = baseCOGS * (od.totalUnits > 0 ? od.qualityLossUnits / od.totalUnits : 0.004) * 2.1;
  const performanceLoss = baseCOGS * (od.targetRate > 0 ? (od.targetRate - od.actualRate) / od.targetRate : 0.008) * 0.5;

  return {
    baseOEE, targetOEE, oeeDelta,
    baseGrossMargin, improvedGrossMargin,
    baseCostPerUnit, improvedCostPerUnit,
    baseNPM, improvedNPM,
    baseAT, improvedAT,
    baseRONA, improvedRONA,
    annualSaving, paybackMonths,
    downtimeLoss, qualityLoss, performanceLoss,
    improvedCOGS, improvedNetIncome,
  };
}

export default function BusinessCasePreview({ financialData, oeeData }: Props) {
  const bc = useMemo(() => computeBusinessCase(financialData, oeeData), [financialData, oeeData]);

  const MetricRow = ({ label, base, improved, suffix = '', good = true }: { label: string; base: string; improved: string; suffix?: string; good?: boolean }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground line-through">{base}{suffix}</span>
        <span className={`text-sm font-black ${good ? 'text-green-600' : 'text-red-500'}`}>{improved}{suffix}</span>
      </div>
    </div>
  );

  return (
    <section
      id="business-case"
      className="section-pad"
      style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)' }}
      aria-labelledby="business-case-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 reveal-item">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
            Step 3 of 3
          </span>
          <h2 id="business-case-heading" className="text-section-xl font-black text-foreground">
            Your Live Business Case
          </h2>
          <p className="text-muted-foreground mt-2 font-body">
            Before and After — updates in real time as you adjust inputs above.
          </p>
        </div>

        {/* Before/After cards */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Current State */}
          <div className="reveal-item bg-card border border-border rounded-4xl p-8 shadow-card" data-delay="0.1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-foreground">Current State</h3>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Baseline
              </span>
            </div>
            <div className="space-y-1">
              <MetricRow label="Annual Revenue" base="" improved={`${financialData.currency}${financialData.revenue.toLocaleString()}K`} suffix="" />
              <MetricRow label="COGS" base="" improved={`${financialData.currency}${financialData.cogs.toLocaleString()}K`} suffix="" good={false} />
              <MetricRow label="Gross Margin" base="" improved={`${bc.baseGrossMargin.toFixed(1)}%`} suffix="" />
              <MetricRow label="OEE Baseline" base="" improved={`${bc.baseOEE.toFixed(1)}%`} suffix="" />
              <MetricRow label={`Cost / ${financialData.unitOfMeasure || 'Unit'}`} base="" improved={`${financialData.currency}${bc.baseCostPerUnit.toFixed(2)}`} suffix="" good={false} />
              <MetricRow label="Net Profit Margin" base="" improved={`${bc.baseNPM.toFixed(2)}%`} suffix="" />
              <MetricRow label="Asset Turnover" base="" improved={`${bc.baseAT.toFixed(2)}x`} suffix="" />
              <MetricRow label="RONA" base="" improved={`${bc.baseRONA.toFixed(2)}%`} suffix="" />
            </div>
            <div className="mt-6 pt-6 border-t border-border space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Annual Losses</div>
              {[
                { label: 'Unplanned Downtime', value: bc.downtimeLoss },
                { label: 'Quality / Scrap', value: bc.qualityLoss },
                { label: 'Performance / Rate', value: bc.performanceLoss },
              ].map((loss) => (
                <div key={loss.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{loss.label}</span>
                  <span className="text-sm font-black text-red-500">
                    -{financialData.currency}{(loss.value / 1000).toFixed(0)}K
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Improved State */}
          <div
            className="reveal-item rounded-4xl p-8 text-primary-foreground relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0B1929 0%, #1E3A5F 100%)' }}
            data-delay="0.15"
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-lg font-black text-primary-foreground">Improved State</h3>
              <span className="text-xs font-bold uppercase tracking-widest text-amber bg-amber/20 px-3 py-1 rounded-full">
                Target OEE {bc.targetOEE.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1 relative z-10">
              {[
                { label: 'Annual Revenue', base: `${financialData.currency}${financialData.revenue.toLocaleString()}K`, improved: `${financialData.currency}${financialData.revenue.toLocaleString()}K`, positive: false },
                { label: 'Projected COGS', base: `${financialData.currency}${financialData.cogs.toLocaleString()}K`, improved: `${financialData.currency}${bc.improvedCOGS.toFixed(0)}K`, positive: true },
                { label: 'Gross Margin', base: `${bc.baseGrossMargin.toFixed(1)}%`, improved: `${bc.improvedGrossMargin.toFixed(1)}%`, positive: true },
                { label: 'Cost / Unit', base: `${financialData.currency}${bc.baseCostPerUnit.toFixed(2)}`, improved: `${financialData.currency}${bc.improvedCostPerUnit.toFixed(2)}`, positive: true },
                { label: 'Net Profit Margin', base: `${bc.baseNPM.toFixed(2)}%`, improved: `${bc.improvedNPM.toFixed(2)}%`, positive: true },
                { label: 'Asset Turnover', base: `${bc.baseAT.toFixed(2)}x`, improved: `${bc.improvedAT.toFixed(2)}x`, positive: true },
                { label: 'RONA', base: `${bc.baseRONA.toFixed(2)}%`, improved: `${bc.improvedRONA.toFixed(2)}%`, positive: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-primary-foreground/10 last:border-0">
                  <span className="text-sm text-primary-foreground/60">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-primary-foreground/40 line-through">{row.base}</span>
                    <span className={`text-sm font-black ${row.positive ? 'text-amber' : 'text-primary-foreground'}`}>
                      {row.improved}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* Highlight saving */}
            <div className="mt-6 pt-6 border-t border-primary-foreground/10 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary-foreground/40 mb-1">
                    Annual Saving
                  </div>
                  <div className="text-3xl font-black text-amber">
                    {financialData.currency}{(bc.annualSaving / 1000).toFixed(0)}K
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary-foreground/40 mb-1">
                    Payback Period
                  </div>
                  <div className="text-3xl font-black text-amber">
                    {bc.paybackMonths > 0 ? `${bc.paybackMonths.toFixed(1)} mo` : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Pro Forma table */}
        <div className="reveal-item bg-card border border-border rounded-4xl p-8 shadow-card" data-delay="0.2">
          <h3 className="text-base font-black text-foreground mb-6">Cost Pro Forma — Baseline vs Target</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Cost pro forma comparison table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground py-3 pr-4">Cost Category</th>
                  <th className="text-right text-xs font-bold uppercase tracking-widest text-muted-foreground py-3 px-3">Baseline {financialData.currency}K</th>
                  <th className="text-right text-xs font-bold uppercase tracking-widest text-amber py-3 px-3">Target {financialData.currency}K</th>
                  <th className="text-right text-xs font-bold uppercase tracking-widest text-green-600 py-3 pl-3">Saving {financialData.currency}K</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Raw Material Packaging', baseVal: bc.annualSaving * 0.18, pct: 0.18, fixed: false },
                  { label: 'Raw Material Ingredients', baseVal: bc.annualSaving * 0.27, pct: 0.27, fixed: false },
                  { label: 'Direct Labor (Variable)', baseVal: bc.annualSaving * 0.55, pct: 0.55, fixed: false },
                  { label: 'Direct Labor (Fixed Benefits)', baseVal: 0, pct: 0, fixed: true },
                  { label: 'Indirect & Overhead', baseVal: 0, pct: 0, fixed: true },
                ].map((row) => {
                  const saving = row.fixed ? 0 : row.baseVal;
                  const baseline = row.fixed
                    ? (row.label.includes('Labor') ? financialData.directLabor * 0.24 : financialData.overhead)
                    : financialData.cogs * (row.pct * 0.3) + saving;
                  const target = baseline - saving;
                  return (
                    <tr key={row.label} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium text-foreground">{row.label}</td>
                      <td className="text-right py-3 px-3 text-muted-foreground">{baseline.toFixed(0)}</td>
                      <td className="text-right py-3 px-3 font-bold text-amber">{target.toFixed(0)}</td>
                      <td className="text-right py-3 pl-3 font-black text-green-600">
                        {saving > 0 ? `(${saving.toFixed(0)})` : '—'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="py-3 pr-4 font-black text-foreground">Total</td>
                  <td className="text-right py-3 px-3 font-black text-foreground">
                    {financialData.cogs.toFixed(0)}
                  </td>
                  <td className="text-right py-3 px-3 font-black text-amber">
                    {bc.improvedCOGS.toFixed(0)}
                  </td>
                  <td className="text-right py-3 pl-3 font-black text-green-600">
                    ({(bc.annualSaving / 1000).toFixed(0)})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-body">
            Fixed costs (Direct Labor Fixed Benefits, Indirect &amp; Overhead) do not reduce with OEE improvement. Only variable cost components are affected.
          </p>
        </div>
      </div>
    </section>
  );
}
