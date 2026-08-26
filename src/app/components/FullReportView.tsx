'use client';
import React, { useMemo, useRef, useCallback, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { FinancialData, OEEData, LeadData } from './CalculatorSection';
import DuPontTree from './DuPontTree';

interface Props {
  financialData: FinancialData;
  oeeData: OEEData;
  leadData: LeadData;
}

function computeReport(fd: FinancialData, od: OEEData) {
  // ── Derive A/P/Q from granular inputs ──
  const derivedAvailability = od.scheduledHours > 0
    ? Math.min(100, Math.max(0, ((od.scheduledHours - od.plannedDowntime - od.unplannedDowntime) / od.scheduledHours) * 100))
    : od.availability;
  const derivedPerformance = od.targetRate > 0
    ? Math.min(100, Math.max(0, (od.actualRate / od.targetRate) * 100))
    : od.performance;
  const derivedQuality = od.totalUnits > 0
    ? Math.min(100, Math.max(0, ((od.totalUnits - od.qualityLossUnits) / od.totalUnits) * 100))
    : od.quality;

  const safeTargetAvailability = Math.max(od.targetAvailability, derivedAvailability);
  const safeTargetPerformance = Math.max(od.targetPerformance, derivedPerformance);
  const safeTargetQuality = Math.max(od.targetQuality, derivedQuality);

  const baseOEE = (derivedAvailability / 100) * (derivedPerformance / 100) * (derivedQuality / 100) * 100;
  const targetOEE = (safeTargetAvailability / 100) * (safeTargetPerformance / 100) * (safeTargetQuality / 100) * 100;
  const oeeDelta = targetOEE - baseOEE;

  const baseCOGS = fd.cogs * 1000;
  const annualSaving = Math.max(0, baseCOGS * (oeeDelta / 100) * 0.65);

  // Gross margin — from calculated COGS
  const grossProfit = fd.revenue - fd.cogs;
  const baseGM = fd.revenue > 0 ? (grossProfit / fd.revenue) * 100 : 0;
  const improvedCOGS = (baseCOGS - annualSaving) / 1000;
  const improvedGM = fd.revenue > 0 ? ((fd.revenue - improvedCOGS) / fd.revenue) * 100 : 0;

  // EBIT — from calculated operatingExpenses
  const ebit = fd.revenue - fd.cogs - fd.operatingExpenses;
  const ebitMargin = fd.revenue > 0 ? (ebit / fd.revenue) * 100 : 0;

  // Net profit margin — from calculated netIncome
  const baseNPM = fd.revenue > 0 ? (fd.netIncome / fd.revenue) * 100 : 0;
  const improvedNetIncome = fd.netIncome + annualSaving / 1000;
  const improvedNPM = fd.revenue > 0 ? (improvedNetIncome / fd.revenue) * 100 : 0;

  // Asset turnover — from calculated totalAssets
  const baseAT = fd.totalAssets > 0 ? fd.revenue / fd.totalAssets : 0;
  const improvedAT = baseAT;

  // Equity multiplier — from calculated totalEquity
  const equityMult = fd.totalEquity > 0 ? fd.totalAssets / fd.totalEquity : 0;

  // ROE = NPM × AT × EM
  const baseROE = equityMult > 0 ? (baseNPM / 100) * baseAT * equityMult * 100 : 0;
  const improvedROE = equityMult > 0 ? (improvedNPM / 100) * improvedAT * equityMult * 100 : 0;

  // RONA = Net Income / (Fixed Assets + NWC)
  const nwc = fd.currentAssets - fd.currentLiabilities;
  const capitalEmployed = fd.fixedAssets + Math.max(0, nwc);
  const baseRONA = capitalEmployed > 0 ? (fd.netIncome / capitalEmployed) * 100 : 0;
  const improvedRONA = capitalEmployed > 0 ? (improvedNetIncome / capitalEmployed) * 100 : 0;

  // Cost per unit
  const baseCostPerUnit = fd.unitsProduced > 0 ? baseCOGS / fd.unitsProduced : 0;
  const targetCostPerUnit = fd.unitsProduced > 0 && baseOEE > 0 && targetOEE > 0
    ? baseCostPerUnit * (baseOEE / targetOEE)
    : baseCostPerUnit;

  const paybackMonths = annualSaving > 0 ? (fd.implementationCost * 1000) / (annualSaving / 12) : 0;

  const rmPackagingSaving = annualSaving * 0.18;
  const rmIngredientsSaving = annualSaving * 0.27;
  const dlVariableSaving = annualSaving * 0.55;

  const paybackData = Array.from({ length: 13 }, (_, i) => ({
    month: `M${i}`,
    cumulativeSaving: (annualSaving / 12) * i,
    implementationCost: fd.implementationCost * 1000,
  }));

  const fiveYearNPV = annualSaving * 4.33 - fd.implementationCost * 1000;

  // ROI metrics
  const roi = fd.implementationCost > 0 ? ((annualSaving - fd.implementationCost * 1000) / (fd.implementationCost * 1000)) * 100 : 0;
  const threeYearReturn = annualSaving * 3 - fd.implementationCost * 1000;
  const fiveYearReturn = annualSaving * 5 - fd.implementationCost * 1000;

  return {
    baseOEE, targetOEE, oeeDelta,
    baseGM, improvedGM,
    ebitMargin,
    baseNPM, improvedNPM,
    baseAT, improvedAT,
    baseROE, improvedROE,
    baseRONA, improvedRONA,
    equityMult,
    annualSaving, paybackMonths,
    rmPackagingSaving, rmIngredientsSaving, dlVariableSaving,
    paybackData, fiveYearNPV,
    improvedCOGS, improvedNetIncome,
    baseCOGS,
    baseCostPerUnit, targetCostPerUnit,
    roi, threeYearReturn, fiveYearReturn,
    derivedAvailability, derivedPerformance, derivedQuality,
    safeTargetAvailability, safeTargetPerformance, safeTargetQuality,
  };
}

const PaybackTooltip = ({ active, payload, label, sym }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string; sym?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-3 shadow-card text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="font-black" style={{ color: p.name === 'cumulativeSaving' ? '#22C55E' : '#EF4444' }}>
            {p.name === 'cumulativeSaving' ? 'Cumulative Saving' : 'Implementation Cost'}: {sym || 'R'}{(p.value / 1000).toFixed(0)}K
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FullReportView({ financialData, oeeData, leadData }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const r = useMemo(() => computeReport(financialData, oeeData), [financialData, oeeData]);
  const [downloading, setDownloading] = useState(false);
  const sym = financialData.currencySymbol || 'R';

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = margin;

      const addPage = () => {
        doc.addPage();
        y = margin;
      };

      const checkPage = (needed: number) => {
        if (y + needed > pageH - margin) addPage();
      };

      // ── Cover ──
      doc.setFillColor(11, 25, 41);
      doc.rect(0, 0, pageW, 60, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('OpEx', margin, 22);
      doc.setTextColor(201, 162, 39);
      doc.setFontSize(18);
      doc.text('Strategy', margin + 28, 22);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Financial Impact Report', margin, 32);
      doc.text('1st Floor, Block B, Black River Park, 2 Fir Street, Observatory, Cape Town, 7925', margin, 39);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(leadData.company, margin, 52);

      y = 70;

      // Prepared for — company name + contact name + job title
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Prepared for: ${leadData.company} · ${leadData.firstName} ${leadData.lastName} · ${leadData.jobTitle}`,
        margin, y
      );
      doc.text(`Date: ${dateStr}`, margin, y + 6);
      y += 18;

      // ── Key Metrics ──
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');
      const kpis = [
        { label: 'Annual Saving', value: `${sym}${(r.annualSaving / 1000).toFixed(0)}K` },
        { label: 'OEE Improvement', value: `+${r.oeeDelta.toFixed(1)}pp` },
        { label: 'Payback Period', value: r.paybackMonths > 0 ? `${r.paybackMonths.toFixed(1)} mo` : '—' },
        { label: '5-Year NPV', value: `${sym}${(r.fiveYearNPV / 1000).toFixed(0)}K` },
      ];
      kpis.forEach((kpi, i) => {
        const x = margin + (contentW / 4) * i + contentW / 8;
        doc.setTextColor(201, 162, 39);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.value, x, y + 12, { align: 'center' });
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.label, x, y + 20, { align: 'center' });
      });
      y += 36;

      // ── Section 1: OEE Baseline ──
      checkPage(50);
      doc.setTextColor(11, 25, 41);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. OEE Baseline', margin, y);
      y += 8;

      const oeeItems = [
        { label: 'Availability', value: r.derivedAvailability },
        { label: 'Performance', value: r.derivedPerformance },
        { label: 'Quality', value: r.derivedQuality },
        { label: 'Composite OEE', value: r.baseOEE },
        { label: 'Target OEE', value: r.targetOEE },
      ];
      oeeItems.forEach((item) => {
        checkPage(10);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, margin, y);
        doc.setTextColor(11, 25, 41);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.value.toFixed(1)}%`, margin + 80, y);
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(margin + 100, y - 4, 60, 4, 1, 1, 'F');
        doc.setFillColor(item.value >= 80 ? 34 : item.value >= 60 ? 245 : 239, item.value >= 80 ? 197 : item.value >= 60 ? 158 : 68, item.value >= 80 ? 94 : item.value >= 60 ? 11 : 68);
        doc.roundedRect(margin + 100, y - 4, Math.min(60, item.value * 0.6), 4, 1, 1, 'F');
        y += 9;
      });
      y += 6;

      // ── Section 2: P&L Summary ──
      checkPage(60);
      doc.setTextColor(11, 25, 41);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. P&L Summary', margin, y);
      y += 8;

      const plRows = [
        { label: 'Revenue', value: `${sym}${financialData.revenue.toLocaleString()}K`, bold: false },
        { label: 'COGS', value: `(${sym}${financialData.cogs.toLocaleString()}K)`, bold: false },
        { label: 'Gross Profit', value: `${sym}${(financialData.revenue - financialData.cogs).toFixed(0)}K`, bold: true },
        { label: 'Gross Margin', value: `${r.baseGM.toFixed(1)}%`, bold: false },
        { label: 'EBIT', value: `${sym}${(financialData.revenue - financialData.cogs - financialData.operatingExpenses).toFixed(0)}K`, bold: true },
        { label: 'EBIT Margin', value: `${r.ebitMargin.toFixed(1)}%`, bold: false },
        { label: 'Net Income', value: `${sym}${financialData.netIncome.toFixed(0)}K`, bold: true },
      ];
      plRows.forEach((row) => {
        checkPage(8);
        if (row.bold) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 5, contentW, 8, 'F');
        }
        doc.setTextColor(row.bold ? 11 : 100, row.bold ? 25 : 116, row.bold ? 41 : 139);
        doc.setFontSize(9);
        doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
        doc.text(row.label, margin + 2, y);
        doc.text(row.value, pageW - margin - 2, y, { align: 'right' });
        y += 8;
      });
      y += 6;

      // ── Section 3: Key Ratios ──
      checkPage(40);
      doc.setTextColor(11, 25, 41);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Key Ratios', margin, y);
      y += 8;

      const ratios = [
        { label: 'Gross Margin', base: `${r.baseGM.toFixed(1)}%`, improved: `${r.improvedGM.toFixed(1)}%` },
        { label: 'EBIT Margin', base: `${r.ebitMargin.toFixed(1)}%`, improved: `${r.ebitMargin.toFixed(1)}%` },
        { label: 'Net Profit Margin', base: `${r.baseNPM.toFixed(2)}%`, improved: `${r.improvedNPM.toFixed(2)}%` },
        { label: 'Asset Turnover', base: `${r.baseAT.toFixed(2)}x`, improved: `${r.improvedAT.toFixed(2)}x` },
        { label: 'ROE', base: `${r.baseROE.toFixed(2)}%`, improved: `${r.improvedROE.toFixed(2)}%` },
        { label: 'RONA', base: `${r.baseRONA.toFixed(2)}%`, improved: `${r.improvedRONA.toFixed(2)}%` },
        { label: `Cost/${financialData.unitOfMeasure}`, base: `${sym}${r.baseCostPerUnit.toFixed(2)}`, improved: `${sym}${r.targetCostPerUnit.toFixed(2)}` },
      ];

      doc.setFillColor(30, 58, 95);
      doc.rect(margin, y - 5, contentW, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Ratio', margin + 2, y);
      doc.text('Baseline', margin + 100, y);
      doc.text('Target', margin + 140, y);
      y += 8;

      ratios.forEach((ratio, i) => {
        checkPage(8);
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 5, contentW, 8, 'F');
        }
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(ratio.label, margin + 2, y);
        doc.setTextColor(11, 25, 41);
        doc.text(ratio.base, margin + 100, y);
        doc.setTextColor(201, 162, 39);
        doc.setFont('helvetica', 'bold');
        doc.text(ratio.improved, margin + 140, y);
        y += 8;
      });
      y += 6;

      // ── Section 4: Savings Breakdown ──
      checkPage(50);
      doc.setTextColor(11, 25, 41);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Savings Breakdown', margin, y);
      y += 8;

      const savings = [
        { label: 'RM Packaging', value: r.rmPackagingSaving },
        { label: 'RM Ingredients', value: r.rmIngredientsSaving },
        { label: 'Direct Labor (Variable)', value: r.dlVariableSaving },
        { label: 'Direct Labor (Fixed Benefits)', value: 0, fixed: true },
        { label: 'Indirect & Overhead', value: 0, fixed: true },
      ];

      savings.forEach((item) => {
        checkPage(8);
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, margin + 2, y);
        if (item.fixed) {
          doc.setTextColor(150, 150, 150);
          doc.text('No change (fixed)', pageW - margin - 2, y, { align: 'right' });
        } else {
          doc.setTextColor(34, 197, 94);
          doc.setFont('helvetica', 'bold');
          doc.text(`${sym}${(item.value / 1000).toFixed(0)}K`, pageW - margin - 2, y, { align: 'right' });
        }
        y += 8;
      });

      checkPage(12);
      doc.setFillColor(245, 158, 11);
      doc.rect(margin, y - 5, contentW, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Annual Saving', margin + 2, y + 1);
      doc.text(`${sym}${(r.annualSaving / 1000).toFixed(0)}K`, pageW - margin - 2, y + 1, { align: 'right' });
      y += 16;

      // ── Section 5: ROI Analysis ──
      checkPage(70);
      doc.setTextColor(11, 25, 41);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('5. ROI & Investment Analysis', margin, y);
      y += 8;

      // ROI summary box
      doc.setFillColor(11, 25, 41);
      doc.roundedRect(margin, y, contentW, 32, 3, 3, 'F');
      const roiKpis = [
        { label: 'Implementation Cost', value: `${sym}${financialData.implementationCost}K` },
        { label: 'Annual Saving', value: `${sym}${(r.annualSaving / 1000).toFixed(0)}K` },
        { label: 'Payback Period', value: r.paybackMonths > 0 ? `${r.paybackMonths.toFixed(1)} mo` : '—' },
        { label: 'Year-1 ROI', value: `${r.roi.toFixed(0)}%` },
      ];
      roiKpis.forEach((kpi, i) => {
        const x = margin + (contentW / 4) * i + contentW / 8;
        doc.setTextColor(201, 162, 39);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.value, x, y + 14, { align: 'center' });
        doc.setTextColor(150, 170, 200);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.label, x, y + 22, { align: 'center' });
      });
      y += 40;

      // Multi-year return table
      const returnRows = [
        { label: 'Year 1 Net Return', value: r.annualSaving - financialData.implementationCost * 1000 },
        { label: '3-Year Cumulative Return', value: r.threeYearReturn },
        { label: '5-Year Cumulative Return', value: r.fiveYearReturn },
        { label: '5-Year NPV (disc. factor 4.33)', value: r.fiveYearNPV },
      ];
      returnRows.forEach((row, i) => {
        checkPage(8);
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 5, contentW, 8, 'F');
        }
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(row.label, margin + 2, y);
        doc.setTextColor(row.value >= 0 ? 34 : 239, row.value >= 0 ? 197 : 68, row.value >= 0 ? 94 : 68);
        doc.setFont('helvetica', 'bold');
        doc.text(`${sym}${(row.value / 1000).toFixed(0)}K`, pageW - margin - 2, y, { align: 'right' });
        y += 8;
      });
      y += 6;

      // ── Footer ──
      const totalPages = (doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageH - 12, pageW, 12, 'F');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('OpEx Strategy · 1st Floor, Block B, Black River Park, 2 Fir Street, Observatory, Cape Town, 7925', margin, pageH - 5);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 5, { align: 'right' });
      }

      doc.save(`OpExStrategy_FinancialImpactReport_${leadData.company.replace(/\s+/g, '_')}_${today.getFullYear()}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setDownloading(false);
    }
  }, [financialData, oeeData, leadData, r, sym, dateStr, today]);

  return (
    <section
      id="full-report"
      className="section-pad bg-background"
      aria-labelledby="full-report-heading"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Report controls */}
        <div className="flex items-center justify-between mb-8 no-print">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
              Financial Impact Report
            </span>
            <h2 id="full-report-heading" className="text-2xl font-black text-foreground">
              {leadData.company} — Full Report
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="btn-primary"
              aria-label="Download report as PDF"
            >
              {downloading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download My Report
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="btn-dark"
              aria-label="Print or save as PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / PDF
            </button>
          </div>
        </div>

        {/* Report document */}
        <div ref={reportRef} className="space-y-8 print-report">
          {/* Cover / Executive Summary */}
          <div
            className="rounded-4xl p-10 text-primary-foreground relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0B1929 0%, #1E3A5F 100%)' }}
          >
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-primary-foreground/50 text-xs font-bold uppercase tracking-widest mb-2">
                    Financial Impact Report
                  </p>
                  <h3 className="text-3xl font-black text-primary-foreground">{leadData.company}</h3>
                  {/* Company name + contact name + job title */}
                  <p className="text-primary-foreground/60 text-sm mt-1">
                    {leadData.company} · {leadData.firstName} {leadData.lastName} · {leadData.jobTitle} · {dateStr}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-primary-foreground/40 text-xs font-bold uppercase tracking-widest">Powered by</p>
                  <p className="text-amber font-black text-lg">OpEx Strategy</p>
                  <p className="text-primary-foreground/40 text-xs">ERPNext + openMES</p>
                </div>
              </div>

              {/* 3 key numbers */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Annual Saving', value: `${sym}${(r.annualSaving / 1000).toFixed(0)}K`, sub: 'at target OEE' },
                  { label: 'OEE Improvement', value: `+${r.oeeDelta.toFixed(1)}pp`, sub: `${r.baseOEE.toFixed(1)}% → ${r.targetOEE.toFixed(1)}%` },
                  { label: 'Payback Period', value: `${r.paybackMonths > 0 ? r.paybackMonths.toFixed(1) : '—'} mo`, sub: `on ${sym}${financialData.implementationCost}K investment` },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-primary-foreground/5 rounded-3xl p-5 border border-primary-foreground/10 text-center">
                    <div className="text-3xl font-black text-amber mb-1">{kpi.value}</div>
                    <div className="text-sm font-bold text-primary-foreground mb-1">{kpi.label}</div>
                    <div className="text-xs text-primary-foreground/50">{kpi.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 1: Current State Analysis */}
          <div className="bg-card border border-border rounded-4xl p-8 shadow-card">
            <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-black flex items-center justify-center">1</span>
              Current State Analysis
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              {/* OEE breakdown */}
              <div>
                <h4 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest">OEE Baseline</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Availability', value: r.derivedAvailability, color: '#3B82F6' },
                    { label: 'Performance', value: r.derivedPerformance, color: '#8B5CF6' },
                    { label: 'Quality', value: r.derivedQuality, color: '#22C55E' },
                    { label: 'OEE (composite)', value: r.baseOEE, color: r.baseOEE < 60 ? '#EF4444' : r.baseOEE < 80 ? '#F59E0B' : '#22C55E' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-black" style={{ color: item.color }}>{item.value.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.value}%`, backgroundColor: item.color, transition: 'width 0.8s ease' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-muted/50 rounded-2xl px-4 py-3 flex justify-between">
                  <span className="text-xs font-bold text-muted-foreground">World-class benchmark</span>
                  <span className="text-xs font-black text-foreground">85% OEE</span>
                </div>
              </div>

              {/* P&L summary */}
              <div>
                <h4 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest">P&L Summary</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Revenue', value: `${sym}${financialData.revenue.toLocaleString()}K`, indent: false, bold: false },
                    { label: 'COGS', value: `(${sym}${financialData.cogs.toLocaleString()}K)`, indent: false, bold: false, negative: true },
                    { label: 'Gross Profit', value: `${sym}${(financialData.revenue - financialData.cogs).toFixed(0)}K`, indent: false, bold: true },
                    { label: 'Gross Margin', value: `${r.baseGM.toFixed(1)}%`, indent: true, bold: false },
                    { label: 'Operating Expenses', value: `(${sym}${financialData.operatingExpenses.toLocaleString()}K)`, indent: false, bold: false, negative: true },
                    { label: 'EBIT', value: `${sym}${(financialData.revenue - financialData.cogs - financialData.operatingExpenses).toFixed(0)}K`, indent: false, bold: true },
                    { label: 'EBIT Margin', value: `${r.ebitMargin.toFixed(1)}%`, indent: true, bold: false },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className={`flex justify-between items-center py-2 ${row.bold ? 'border-t border-border font-black' : ''} ${row.indent ? 'pl-4' : ''}`}
                    >
                      <span className={`text-sm ${row.bold ? 'text-foreground' : 'text-muted-foreground'}`}>{row.label}</span>
                      <span className={`text-sm font-black ${row.negative ? 'text-red-500' : row.bold ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Ratios — from calculated totals */}
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Gross Margin', value: `${r.baseGM.toFixed(1)}%` },
                { label: 'EBIT Margin', value: `${r.ebitMargin.toFixed(1)}%` },
                { label: `Cost/${financialData.unitOfMeasure}`, value: `${sym}${r.baseCostPerUnit.toFixed(2)}` },
                { label: 'Asset Turnover', value: `${r.baseAT.toFixed(2)}x` },
              ].map((ratio) => (
                <div key={ratio.label} className="bg-muted/50 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{ratio.label}</div>
                  <div className="text-xl font-black text-foreground">{ratio.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Improved State */}
          <div
            className="rounded-4xl p-8 text-primary-foreground relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0B1929 0%, #1E3A5F 100%)' }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <h3 className="text-xl font-black text-primary-foreground mb-6 flex items-center gap-2 relative z-10">
              <span className="w-8 h-8 rounded-full bg-amber/20 text-amber text-sm font-black flex items-center justify-center">2</span>
              Improved State Projection
            </h3>
            <div className="relative z-10 grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-black text-amber mb-4 uppercase tracking-widest">OEE Target</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Target Availability', value: r.safeTargetAvailability },
                    { label: 'Target Performance', value: r.safeTargetPerformance },
                    { label: 'Target Quality', value: r.safeTargetQuality },
                    { label: 'Target OEE', value: r.targetOEE },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-primary-foreground/60">{item.label}</span>
                        <span className="font-black text-amber">{item.value.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-primary-foreground/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber rounded-full" style={{ width: `${item.value}%`, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-amber mb-4 uppercase tracking-widest">Pro Forma P&L</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Revenue', base: `${sym}${financialData.revenue.toLocaleString()}K`, improved: `${sym}${financialData.revenue.toLocaleString()}K` },
                    { label: 'COGS', base: `${sym}${financialData.cogs.toFixed(0)}K`, improved: `${sym}${r.improvedCOGS.toFixed(0)}K` },
                    { label: 'Gross Margin', base: `${r.baseGM.toFixed(1)}%`, improved: `${r.improvedGM.toFixed(1)}%` },
                    { label: 'Net Income', base: `${sym}${financialData.netIncome.toFixed(0)}K`, improved: `${sym}${r.improvedNetIncome.toFixed(0)}K` },
                    { label: `Cost/${financialData.unitOfMeasure}`, base: `${sym}${r.baseCostPerUnit.toFixed(2)}`, improved: `${sym}${r.targetCostPerUnit.toFixed(2)}` },
                    { label: 'RONA', base: `${r.baseRONA.toFixed(2)}%`, improved: `${r.improvedRONA.toFixed(2)}%` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-primary-foreground/10 last:border-0">
                      <span className="text-sm text-primary-foreground/60">{row.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-primary-foreground/30 line-through">{row.base}</span>
                        <span className="text-sm font-black text-amber">{row.improved}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: DuPont Tree */}
          <div className="bg-card border border-border rounded-4xl p-8 shadow-card">
            <h3 className="text-xl font-black text-foreground mb-2 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-black flex items-center justify-center">3</span>
              DuPont Tree — OEE to ROE Bridge
            </h3>
            <p className="text-muted-foreground text-sm mb-6 font-body ml-10">
              How OEE improvement flows through your financial ratios to improve Return on Equity.
            </p>
            <DuPontTree
              netProfitMarginBase={r.baseNPM}
              netProfitMarginImproved={r.improvedNPM}
              assetTurnoverBase={r.baseAT}
              assetTurnoverImproved={r.improvedAT}
              equityMultiplier={r.equityMult}
              roeBase={r.baseROE}
              roeImproved={r.improvedROE}
              ronaBase={r.baseRONA}
              ronaImproved={r.improvedRONA}
              currency={sym}
            />
          </div>

          {/* Section 4: Savings Breakdown */}
          <div className="bg-card border border-border rounded-4xl p-8 shadow-card">
            <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-black flex items-center justify-center">4</span>
              Savings Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Annual savings breakdown table">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left text-xs font-bold uppercase tracking-widest text-muted-foreground py-3 pr-4">Cost Category</th>
                    <th className="text-right text-xs font-bold uppercase tracking-widest text-muted-foreground py-3 px-3">Baseline</th>
                    <th className="text-right text-xs font-bold uppercase tracking-widest text-amber py-3 px-3">Target</th>
                    <th className="text-right text-xs font-bold uppercase tracking-widest text-green-600 py-3 pl-3">Annual Saving</th>
                    <th className="text-right text-xs font-bold uppercase tracking-widest text-muted-foreground py-3 pl-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Raw Material Packaging', saving: r.rmPackagingSaving, pct: 0.18, fixed: false },
                    { label: 'Raw Material Ingredients', saving: r.rmIngredientsSaving, pct: 0.27, fixed: false },
                    { label: 'Direct Labor (Variable)', saving: r.dlVariableSaving, pct: 0.55, fixed: false },
                    { label: 'Direct Labor (Fixed Benefits)', saving: 0, pct: 0, fixed: true },
                    { label: 'Indirect & Overhead', saving: 0, pct: 0, fixed: true },
                  ].map((row) => {
                    const baseline = row.fixed
                      ? (row.label.includes('Labor') ? financialData.directLabor * 0.24 : financialData.overhead)
                      : financialData.cogs * (row.pct * 0.3) + row.saving / 1000;
                    const target = baseline - row.saving / 1000;
                    return (
                      <tr key={row.label} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 pr-4 font-medium text-foreground">{row.label}</td>
                        <td className="text-right py-3.5 px-3 text-muted-foreground">{sym}{baseline.toFixed(0)}K</td>
                        <td className="text-right py-3.5 px-3 font-bold text-amber">{sym}{target.toFixed(0)}K</td>
                        <td className="text-right py-3.5 pl-3 font-black text-green-600">
                          {row.saving > 0 ? `${sym}${(row.saving / 1000).toFixed(0)}K` : '—'}
                        </td>
                        <td className="text-right py-3.5 pl-3">
                          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${row.fixed ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-700'}`}>
                            {row.fixed ? 'Fixed' : 'Variable'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-border bg-muted/20 font-black">
                    <td className="py-4 pr-4 text-foreground font-black">Total</td>
                    <td className="text-right py-4 px-3 text-foreground">{sym}{financialData.cogs.toFixed(0)}K</td>
                    <td className="text-right py-4 px-3 text-amber">{sym}{r.improvedCOGS.toFixed(0)}K</td>
                    <td className="text-right py-4 pl-3 text-green-600">{sym}{(r.annualSaving / 1000).toFixed(0)}K</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: ROI & Investment Analysis */}
          <div className="bg-card border border-border rounded-4xl p-8 shadow-card">
            <h3 className="text-xl font-black text-foreground mb-2 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-muted text-muted-foreground text-sm font-black flex items-center justify-center">5</span>
              ROI &amp; Investment Analysis
            </h3>
            <p className="text-muted-foreground text-sm mb-6 font-body ml-10">
              Return on investment and multi-year financial returns from the OEE improvement programme.
            </p>

            {/* ROI KPI strip */}
            <div
              className="rounded-3xl p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4"
              style={{ background: 'linear-gradient(135deg, #0B1929 0%, #1E3A5F 100%)' }}
            >
              {[
                { label: 'Implementation Cost', value: `${sym}${financialData.implementationCost}K`, color: 'text-red-400' },
                { label: 'Annual Saving', value: `${sym}${(r.annualSaving / 1000).toFixed(0)}K`, color: 'text-green-400' },
                { label: 'Payback Period', value: r.paybackMonths > 0 ? `${r.paybackMonths.toFixed(1)} mo` : '—', color: 'text-amber' },
                { label: 'Year-1 ROI', value: `${r.roi.toFixed(0)}%`, color: 'text-amber' },
              ].map((kpi) => (
                <div key={kpi.label} className="text-center">
                  <div className={`text-2xl font-black mb-1 ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-primary-foreground/50">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Multi-year returns table */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest">Cumulative Returns</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Year 1 Net Return', value: r.annualSaving - financialData.implementationCost * 1000 },
                    { label: '3-Year Cumulative', value: r.threeYearReturn },
                    { label: '5-Year Cumulative', value: r.fiveYearReturn },
                    { label: '5-Year NPV', value: r.fiveYearNPV },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className={`text-sm font-black ${row.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {row.value >= 0 ? '' : '-'}{sym}{Math.abs(row.value / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest">Investment Summary</h4>
                <div className="space-y-3">
                  {[
                    { label: 'OEE Improvement', value: `+${r.oeeDelta.toFixed(1)}pp` },
                    { label: 'COGS Reduction', value: `${sym}${(r.annualSaving / 1000).toFixed(0)}K/yr` },
                    { label: 'Gross Margin Uplift', value: `+${(r.improvedGM - r.baseGM).toFixed(2)}pp` },
                    { label: 'Net Profit Margin Uplift', value: `+${(r.improvedNPM - r.baseNPM).toFixed(2)}pp` },
                    { label: 'ROE Uplift', value: `+${(r.improvedROE - r.baseROE).toFixed(2)}pp` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="text-sm font-black text-amber">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payback chart */}
            <h4 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest">Payback Curve — 12 Months</h4>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={r.paybackData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="savingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,25,41,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B', fontFamily: 'var(--font-plus-jakarta-sans)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B', fontFamily: 'var(--font-plus-jakarta-sans)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${sym}${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<PaybackTooltip sym={sym} />} />
                  <Legend formatter={(value) => (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                      {value === 'cumulativeSaving' ? 'Cumulative Saving' : 'Implementation Cost'}
                    </span>
                  )} />
                  <Area type="monotone" dataKey="cumulativeSaving" stroke="#22C55E" strokeWidth={2.5} fill="url(#savingGrad)" dot={false} />
                  <Area type="monotone" dataKey="implementationCost" stroke="#EF4444" strokeWidth={2} strokeDasharray="6 3" fill="url(#costGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Implementation Cost', value: `${sym}${financialData.implementationCost}K`, color: 'text-red-500' },
                { label: 'Annual Saving', value: `${sym}${(r.annualSaving / 1000).toFixed(0)}K`, color: 'text-green-600' },
                { label: 'Payback Period', value: `${r.paybackMonths > 0 ? r.paybackMonths.toFixed(1) : '—'} months`, color: 'text-amber' },
                { label: '5-Year NPV', value: `${sym}${(r.fiveYearNPV / 1000).toFixed(0)}K`, color: 'text-foreground' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-muted/50 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{kpi.label}</div>
                  <div className={`text-xl font-black ${kpi.color}`}>{kpi.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Methodology note */}
          <div className="bg-muted/30 border border-border rounded-3xl p-6">
            <p className="text-xs text-muted-foreground leading-relaxed font-body">
              <strong className="text-foreground">Methodology note:</strong> All operational data entered manually for scenario modelling. No live equipment or ERP connection has been made. Actual results will be validated during a Fast Floor Audit. Financial projections are directional estimates based on DuPont decomposition and OEE improvement modelling — not audited financial statements.
            </p>
          </div>

          {/* Next Steps CTA */}
          <div
            className="rounded-4xl p-10 text-center text-primary-foreground relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0B1929 0%, #1E3A5F 100%)' }}
          >
            <div className="relative z-10 space-y-6">
              <h3 className="text-3xl font-black text-primary-foreground">Ready to validate these numbers?</h3>
              <p className="text-primary-foreground/60 max-w-xl mx-auto font-body">
                Book a Fast Floor Audit — 2 days on-site, 48hr proposal with OEE baseline, DuPont quantification, and a fixed-fee implementation proposal with a contractual go-live date.
              </p>
              <p className="text-primary-foreground/40 text-xs">
                OpEx Strategy · 1st Floor, Block B, Black River Park, 2 Fir Street, Observatory, Cape Town, 7925
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
