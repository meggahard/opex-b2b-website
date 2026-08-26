'use client';
import React, { useState } from 'react';
import type { FinancialData, CurrencyCode, ReportingPeriod } from './CalculatorSection';
import { CURRENCY_SYMBOLS, PERIOD_MULTIPLIER, COMMON_UOMS } from './CalculatorSection';

interface Props {
  data: FinancialData;
  onChange: (d: FinancialData) => void;
}

const currencies: CurrencyCode[] = ['ZAR', 'USD', 'GBP', 'EUR'];
const periods: ReportingPeriod[] = ['Annual', 'Quarterly', 'Monthly'];

function NumInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {hint && <div className="text-xs text-muted-foreground mb-1">{hint}</div>}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-muted-foreground text-sm font-bold pointer-events-none">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="input-field"
          style={{ paddingLeft: prefix ? '2rem' : undefined, paddingRight: suffix ? '3rem' : undefined }}
          aria-label={label}
        />
        {suffix && (
          <span className="absolute right-3 text-muted-foreground text-xs font-bold pointer-events-none">{suffix}</span>
        )}
      </div>
    </div>
  );
}

/** Read-only display field — shows a calculated value, not editable */
function CalcField({
  label,
  value,
  prefix,
  suffix,
  hint,
  highlight,
}: {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="input-label flex items-center gap-1.5">
        {label}
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber bg-amber/10 px-1.5 py-0.5 rounded-full">
          Auto
        </span>
      </label>
      {hint && <div className="text-xs text-muted-foreground mb-1">{hint}</div>}
      <div
        className={`relative flex items-center rounded-2xl border px-3 py-2.5 ${
          highlight
            ? 'bg-amber/5 border-amber/30' :'bg-muted/40 border-border/60'
        }`}
      >
        {prefix && (
          <span className="text-muted-foreground text-sm font-bold mr-1">{prefix}</span>
        )}
        <span className={`text-sm font-black flex-1 ${highlight ? 'text-amber' : 'text-foreground'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {suffix && (
          <span className="text-muted-foreground text-xs font-bold ml-1">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export default function FinancialInputModule({ data, onChange }: Props) {
  const [showBalanceSheet, setShowBalanceSheet] = useState(false);
  const [showUOMDropdown, setShowUOMDropdown] = useState(false);

  const sym = data.currencySymbol || CURRENCY_SYMBOLS[data.currency] || 'R';
  const periodLabel = data.reportingPeriod || 'Annual';
  const multiplier = PERIOD_MULTIPLIER[periodLabel];

  const update = (key: keyof FinancialData, val: number | string) => {
    const updated = { ...data, [key]: val };

    // ── Auto-calculate Total COGS ──
    const totalCOGS = updated.rawMaterials + updated.directLabor + updated.overhead;
    updated.cogs = totalCOGS;

    // ── Auto-calculate Total OpEx ──
    const totalOpEx = updated.gaExpenses + updated.salesMarketing + (updated.otherOperatingCosts ?? 0);
    updated.operatingExpenses = totalOpEx;

    // ── Auto-calculate Net Income / EBIT ──
    updated.netIncome = updated.revenue - totalCOGS - totalOpEx;

    // ── Auto-calculate Balance Sheet totals ──
    const totalAssets = updated.currentAssets + updated.fixedAssets;
    updated.totalAssets = totalAssets;
    updated.totalEquity = totalAssets - updated.currentLiabilities;

    onChange(updated);
  };

  const handleCurrencyChange = (c: CurrencyCode) => {
    onChange({ ...data, currency: c, currencySymbol: CURRENCY_SYMBOLS[c] });
  };

  const handlePeriodChange = (p: ReportingPeriod) => {
    onChange({ ...data, reportingPeriod: p });
  };

  // ── Derived display values (all from calculated fields) ──
  const totalCOGS = data.rawMaterials + data.directLabor + data.overhead;
  const totalOpEx = data.gaExpenses + data.salesMarketing + (data.otherOperatingCosts ?? 0);
  const netIncome = data.revenue - totalCOGS - totalOpEx;
  const grossProfit = data.revenue - totalCOGS;
  const grossMargin = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;
  const ebitMargin = data.revenue > 0 ? (netIncome / data.revenue) * 100 : 0;
  const costPerUnit = data.unitsProduced > 0 ? (totalCOGS * 1000) / data.unitsProduced : 0;

  // Balance Sheet derived
  const totalAssets = data.currentAssets + data.fixedAssets;
  const totalEquity = totalAssets - data.currentLiabilities;
  const assetTurnover = totalAssets > 0 ? data.revenue / totalAssets : 0;

  const periodSuffix = periodLabel === 'Annual' ? '/yr' : periodLabel === 'Quarterly' ? '/qtr' : '/mo';

  return (
    <section
      id="calculator"
      className="section-pad bg-background"
      aria-labelledby="financial-input-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 reveal-item">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                Step 1 of 3
              </span>
              <h2 id="financial-input-heading" className="text-section-xl font-black text-foreground">
                Enter Your Financial Data
              </h2>
              <p className="text-muted-foreground mt-2 font-body">
                Use your P&amp;L data. All fields are pre-filled with example values. Values in thousands (000s).
              </p>
            </div>
            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
              {/* Reporting Period */}
              <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      periodLabel === p
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-pressed={periodLabel === p}
                    aria-label={`${p} reporting period`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {/* Currency toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-full p-1">
                {currencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCurrencyChange(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      data.currency === c
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-pressed={data.currency === c}
                    aria-label={`Select ${c} currency`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Period info banner */}
          {periodLabel !== 'Annual' && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber/10 border border-amber/20 rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-amber" />
              <span className="text-xs font-bold text-amber">
                {periodLabel} mode — enter {periodLabel.toLowerCase()} figures. Annual equivalent = input × {multiplier}
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Input columns */}
          <div className="lg:col-span-8 space-y-8">
            {/* Revenue */}
            <div className="reveal-item bg-card border border-border rounded-4xl p-8 shadow-card" data-delay="0.1">
              <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber/20 text-amber text-xs font-black flex items-center justify-center">R</span>
                Revenue
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                <NumInput
                  label={`Revenue (${periodSuffix})`}
                  value={data.revenue}
                  onChange={(v) => update('revenue', v)}
                  prefix={sym}
                  suffix="000"
                  hint={`${periodLabel} P&L top line`}
                />
                <NumInput
                  label={`Units Produced (${periodSuffix})`}
                  value={data.unitsProduced}
                  onChange={(v) => update('unitsProduced', v)}
                  hint="Total production units"
                />
                {/* UOM with dropdown */}
                <div className="md:col-span-2">
                  <label className="input-label">Unit of Measure</label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={data.unitOfMeasure}
                        onChange={(e) => update('unitOfMeasure', e.target.value)}
                        placeholder="e.g. Unit, Case, Tonne"
                        className="input-field flex-1"
                        aria-label="Unit of measure"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUOMDropdown(!showUOMDropdown)}
                        className="px-4 py-2 bg-muted border border-border rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        aria-label="Select common unit of measure"
                      >
                        Common
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showUOMDropdown ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                    {showUOMDropdown && (
                      <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-2xl shadow-card overflow-hidden w-48">
                        {COMMON_UOMS.map((uom) => (
                          <button
                            key={uom}
                            type="button"
                            onClick={() => { update('unitOfMeasure', uom); setShowUOMDropdown(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors ${data.unitOfMeasure === uom ? 'text-primary bg-primary/5' : 'text-foreground'}`}
                          >
                            {uom}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* COGS */}
            <div className="reveal-item bg-card border border-border rounded-4xl p-8 shadow-card" data-delay="0.15">
              <h3 className="text-lg font-black text-foreground mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">C</span>
                Cost of Goods Sold (COGS)
              </h3>
              <p className="text-xs text-muted-foreground mb-5 font-body">
                Enter the three cost components below. Total COGS is automatically calculated.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                <NumInput label={`Raw Materials (${periodSuffix})`} value={data.rawMaterials} onChange={(v) => update('rawMaterials', v)} prefix={sym} suffix="000" hint="Direct material costs" />
                <NumInput label={`Direct Labor (${periodSuffix})`} value={data.directLabor} onChange={(v) => update('directLabor', v)} prefix={sym} suffix="000" hint="Production labor costs" />
                <NumInput label={`Manufacturing Overhead (${periodSuffix})`} value={data.overhead} onChange={(v) => update('overhead', v)} prefix={sym} suffix="000" hint="Factory overhead" />
                <CalcField
                  label={`Total COGS (${periodSuffix})`}
                  value={totalCOGS.toLocaleString()}
                  prefix={sym}
                  suffix="000"
                  hint="Raw Materials + Direct Labor + Overhead"
                  highlight
                />
              </div>
              {/* Gross margin derived — live synced */}
              <div className="mt-4 flex flex-wrap items-center gap-3 bg-muted/50 rounded-2xl px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Derived Gross Margin</span>
                <span className={`text-lg font-black ${grossMargin > 30 ? 'text-green-600' : grossMargin > 15 ? 'text-amber' : 'text-red-500'}`}>
                  {grossMargin.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ({sym}{grossProfit.toLocaleString()}K)
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  Cost/Unit: <strong className="text-foreground">{sym}{costPerUnit.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="reveal-item bg-card border border-border rounded-4xl p-8 shadow-card" data-delay="0.2">
              <h3 className="text-lg font-black text-foreground mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary text-xs font-black flex items-center justify-center">O</span>
                Operating Expenses
              </h3>
              <p className="text-xs text-muted-foreground mb-5 font-body">
                Enter the three OpEx components. Total OpEx and Net Income are automatically calculated.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                <NumInput label={`G&A Expenses (${periodSuffix})`} value={data.gaExpenses} onChange={(v) => update('gaExpenses', v)} prefix={sym} suffix="000" hint="General & Administrative" />
                <NumInput label={`Sales & Marketing (${periodSuffix})`} value={data.salesMarketing} onChange={(v) => update('salesMarketing', v)} prefix={sym} suffix="000" hint="Sales & marketing costs" />
                <NumInput
                  label={`Other Operating Costs (${periodSuffix})`}
                  value={data.otherOperatingCosts ?? 0}
                  onChange={(v) => update('otherOperatingCosts', v)}
                  prefix={sym}
                  suffix="000"
                  hint="Other operating expenses"
                />
                <CalcField
                  label={`Total OpEx (${periodSuffix})`}
                  value={totalOpEx.toLocaleString()}
                  prefix={sym}
                  suffix="000"
                  hint="G&A + Sales & Marketing + Other"
                  highlight
                />
              </div>
              {/* EBIT derived */}
              <div className="mt-4 flex flex-wrap items-center gap-4 bg-muted/50 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Net Income / EBIT</span>
                  <span className={`text-lg font-black ${netIncome > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {sym}{netIncome.toLocaleString()}K
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">EBIT Margin</span>
                  <span className={`text-lg font-black ${ebitMargin > 10 ? 'text-green-600' : ebitMargin > 0 ? 'text-amber' : 'text-red-500'}`}>
                    {ebitMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Balance Sheet toggle */}
            <div className="reveal-item" data-delay="0.25">
              <button
                onClick={() => setShowBalanceSheet(!showBalanceSheet)}
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                aria-expanded={showBalanceSheet}
                aria-controls="balance-sheet-fields"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-300 ${showBalanceSheet ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {showBalanceSheet ? 'Hide' : 'Add'} Balance Sheet Data (for DuPont ratios)
              </button>
              {showBalanceSheet && (
                <div id="balance-sheet-fields" className="mt-4 bg-card border border-border rounded-4xl p-8 shadow-card">
                  <h3 className="text-lg font-black text-foreground mb-2">Balance Sheet</h3>
                  <p className="text-xs text-muted-foreground mb-5 font-body">
                    Enter Current Assets, Fixed Assets, and Current Liabilities. Total Assets and Total Equity are automatically calculated.
                  </p>
                  <div className="grid md:grid-cols-2 gap-5">
                    <NumInput label={`Current Assets (${periodSuffix})`} value={data.currentAssets} onChange={(v) => update('currentAssets', v)} prefix={sym} suffix="000" hint="Cash, receivables, inventory" />
                    <NumInput label={`Fixed Assets / Net PP&E (${periodSuffix})`} value={data.fixedAssets} onChange={(v) => update('fixedAssets', v)} prefix={sym} suffix="000" hint="Property, plant & equipment" />
                    <CalcField
                      label={`Total Assets (${periodSuffix})`}
                      value={totalAssets.toLocaleString()}
                      prefix={sym}
                      suffix="000"
                      hint="Current Assets + Fixed Assets"
                      highlight
                    />
                    <NumInput label={`Current Liabilities (${periodSuffix})`} value={data.currentLiabilities} onChange={(v) => update('currentLiabilities', v)} prefix={sym} suffix="000" hint="Short-term obligations" />
                    <CalcField
                      label={`Total Equity (${periodSuffix})`}
                      value={totalEquity.toLocaleString()}
                      prefix={sym}
                      suffix="000"
                      hint="Total Assets − Current Liabilities"
                      highlight
                    />
                    <NumInput label="Implementation Budget" value={data.implementationCost} onChange={(v) => update('implementationCost', v)} prefix={sym} suffix="000" hint="Default: R45K (Foundry Starter)" />
                  </div>
                  {/* DuPont live preview — all from calculated totals */}
                  <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Net Profit Margin', value: `${data.revenue > 0 ? (netIncome / data.revenue * 100).toFixed(2) : '0.00'}%` },
                      { label: 'Asset Turnover', value: `${assetTurnover.toFixed(2)}x` },
                      { label: 'Equity Multiplier', value: `${totalEquity > 0 ? (totalAssets / totalEquity).toFixed(2) : '—'}x` },
                      { label: 'ROE', value: `${totalEquity > 0 && totalAssets > 0 ? ((netIncome / data.revenue) * (data.revenue / totalAssets) * (totalAssets / totalEquity) * 100).toFixed(2) : '—'}%` },
                    ].map((r) => (
                      <div key={r.label} className="bg-muted/50 rounded-2xl p-3 text-center">
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{r.label}</div>
                        <div className="text-base font-black text-foreground">{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — live summary */}
          <div className="lg:col-span-4 reveal-item" data-delay="0.1">
            <div className="sticky top-28 space-y-4">
              <div className="bg-primary rounded-4xl p-6 text-primary-foreground">
                <div className="text-xs font-bold uppercase tracking-widest text-primary-foreground/50 mb-1">
                  Live P&L Summary
                </div>
                <div className="text-xs text-primary-foreground/30 mb-4">{periodLabel} figures ({sym}000s)</div>
                {[
                  { label: 'Revenue', value: data.revenue, bold: false },
                  { label: 'COGS', value: -totalCOGS, bold: false },
                  { label: 'Gross Profit', value: grossProfit, bold: true },
                  { label: 'Operating Expenses', value: -totalOpEx, bold: false },
                  { label: 'EBIT', value: netIncome, bold: true },
                ].map((row) => (
                  <div key={row.label} className={`flex justify-between py-2 ${row.bold ? 'border-t border-primary-foreground/10 mt-1 pt-3' : ''}`}>
                    <span className={`text-sm ${row.bold ? 'font-black text-primary-foreground' : 'text-primary-foreground/60'}`}>
                      {row.label}
                    </span>
                    <span className={`text-sm font-black ${row.value < 0 ? 'text-red-400' : row.bold ? 'text-amber' : 'text-primary-foreground'}`}>
                      {row.value < 0 ? '-' : ''}{sym}{Math.abs(row.value).toLocaleString()}K
                    </span>
                  </div>
                ))}
              </div>

              {/* Key Ratios — live synced from calculated totals */}
              <div className="bg-card border border-border rounded-4xl p-6 shadow-card">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Key Ratios</div>
                <div className="space-y-3">
                  {[
                    { label: 'Gross Margin', value: `${grossMargin.toFixed(1)}%`, color: grossMargin > 30 ? 'text-green-600' : grossMargin > 15 ? 'text-amber' : 'text-red-500' },
                    { label: 'EBIT Margin', value: `${ebitMargin.toFixed(1)}%`, color: ebitMargin > 10 ? 'text-green-600' : ebitMargin > 0 ? 'text-amber' : 'text-red-500' },
                    { label: 'Cost/Unit', value: `${sym}${costPerUnit.toFixed(2)}`, color: 'text-foreground' },
                    { label: 'Asset Turnover', value: `${assetTurnover.toFixed(2)}x`, color: 'text-foreground' },
                  ].map((ratio) => (
                    <div key={ratio.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{ratio.label}</span>
                      <span className={`text-sm font-black ${ratio.color}`}>{ratio.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-muted/30 rounded-3xl p-4">
                <p className="text-xs text-muted-foreground leading-relaxed font-body">
                  <strong className="text-foreground">Note:</strong> All values in thousands ({sym}000s). Ratios update live as you type. Balance Sheet data unlocks DuPont analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
