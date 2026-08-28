'use client';
import React, { useState, useCallback } from 'react';

interface Props {
  className?: string;
}

export default function RunbookDownloadButton({ className = '' }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
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

      const sectionTitle = (text: string) => {
        checkPage(16);
        doc.setFillColor(11, 25, 41);
        doc.rect(margin, y, contentW, 10, 'F');
        doc.setTextColor(245, 158, 11);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(text, margin + 4, y + 7);
        y += 14;
      };

      const subTitle = (text: string) => {
        checkPage(10);
        doc.setTextColor(11, 25, 41);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(text, margin, y);
        y += 6;
      };

      const bodyText = (text: string, indent = 0) => {
        checkPage(8);
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, contentW - indent);
        doc.text(lines, margin + indent, y);
        y += lines.length * 5 + 2;
      };

      const formulaBox = (formula: string) => {
        checkPage(14);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(245, 158, 11);
        doc.roundedRect(margin, y, contentW, 10, 2, 2, 'FD');
        doc.setTextColor(11, 25, 41);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text(formula, margin + 4, y + 6.5);
        y += 14;
      };

      const fillableField = (label: string, hint = '') => {
        checkPage(18);
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        if (hint) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(`  (${hint})`, margin + doc.getTextWidth(label) + 1, y);
        }
        y += 4;
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(margin, y, contentW, 8, 1, 1, 'FD');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('Fill in here ___________________________________________', margin + 2, y + 5.5);
        y += 12;
      };

      const twoColFields = (fields: { label: string; hint?: string }[]) => {
        const colW = (contentW - 6) / 2;
        for (let i = 0; i < fields.length; i += 2) {
          checkPage(18);
          const left = fields[i];
          const right = fields[i + 1];
          // Left
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text(left.label, margin, y);
          if (left.hint) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text(`(${left.hint})`, margin, y + 4);
          }
          doc.setDrawColor(203, 213, 225);
          doc.setFillColor(250, 250, 250);
          doc.roundedRect(margin, y + (left.hint ? 6 : 4), colW, 7, 1, 1, 'FD');
          // Right
          if (right) {
            doc.setTextColor(71, 85, 105);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(right.label, margin + colW + 6, y);
            if (right.hint) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(7);
              doc.setTextColor(148, 163, 184);
              doc.text(`(${right.hint})`, margin + colW + 6, y + 4);
            }
            doc.setDrawColor(203, 213, 225);
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(margin + colW + 6, y + (right.hint ? 6 : 4), colW, 7, 1, 1, 'FD');
          }
          y += (left.hint || right?.hint ? 6 : 4) + 11;
        }
      };

      // ════════════════════════════════════════════════
      // COVER PAGE
      // ════════════════════════════════════════════════
      doc.setFillColor(11, 25, 41);
      doc.rect(0, 0, pageW, pageH, 'F');

      // Amber accent bar
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, 6, pageH, 'F');

      doc.setTextColor(245, 158, 11);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('OpEx Strategy', margin, 40);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('OEE Financial Impact Engine', margin, 54);

      doc.setTextColor(245, 158, 11);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('HOW IT WORKS — USER RUNBOOK', margin, 66);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('A step-by-step guide to preparing accurate data for your Financial Impact Report', margin, 76);

      // Divider
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.line(margin, 84, pageW - margin, 84);

      // What this runbook is
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('What is this runbook?', margin, 94);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const intro = doc.splitTextToSize(
        'This fillable runbook guides you through the 3 steps of the OpEx Strategy OEE Financial Impact Engine. ' + 'It explains every input field, the formula behind it, and where to find the data in your organisation. '+ 'Take this document to your Finance Manager, Production Manager, or Plant Engineer to collect the correct figures '+ 'before filling in the online calculator for an accurate, boardroom-ready report.',
        contentW
      );
      doc.text(intro, margin, 102);

      // 3 Steps overview
      const stepsY = 130;
      [
        { num: '01', title: 'Enter Financial Data', time: '3 min', desc: 'Revenue, COGS, OpEx from your P&L' },
        { num: '02', title: 'Simulate OEE', time: '5 min', desc: 'Production hours, rates, quality data' },
        { num: '03', title: 'Get Business Case', time: '2 min', desc: 'Instant Before/After financial impact' },
      ].forEach((step, i) => {
        const sx = margin + i * (contentW / 3 + 2);
        const sw = contentW / 3 - 2;
        doc.setFillColor(30, 58, 95);
        doc.roundedRect(sx, stepsY, sw, 40, 3, 3, 'F');
        doc.setTextColor(245, 158, 11);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(step.num, sx + 4, stepsY + 13);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(step.title, sx + 4, stepsY + 22);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(step.time, sx + 4, stepsY + 29);
        const descLines = doc.splitTextToSize(step.desc, sw - 6);
        doc.text(descLines, sx + 4, stepsY + 35);
      });

      // Who to consult
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Who to consult for accurate data:', margin, stepsY + 52);
      const consultItems = [
        '• Finance Manager / CFO — Revenue, COGS, OpEx, Balance Sheet figures',
        '• Production Manager / Plant Engineer — Scheduled hours, downtime, production rates',
        '• Quality Manager — Scrap rates, rework counts, quality loss units',
        '• ERP / MES Administrator — Actual vs target production data',
      ];
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      consultItems.forEach((item, i) => {
        doc.text(item, margin, stepsY + 60 + i * 7);
      });

      // Footer
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.text('OpEx Strategy · 1st Floor, Block B, Black River Park, 2 Fir Street, Observatory, Cape Town, 7925', margin, pageH - 10);
      doc.text('opexstrategy.co.za', pageW - margin - 30, pageH - 10);

      // ════════════════════════════════════════════════
      // PAGE 2 — STEP 1: FINANCIAL DATA
      // ════════════════════════════════════════════════
      addPage();

      // Page header
      doc.setFillColor(11, 25, 41);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, 6, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('STEP 1 OF 3 — ENTER YOUR FINANCIAL DATA', margin, 12);
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(8);
      doc.text('3 min · Source: Annual Report / P&L Statement', pageW - margin - 60, 12);
      y = 26;

      bodyText(
        'Use your most recent Annual Report or P&L Statement. All values are entered in thousands (000s). ' +
        'For example, if your revenue is R45,000,000, enter 45,000. Ask your Finance Manager or CFO for these figures.'
      );
      y += 2;

      sectionTitle('1A. REVENUE & UNITS SOLD');
      bodyText('Source: Income Statement (top line) and Sales/Dispatch records.');
      y += 2;

      twoColFields([
        { label: 'Annual Revenue', hint: 'R000s — P&L top line' },
        { label: 'UNITS SOLD (Total sold units)', hint: 'From sales/dispatch records — syncs to Good Units' },
        { label: 'Unit of Measure', hint: 'e.g. Unit, Case, Tonne, kg' },
        { label: 'Reporting Period', hint: 'Annual / Quarterly / Monthly' },
      ]);

      subTitle('Formula: Revenue per Unit = Revenue ÷ Units Sold');
      formulaBox('Revenue per Unit = (Annual Revenue × 1,000) ÷ Units Sold');
      bodyText('Units Sold is the number of goods actually sold as recorded in the financial report. This value syncs directly to "Good Units" in Step 2.');
      y += 2;

      sectionTitle('1B. COST OF GOODS SOLD (COGS)');
      bodyText('Source: Income Statement / Cost Accounting records. Enter the three components separately.');
      y += 2;

      twoColFields([
        { label: 'Raw Materials', hint: 'R000s — direct material costs' },
        { label: 'Direct Labor', hint: 'R000s — production labor costs' },
        { label: 'Manufacturing Overhead', hint: 'R000s — factory overhead' },
      ]);

      subTitle('Formula: Total COGS (auto-calculated)');
      formulaBox('Total COGS = Raw Materials + Direct Labor + Manufacturing Overhead');
      formulaBox('Gross Profit = Revenue − Total COGS');
      formulaBox('Gross Margin % = (Gross Profit ÷ Revenue) × 100');
      y += 2;

      sectionTitle('1C. OPERATING EXPENSES (OpEx)');
      bodyText('Source: Income Statement. These are period costs below the gross profit line.');
      y += 2;

      twoColFields([
        { label: 'G&A Expenses', hint: 'R000s — General & Administrative' },
        { label: 'Sales & Marketing', hint: 'R000s — sales and marketing costs' },
        { label: 'Other Operating Costs', hint: 'R000s — any other operating expenses' },
      ]);

      subTitle('Formula: Net Income / EBIT (auto-calculated)');
      formulaBox('Total OpEx = G&A + Sales & Marketing + Other Operating Costs');
      formulaBox('Net Income (EBIT) = Revenue − Total COGS − Total OpEx');
      formulaBox('EBIT Margin % = (Net Income ÷ Revenue) × 100');
      y += 2;

      checkPage(30);
      sectionTitle('1D. BALANCE SHEET (Optional — for DuPont Analysis)');
      bodyText('Source: Balance Sheet. Required for Asset Turnover, ROE, and RONA calculations.');
      y += 2;

      twoColFields([
        { label: 'Current Assets', hint: 'R000s — cash, receivables, inventory' },
        { label: 'Fixed Assets / Net PP&E', hint: 'R000s — property, plant & equipment' },
        { label: 'Current Liabilities', hint: 'R000s — short-term obligations' },
        { label: 'Implementation Budget', hint: 'R000s — estimated project cost' },
      ]);

      subTitle('DuPont Formulas (auto-calculated):');
      formulaBox('Total Assets = Current Assets + Fixed Assets');
      formulaBox('Total Equity = Total Assets − Current Liabilities');
      formulaBox('Asset Turnover = Revenue ÷ Total Assets');
      formulaBox('ROE = Net Profit Margin × Asset Turnover × Equity Multiplier');

      // ════════════════════════════════════════════════
      // PAGE 3 — STEP 2: OEE SIMULATION
      // ════════════════════════════════════════════════
      addPage();

      doc.setFillColor(11, 25, 41);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, 6, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('STEP 2 OF 3 — SIMULATE YOUR OEE PERFORMANCE', margin, 12);
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(8);
      doc.text('5 min · Source: Production / MES / Shift Reports', pageW - margin - 70, 12);
      y = 26;

      bodyText(
        'OEE (Overall Equipment Effectiveness) = Availability × Performance × Quality. ' +
        'These inputs come from your production records, shift logs, or MES system. '+ 'Ask your Production Manager, Plant Engineer, or Quality Manager for these figures.'
      );
      y += 2;

      // OEE formula box
      doc.setFillColor(30, 58, 95);
      doc.roundedRect(margin, y, contentW, 14, 3, 3, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('OEE = Availability % × Performance % × Quality %', margin + 4, y + 9);
      y += 18;

      sectionTitle('2A. AVAILABILITY INPUTS');
      bodyText('Source: Production scheduling system, maintenance logs, shift reports.');
      y += 2;

      twoColFields([
        { label: 'Scheduled Hours (hrs/yr)', hint: 'Total planned production hours per year' },
        { label: 'Planned Downtime (hrs/yr)', hint: 'Maintenance, changeovers, planned stops' },
        { label: 'Unplanned Downtime (hrs/yr)', hint: 'Breakdowns, stoppages, unexpected stops' },
      ]);

      subTitle('Formula: Availability (auto-calculated)');
      formulaBox('Operating Time = Scheduled Hours − Planned Downtime − Unplanned Downtime');
      formulaBox('Availability % = (Operating Time ÷ Scheduled Hours) × 100');
      bodyText('World-class benchmark: Availability ≥ 90%. A 1pp improvement in Availability = significant COGS reduction.');
      y += 2;

      sectionTitle('2B. PERFORMANCE INPUTS');
      bodyText('Source: Production rate reports, machine counters, OEE system.');
      y += 2;

      twoColFields([
        { label: 'Actual Production Rate (units/hr)', hint: 'Average actual throughput rate' },
        { label: 'Target Production Rate (units/hr)', hint: 'Nameplate / design capacity rate' },
      ]);

      subTitle('Formula: Performance (auto-calculated)');
      formulaBox('Performance % = (Actual Rate ÷ Target Rate) × 100');
      bodyText('World-class benchmark: Performance ≥ 95%. Rate losses include speed reductions and minor stops.');
      y += 2;

      sectionTitle('2C. QUALITY INPUTS');
      bodyText(
        'Source: Quality control records, scrap reports, rework logs. ' + 'IMPORTANT: Units Sold (from Step 1) automatically becomes your Good Units baseline. '+ 'You only need to enter Quality Loss Units (scrap + rework).'
      );
      y += 2;

      // Highlight box
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentW, 20, 2, 2, 'FD');
      doc.setTextColor(11, 25, 41);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('KEY RELATIONSHIP:', margin + 4, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Good Units = Units Sold (from Step 1 — synced automatically)', margin + 4, y + 13);
      doc.text('Total Units Produced = Good Units + Quality Loss Units (auto-calculated)', margin + 4, y + 19);
      y += 24;

      fillableField('Quality Loss Units (scrap + rework)', 'units/yr — from quality/scrap reports');

      subTitle('Formulas: Quality & Total Units (auto-calculated)');
      formulaBox('Total Units Produced = Good Units (Units Sold) + Quality Loss Units');
      formulaBox('Quality % = (Good Units ÷ Total Units Produced) × 100');
      formulaBox('Cost of Quality Loss = COGS × (Quality Loss Units ÷ Total Units) × 2.1');
      bodyText('World-class benchmark: Quality ≥ 99.5%. Quality losses carry a dual DuPont penalty on both Asset Turnover AND Net Profit Margin.');
      y += 2;

      sectionTitle('2D. TARGET PERFORMANCE (Improved State)');
      bodyText('Set realistic improvement targets. These must be ≥ current baseline. Consult your continuous improvement team.');
      y += 2;

      twoColFields([
        { label: 'Target Availability %', hint: 'Must be ≥ current baseline' },
        { label: 'Target Performance %', hint: 'Must be ≥ current baseline' },
        { label: 'Target Quality %', hint: 'Must be ≥ current baseline' },
      ]);

      formulaBox('Target OEE = Target Availability % × Target Performance % × Target Quality %');
      formulaBox('OEE Improvement (pp) = Target OEE − Baseline OEE');

      // ════════════════════════════════════════════════
      // PAGE 4 — STEP 3: BUSINESS CASE & FORMULAS
      // ════════════════════════════════════════════════
      addPage();

      doc.setFillColor(11, 25, 41);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, 6, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('STEP 3 OF 3 — YOUR FINANCIAL IMPACT REPORT', margin, 12);
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(8);
      doc.text('2 min · Auto-generated from Steps 1 & 2', pageW - margin - 60, 12);
      y = 26;

      bodyText(
        'Once you have entered all data from Steps 1 and 2, the engine automatically calculates your Before/After ' +
        'Financial Impact Report. No additional input is required. The report includes DuPont analysis, '+ 'annual savings, payback period, and 5-year NPV.'
      );
      y += 2;

      sectionTitle('3A. ANNUAL SAVINGS FORMULA');
      formulaBox('Annual Saving = Total COGS × (OEE Improvement pp ÷ 100) × 0.65');
      bodyText(
        'The 0.65 factor represents the variable cost fraction of COGS that is recoverable through OEE improvement. ' +
        'Fixed costs (benefits, overhead) are excluded as they do not reduce with OEE gains.'
      );
      y += 2;

      sectionTitle('3B. COST PER UNIT');
      formulaBox('Baseline Cost/Unit = (Total COGS × 1,000) ÷ Units Sold');
      formulaBox('Target Cost/Unit = Baseline Cost/Unit × (Baseline OEE ÷ Target OEE)');
      bodyText('Cost per unit improves as OEE increases because fixed overhead is spread over more good units produced.');
      y += 2;

      sectionTitle('3C. DUPONT FINANCIAL ANALYSIS');
      bodyText('The DuPont model decomposes Return on Equity (ROE) into three drivers:');
      formulaBox('Net Profit Margin = Net Income ÷ Revenue × 100');
      formulaBox('Asset Turnover = Revenue ÷ Total Assets');
      formulaBox('Equity Multiplier = Total Assets ÷ Total Equity');
      formulaBox('ROE = Net Profit Margin × Asset Turnover × Equity Multiplier × 100');
      bodyText(
        'OEE improvement affects ROE through two channels simultaneously: ' + '(1) Net Profit Margin improves as COGS decreases, and '+ '(2) Asset Turnover improves as the same asset base generates more output. '+ 'This dual effect is why quality improvements deliver disproportionate ROE gains.'
      );
      y += 2;

      sectionTitle('3D. RETURN ON NET ASSETS (RONA)');
      formulaBox('Net Working Capital (NWC) = Current Assets − Current Liabilities');
      formulaBox('Capital Employed = Fixed Assets + max(0, NWC)');
      formulaBox('RONA = Net Income ÷ Capital Employed × 100');
      y += 2;

      sectionTitle('3E. PAYBACK PERIOD & NPV');
      formulaBox('Payback Period (months) = (Implementation Cost × 1,000) ÷ (Annual Saving ÷ 12)');
      formulaBox('5-Year NPV = (Annual Saving × 4.33) − (Implementation Cost × 1,000)');
      formulaBox('ROI = ((Annual Saving − Implementation Cost × 1,000) ÷ (Implementation Cost × 1,000)) × 100');
      y += 2;

      sectionTitle('3F. LOSS DECOMPOSITION');
      formulaBox('Downtime Loss = COGS × (Unplanned Downtime ÷ Scheduled Hours) × 0.70');
      formulaBox('Quality Loss = COGS × (Quality Loss Units ÷ Total Units) × 2.10');
      formulaBox('Performance Loss = COGS × ((Target Rate − Actual Rate) ÷ Target Rate) × 0.50');
      bodyText(
        'Multipliers reflect the true economic cost: quality losses carry a 2.1× multiplier because each rejected unit ' + 'consumed raw materials AND labor AND overhead with zero revenue recovery. '+ 'Downtime losses carry 0.7× (fixed costs continue during downtime). '+ 'Performance losses carry 0.5× (partial variable cost impact).'
      );
      y += 4;

      // Data collection checklist
      checkPage(60);
      sectionTitle('DATA COLLECTION CHECKLIST');
      const checkItems = [
        ['Annual Revenue (R000s)', 'Finance Manager / CFO'],
        ['Units Sold (total sold units/yr)', 'Finance Manager / Sales Manager'],
        ['Raw Materials cost (R000s)', 'Finance Manager / Cost Accountant'],
        ['Direct Labor cost (R000s)', 'Finance Manager / HR'],
        ['Manufacturing Overhead (R000s)', 'Finance Manager / Cost Accountant'],
        ['G&A Expenses (R000s)', 'Finance Manager / CFO'],
        ['Sales & Marketing (R000s)', 'Finance Manager / Marketing'],
        ['Current Assets (R000s)', 'Finance Manager / CFO'],
        ['Fixed Assets / Net PP&E (R000s)', 'Finance Manager / CFO'],
        ['Current Liabilities (R000s)', 'Finance Manager / CFO'],
        ['Scheduled Hours (hrs/yr)', 'Production Manager / Plant Engineer'],
        ['Planned Downtime (hrs/yr)', 'Maintenance Manager / Production Manager'],
        ['Unplanned Downtime (hrs/yr)', 'Maintenance Manager / Production Manager'],
        ['Actual Production Rate (units/hr)', 'Production Manager / MES Admin'],
        ['Target Production Rate (units/hr)', 'Production Manager / Plant Engineer'],
        ['Quality Loss Units (scrap + rework/yr)', 'Quality Manager / Production Manager'],
        ['Target Availability %', 'Continuous Improvement / Production Manager'],
        ['Target Performance %', 'Continuous Improvement / Production Manager'],
        ['Target Quality %', 'Quality Manager / Continuous Improvement'],
      ];

      checkItems.forEach((item) => {
        checkPage(8);
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, y, 5, 5, 0.5, 0.5, 'FD');
        doc.setTextColor(11, 25, 41);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(item[0], margin + 8, y + 4);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text(`→ ${item[1]}`, margin + 90, y + 4);
        y += 8;
      });

      // Footer on last page
      y += 6;
      checkPage(20);
      doc.setFillColor(11, 25, 41);
      doc.rect(margin, y, contentW, 16, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Ready to generate your report?', margin + 4, y + 7);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Visit opexstrategy.co.za and click "Generate My Report" with your collected data.', margin + 4, y + 13);

      doc.save('OpEx-Strategy-OEE-Runbook.pdf');
    } catch (err) {
      console.error('Runbook PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`btn-outline flex items-center gap-2 ${className}`}
      aria-label="Download OEE Runbook PDF"
      title="Download the How It Works runbook — a fillable guide to collecting accurate data"
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
          Download Runbook
        </>
      )}
    </button>
  );
}
