// hooks/usePaymentStats.js - COMPLETE FIXED VERSION
import { useState, useEffect, useCallback, useRef } from "react";
import { useDataFetch } from "./useDataFetch";

export const usePaymentStats = (options = {}) => {
  const {
    year,
    month,
    range = "month",
    refreshInterval = 60000, // 1 minute
    autoRefresh = false, // Changed to false by default to avoid unnecessary calls
  } = options;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dataFetcher } = useDataFetch();
  const intervalRef = useRef(null);

  const fetchStats = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();

        // Always include range parameter
        queryParams.append("range", range);

        // Optional parameters
        if (year) queryParams.append("year", year);
        if (month) queryParams.append("month", month);
        if (forceRefresh) queryParams.append("forceRefresh", "true");

        const url = `payments/stats?${queryParams.toString()}`;
        console.log("Fetching stats with URL:", url);

        const result = await dataFetcher(url, "GET");
        console.log("Fetched payment stats:", result);

        if (result?.data) {
          setStats(result.data);
          setError(null);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch payment statistics");
        console.error("Payment stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [year, month, range, dataFetcher]
  );

  const refreshStats = useCallback(() => fetchStats(true), [fetchStats]);

  useEffect(() => {
    fetchStats();

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => fetchStats(), refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats, autoRefresh, refreshInterval]);

  // Helper calculations
  const collectionRate = stats?.kpis?.collectionRate || 0;
  const totalOutstanding = stats?.summary?.financial?.totalAmountDue || 0;
  const totalPaid = stats?.summary?.payments?.totalPayments || 0;
  const totalInvoiced = stats?.summary?.financial?.totalInvoiceAmount || 0;
  const overdueAmount = stats?.summary?.overdue?.totalAmount || 0;
  const overdueCount = stats?.summary?.overdue?.count || 0;
  const todayPayments = stats?.summary?.payments?.todayPayments || 0;
  const thisMonthPayments = stats?.summary?.payments?.thisMonthPayments || 0;

  return {
    // State
    stats,
    loading,
    error,

    // Actions
    refetch: fetchStats,
    refresh: refreshStats,

    // Summary Data
    summary: stats?.summary,
    analytics: stats?.analytics,
    topPerformers: stats?.topPerformers,
    recentActivity: stats?.recentActivity,
    clientInsights: stats?.clientInsights,
    caseFinancials: stats?.caseFinancials,
    kpis: stats?.kpis,
    metadata: stats?.metadata,

    // Quick Accessors
    collectionRate,
    totalOutstanding,
    totalPaid,
    totalInvoiced,
    overdueAmount,
    overdueCount,
    todayPayments,
    thisMonthPayments,
    avgPaymentDays: stats?.kpis?.avgPaymentDays || 0,
    paymentMethods: stats?.analytics?.payments?.methodDistribution || [],
    monthlyTrends: stats?.analytics?.trends?.monthly || [],
    invoiceStatus: stats?.analytics?.invoices?.byStatus || [],

    // Derived Metrics
    collectionEfficiency:
      collectionRate > 0 ? Math.min(collectionRate, 100) : 0,
    outstandingPercentage:
      totalInvoiced > 0 ? (totalOutstanding / totalInvoiced) * 100 : 0,
    paidPercentage: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
    overduePercentage:
      totalOutstanding > 0 ? (overdueAmount / totalOutstanding) * 100 : 0,
  };
};
