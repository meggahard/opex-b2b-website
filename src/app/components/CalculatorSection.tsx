'use client';
import React, { useState, useCallback, useRef } from 'react';
import FinancialInputModule from './FinancialInputModule';
import OEESimulationModule from './OEESimulationModule';
import WhatIfModule from './WhatIfModule';
import BusinessCasePreview from './BusinessCasePreview';
import ReportCTASection from './ReportCTASection';
import FullReportView from './FullReportView';

export type CurrencyCode = 'ZAR' | 'USD' | 'GBP' | 'EUR';
export type ReportingPeriod = 'Annual' | 'Quarterly' | 'Monthly';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  ZAR: 'R',
  USD: '$',
  GBP: '£',
  EUR: '€',
};

export const PERIOD_MULTIPLIER: Record<ReportingPeriod, number> = {
  Annual: 1,
  Quarterly: 4,
  Monthly: 12,
};

export const COMMON_UOMS = [
  'Unit',
  'Case',
  'Tonne',
  'kg',
  'Litre',
  'Pallet',
  'Batch',
  'Box',
  'Piece',
  'Roll',
];

export interface FinancialData {
  revenue: number;
  /** Calculated: rawMaterials + directLabor + overhead */
  cogs: number;
  rawMaterials: number;
  directLabor: number;
  overhead: number;
  /** Calculated: gaExpenses + salesMarketing + otherOperatingCosts */
  operatingExpenses: number;
  gaExpenses: number;
  salesMarketing: number;
  otherOperatingCosts: number;
  /** Calculated: currentAssets + fixedAssets */
  totalAssets: number;
  fixedAssets: number;
  currentAssets: number;
  currentLiabilities: number;
  /** Calculated: totalAssets - currentLiabilities */
  totalEquity: number;
  /** Calculated: revenue - cogs - operatingExpenses */
  netIncome: number;
  currency: CurrencyCode;
  currencySymbol: string;
  unitOfMeasure: string;
  /**
   * UNITS SOLD — the figure from the financial report (goods actually sold).
   * This syncs to Good Units in the Granular Production Inputs.
   * @formerly unitsProduced
   */
  unitsSold: number;
  implementationCost: number;
  reportingPeriod: ReportingPeriod;
}

export interface OEEData {
  availability: number;
  performance: number;
  quality: number;
  targetAvailability: number;
  targetPerformance: number;
  targetQuality: number;
  scheduledHours: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  actualRate: number;
  targetRate: number;
  /**
   * Total Units Produced = Good Units (unitsSold) + Quality Loss Units.
   * Auto-calculated when qualityLossUnits changes.
   */
  totalUnits: number;
  qualityLossUnits: number;
}

export interface LeadData {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  country: string;
  companySize: string;
  industry: string;
  revenueRange: string;
  challenge: string;
  wantsAudit: boolean;
  privacyConsent: boolean;
}

// ── Granular inputs ──
const rawMaterials = 25163;
const directLabor = 2170;
const overhead = 540;
const gaExpenses = 5200;
const salesMarketing = 3300;
const otherOperatingCosts = 0;
const currentAssets = 16000;
const fixedAssets = 22000;
const currentLiabilities = 7500;
const revenue = 45000;

/**
 * UNITS SOLD = 5,017,260 (Good Units — from financial report)
 * Total Units Produced = unitsSold + qualityLossUnits = 5,017,260 + 60,966 = 5,078,226
 */
const unitsSold = 5017260;
const defaultQualityLossUnits = 60966;
const defaultTotalUnits = unitsSold + defaultQualityLossUnits; // 5,078,226

// ── Calculated totals ──
const totalCOGS = rawMaterials + directLabor + overhead;           // 27873
const totalOpEx = gaExpenses + salesMarketing + otherOperatingCosts; // 8500
const netIncome = revenue - totalCOGS - totalOpEx;                 // 8627
const totalAssets = currentAssets + fixedAssets;                   // 38000
const totalEquity = totalAssets - currentLiabilities;              // 30500

