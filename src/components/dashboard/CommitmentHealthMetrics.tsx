"use client";

import React, { useMemo, useState } from "react";
import HealthMetricsRangeSelector, { type RangeKey } from "./HealthMetricsRangeSelector";
import { useHealthMetricsRange } from "./useHealthMetricsRange";
import { HealthMetricsValueHistoryChart } from "./HealthMetricsValueHistoryChart";
import { HealthMetricsDrawdownChart } from "./HealthMetricsDrawdownChart";
import { HealthMetricsFeeGenerationChart } from "./HealthMetricsFeeGenerationChart";
import { HealthMetricsComplianceChart } from "./HealthMetricsComplianceChart";

export interface TimeSeriesPoint {
  date: string;
  value?: number;
  currentValue?: number;
  initialAmount?: number;
  drawdownPercent?: number;
  feeAmount?: number;
  complianceScore?: number;
}

export interface CommitmentHealthMetricsProps {
  commitmentId?: string;
  valueHistory?: TimeSeriesPoint[];
  drawdownHistory?: TimeSeriesPoint[];
  feeGenerationHistory?: TimeSeriesPoint[];
  complianceHistory?: TimeSeriesPoint[];
  valueHistoryData?: TimeSeriesPoint[];
  drawdownData?: TimeSeriesPoint[];
  feeGenerationData?: TimeSeriesPoint[];
  complianceData?: TimeSeriesPoint[];
  thresholdPercent?: number;
  volatilityPercent?: number;
}

type TabKey = "value" | "drawdown" | "fee" | "compliance";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "value", label: "Value History" },
  { key: "drawdown", label: "Drawdown" },
  { key: "fee", label: "Fee Generation" },
  { key: "compliance", label: "Compliance" },
];

const EmptyChart: React.FC<{ rangeLabel: string }> = ({ rangeLabel }) => (
  <div
    className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#222] bg-[#111] text-center text-[#99a1af]"
    data-testid="empty-chart-message"
    role="status"
    aria-live="polite"
  >
    <p className="text-sm font-medium">No data for the last {rangeLabel}</p>
    <p className="mt-1 text-xs">Try selecting a wider range.</p>
  </div>
);

function normalizeDate(value: string | Date | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function formatRangeLabel(range: RangeKey): string {
  return range === "all" ? "full history" : `${range.replace("d", " days")}`;
}

export const CommitmentHealthMetrics: React.FC<CommitmentHealthMetricsProps> = ({
  commitmentId,
  valueHistory,
  drawdownHistory,
  feeGenerationHistory,
  complianceHistory,
  valueHistoryData,
  drawdownData,
  feeGenerationData,
  complianceData,
  thresholdPercent,
  volatilityPercent,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("value");
  const { selectedRange, setRange, filterByRange } = useHealthMetricsRange();

  const resolvedValueHistory = valueHistoryData ?? valueHistory ?? [];
  const resolvedDrawdownHistory = drawdownData ?? drawdownHistory ?? [];
  const resolvedFeeGenerationHistory = feeGenerationData ?? feeGenerationHistory ?? [];
  const resolvedComplianceHistory = complianceData ?? complianceHistory ?? [];

  const rangeLabel = useMemo(() => formatRangeLabel(selectedRange), [selectedRange]);

  const filteredValueHistory = useMemo(
    () => filterByRange(resolvedValueHistory, (point) => normalizeDate(point.date)),
    [filterByRange, resolvedValueHistory],
  );

  const filteredDrawdownHistory = useMemo(
    () => filterByRange(resolvedDrawdownHistory, (point) => normalizeDate(point.date)),
    [filterByRange, resolvedDrawdownHistory],
  );

  const filteredFeeGenerationHistory = useMemo(
    () => filterByRange(resolvedFeeGenerationHistory, (point) => normalizeDate(point.date)),
    [filterByRange, resolvedFeeGenerationHistory],
  );

  const filteredComplianceHistory = useMemo(
    () => filterByRange(resolvedComplianceHistory, (point) => normalizeDate(point.date)),
    [filterByRange, resolvedComplianceHistory],
  );

  return (
    <div className="w-full rounded-2xl border border-[#222] bg-[#0a0a0a] p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-white">Health Metrics</h2>
        <HealthMetricsRangeSelector selected={selectedRange} onChange={setRange} />
      </div>

      <div aria-label="Metric type" className="flex gap-2 rounded-lg border border-[#222] bg-[#111] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={[
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ff0fc]",
              activeTab === tab.key
                ? "bg-[#222] text-[#0ff0fc] shadow-sm"
                : "text-[#666] hover:bg-[#1a1a1a] hover:text-[#99a1af]",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 w-full">
        {activeTab === "value" && (
          <div id="tabpanel-value">
            {filteredValueHistory.length === 0 ? (
              <EmptyChart rangeLabel={rangeLabel} />
            ) : (
              <HealthMetricsValueHistoryChart
                data={filteredValueHistory as Array<{ date: string; currentValue: number; initialAmount?: number }>}
                volatilityPercent={volatilityPercent}
              />
            )}
          </div>
        )}

        {activeTab === "drawdown" && (
          <div id="tabpanel-drawdown">
            {filteredDrawdownHistory.length === 0 ? (
              <EmptyChart rangeLabel={rangeLabel} />
            ) : (
              <HealthMetricsDrawdownChart
                data={filteredDrawdownHistory as Array<{ date: string; drawdownPercent: number }>}
                thresholdPercent={thresholdPercent}
                volatilityPercent={volatilityPercent}
              />
            )}
          </div>
        )}

        {activeTab === "fee" && (
          <div id="tabpanel-fee">
            {filteredFeeGenerationHistory.length === 0 ? (
              <EmptyChart rangeLabel={rangeLabel} />
            ) : (
              <HealthMetricsFeeGenerationChart
                data={filteredFeeGenerationHistory as Array<{ date: string; feeAmount: number }>}
                volatilityPercent={volatilityPercent}
              />
            )}
          </div>
        )}

        {activeTab === "compliance" && (
          <div id="tabpanel-compliance">
            {filteredComplianceHistory.length === 0 ? (
              <EmptyChart rangeLabel={rangeLabel} />
            ) : (
              <HealthMetricsComplianceChart
                data={filteredComplianceHistory as Array<{ date: string; complianceScore: number }>}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommitmentHealthMetrics;