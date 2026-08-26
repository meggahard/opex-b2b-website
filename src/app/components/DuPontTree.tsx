'use client';
import React from 'react';

interface Props {
  netProfitMarginBase: number;
  netProfitMarginImproved: number;
  assetTurnoverBase: number;
  assetTurnoverImproved: number;
  equityMultiplier: number;
  roeBase: number;
  roeImproved: number;
  ronaBase: number;
  ronaImproved: number;
  currency: string;
}

function Node({
  label,
  baseValue,
  improvedValue,
  suffix = '',
  highlight = false,
  dualPenalty = false,
}: {
  label: string;
  baseValue: string;
  improvedValue: string;
  suffix?: string;
  highlight?: boolean;
  dualPenalty?: boolean;
}) {
  const isImproved = baseValue !== improvedValue;
  return (
    <div
      className={`dupont-node ${isImproved ? 'improved' : ''} ${highlight ? 'border-amber/50 bg-amber/5' : ''}`}
      role="figure"
      aria-label={`${label}: baseline ${baseValue}${suffix}, improved ${improvedValue}${suffix}`}
    >
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center justify-center gap-2">
        {isImproved && (
          <span className="text-xs text-muted-foreground line-through">{baseValue}{suffix}</span>
        )}
        <span className={`text-base font-black ${highlight ? 'text-amber' : isImproved ? 'text-green-600' : 'text-foreground'}`}>
          {improvedValue}{suffix}
        </span>
      </div>
      {dualPenalty && (
        <div className="mt-1 text-xs text-amber font-bold">⚡ Dual DuPont Effect</div>
      )}
    </div>
  );
}

function Connector({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center ${vertical ? 'h-6' : 'w-6'}`}
      aria-hidden="true"
    >
      <div className={`${vertical ? 'w-px h-full' : 'h-px w-full'} bg-border`} />
    </div>
  );
}

function OperatorNode({ symbol }: { symbol: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-black flex items-center justify-center flex-shrink-0 mx-1"
      aria-hidden="true"
    >
      {symbol}
    </div>
  );
}

export default function DuPontTree({
  netProfitMarginBase,
  netProfitMarginImproved,
  assetTurnoverBase,
  assetTurnoverImproved,
  equityMultiplier,
  roeBase,
  roeImproved,
  ronaBase,
  ronaImproved,
}: Props) {
  return (
    <div className="overflow-x-auto" role="img" aria-label="DuPont analysis tree showing OEE improvement impact on ROE">
      <div className="min-w-[600px] space-y-4">
        {/* ROE row */}
        <div className="flex justify-center">
          <div className="dupont-node improved border-amber/60 bg-amber/5 min-w-[180px]">
            <div className="text-xs font-bold uppercase tracking-widest text-amber mb-1">ROE</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground line-through">{roeBase.toFixed(2)}%</span>
              <span className="text-2xl font-black text-amber">{roeImproved.toFixed(2)}%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Return on Equity</div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <Connector vertical />
        </div>

        {/* NPM × AT × EM row */}
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <Node
            label="Net Profit Margin"
            baseValue={netProfitMarginBase.toFixed(2)}
            improvedValue={netProfitMarginImproved.toFixed(2)}
            suffix="%"
            dualPenalty
          />
          <OperatorNode symbol="×" />
          <Node
            label="Asset Turnover"
            baseValue={assetTurnoverBase.toFixed(2)}
            improvedValue={assetTurnoverImproved.toFixed(2)}
            suffix="x"
          />
          <OperatorNode symbol="×" />
          <Node
            label="Equity Multiplier"
            baseValue={equityMultiplier.toFixed(2)}
            improvedValue={equityMultiplier.toFixed(2)}
            suffix="x"
          />
        </div>

        {/* Connectors */}
        <div className="grid grid-cols-3 gap-4 px-8">
          <div className="flex justify-center"><Connector vertical /></div>
          <div className="flex justify-center"><Connector vertical /></div>
          <div />
        </div>

        {/* OEE drivers row */}
        <div className="grid grid-cols-3 gap-4 px-8">
          {/* Quality → NPM */}
          <div className="bg-amber/5 border border-amber/20 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-amber mb-2">Quality OEE</div>
            <div className="text-sm text-foreground/70 leading-snug">
              ↓ Scrap → ↓ COGS<br />
              <strong className="text-amber">↑ Net Profit Margin</strong><br />
              <strong className="text-amber">↑ Asset Turnover</strong>
            </div>
            <div className="mt-2 text-xs bg-amber/10 text-amber font-bold rounded-xl px-2 py-1">
              72% more profit per OEE point
            </div>
          </div>

          {/* Availability/Performance → AT */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">Availability &amp; Performance</div>
            <div className="text-sm text-foreground/70 leading-snug">
              ↑ Throughput from same assets<br />
              <strong className="text-blue-500">↑ Asset Turnover</strong>
            </div>
            <div className="mt-2 text-xs bg-blue-100 text-blue-600 font-bold rounded-xl px-2 py-1">
              Single DuPont path
            </div>
          </div>

          {/* RONA */}
          <div className="bg-muted/50 border border-border rounded-2xl p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">RONA</div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground line-through">{ronaBase.toFixed(2)}%</span>
              <span className="text-lg font-black text-green-600">{ronaImproved.toFixed(2)}%</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Net Profit ÷ (Fixed Assets + NWC)
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-border">
          {[
            { color: 'bg-amber', label: 'Improved (target OEE)' },
            { color: 'bg-green-500', label: 'Positive change' },
            { color: 'bg-muted-foreground', label: 'No change (fixed)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`} aria-hidden="true" />
              <span className="text-xs text-muted-foreground font-body">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