const defaultFinancial: FinancialData = {
  revenue,
  cogs: totalCOGS,
  rawMaterials,
  directLabor,
  overhead,
  operatingExpenses: totalOpEx,
  gaExpenses,
  salesMarketing,
  otherOperatingCosts,
  totalAssets,
  fixedAssets,
  currentAssets,
  currentLiabilities,
  totalEquity,
  netIncome,
  currency: 'ZAR',
  currencySymbol: 'R',
  unitOfMeasure: 'Unit',
  unitsSold,
  implementationCost: 45,
  reportingPeriod: 'Annual',
};

const defaultOEE: OEEData = {
  availability: 59.1,
  performance: 99.2,
  quality: 99.6,
  targetAvailability: 65,
  targetPerformance: 99.5,
  targetQuality: 99.8,
  scheduledHours: 2095,
  plannedDowntime: 416,
  unplannedDowntime: 440,
  actualRate: 13389,
  targetRate: 13500,
  // totalUnits = Good Units (unitsSold) + qualityLossUnits
  totalUnits: defaultTotalUnits,
  qualityLossUnits: defaultQualityLossUnits,
};

export default function CalculatorSection() {
  const [financialData, setFinancialData] = useState<FinancialData>(defaultFinancial);
  const [oeeData, setOEEData] = useState<OEEData>(defaultOEE);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  /**
   * When financial data changes, sync unitsSold → OEE Good Units.
   * totalUnits = unitsSold + qualityLossUnits (Good Units + rejects)
   */
  const handleFinancialChange = useCallback((data: FinancialData) => {
    setFinancialData(data);
    // Sync: Good Units = unitsSold; Total Units Produced = Good Units + Quality Loss
    setOEEData((prev) => {
      const newTotalUnits = data.unitsSold + prev.qualityLossUnits;
      // Recalculate quality from updated totals
      const newQuality = newTotalUnits > 0
        ? Math.min(100, Math.max(0, (data.unitsSold / newTotalUnits) * 100))
        : prev.quality;
      return {
        ...prev,
        totalUnits: newTotalUnits,
        quality: newQuality,
        targetQuality: Math.max(prev.targetQuality, newQuality),
      };
    });
  }, []);

  /**
   * When OEE data changes (e.g. qualityLossUnits edited directly),
   * recalculate totalUnits = Good Units (unitsSold) + qualityLossUnits.
   */
  const handleOEEChange = useCallback((data: OEEData) => {
    // Ensure totalUnits always = Good Units (financialData.unitsSold) + qualityLossUnits
    const goodUnits = financialData.unitsSold;
    const newTotalUnits = goodUnits + data.qualityLossUnits;
    const syncedData = { ...data, totalUnits: newTotalUnits };
    setOEEData(syncedData);
  }, [financialData.unitsSold]);

  const handleLeadSubmit = useCallback((data: LeadData) => {
    setLeadData(data);
    setShowReport(true);
    setTimeout(() => {
      if (reportRef.current) {
        reportRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, []);

  return (
    <>
      <FinancialInputModule
        data={financialData}
        onChange={handleFinancialChange}
      />
      <OEESimulationModule
        data={oeeData}
        financialData={financialData}
        onChange={handleOEEChange}
      />
      <WhatIfModule
        oeeData={oeeData}
        financialData={financialData}
        onOEEChange={handleOEEChange}
      />
      <BusinessCasePreview
        financialData={financialData}
        oeeData={oeeData}
      />
      <ReportCTASection
        onLeadSubmit={handleLeadSubmit}
        submitted={showReport}
      />
      {showReport && leadData && (
        <div ref={reportRef}>
          <FullReportView
            financialData={financialData}
            oeeData={oeeData}
            leadData={leadData}
          />
        </div>
      )}
    </>
  );
}
