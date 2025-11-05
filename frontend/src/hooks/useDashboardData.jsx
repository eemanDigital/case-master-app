// hooks/useDashboardData.js - FIXED VERSION
import { useState, useEffect, useCallback } from "react";
import { useDataGetterHook } from "./useDataGetterHook";
import { useDataFetch } from "./useDataFetch";

export const useDashboardData = () => {
  const { fetchData, ...dataState } = useDataGetterHook();
  //   const { dataFetcher } = useDataFetch();

  const [paymentData, setPaymentData] = useState({
    year: null,
    month: null,
    eachMonth: null,
  });

  const [loading, setLoading] = useState({ dashboard: true });
  const [error, setError] = useState({ general: null });

  // Fixed fetch function
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log("🔄 Starting dashboard data fetch...");
      setLoading({ dashboard: true });
      setError({ general: null });

      // Use individual awaits instead of Promise.all to avoid silent failures
      await fetchData("cases", "cases");
      await fetchData("users", "users");
      await fetchData("reports", "reports");
      await fetchData("tasks", "tasks");
      await fetchData("cases/case-status", "casesByStatus");
      await fetchData("cases/cases-by-court", "casesByCourt");
      await fetchData("cases/cases-by-natureOfCase", "casesByNature");
      await fetchData("cases/cases-by-rating", "casesByRating");
      await fetchData("cases/cases-by-mode", "casesByMode");
      await fetchData("cases/cases-by-category", "casesByCategory");
      await fetchData("cases/cases-by-client", "casesByClient");
      await fetchData("cases/cases-by-accountOfficer", "casesByAccountOfficer");
      await fetchData("cases/monthly-new-cases", "monthlyNewCases");
      await fetchData("cases/yearly-new-cases", "yearlyNewCases");
      await fetchData("reports/upcoming", "causeList");
      await fetchData("payments/paymentEachClient", "clientPayments");
      await fetchData("payments/totalBalance", "totalBalanceOnPayments");

      console.log("✅ Dashboard data fetch completed");
    } catch (err) {
      console.error("❌ Dashboard data fetch error:", err);
      setError({ general: "Failed to load dashboard data: " + err.message });
    } finally {
      setLoading({ dashboard: false });
    }
  }, [fetchData]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Debug: Log when data changes
  useEffect(() => {
    if (!loading.dashboard) {
      console.log("📊 FINAL DASHBOARD DATA:", {
        cases: dataState.cases,
        users: dataState.users,
        reports: dataState.reports,
        casesByStatus: dataState.casesByStatus,
        // Add other key data points
      });
    }
  }, [loading.dashboard, dataState]);

  return {
    // Core data - FIXED: Pass the actual data objects
    cases: dataState.cases?.data || [],
    users: dataState.users?.data || [],
    tasks: dataState.tasks?.data || [],
    reports: dataState.reports?.data || [],

    // Charts data - FIXED: Extract .data property
    casesByStatus: dataState.casesByStatus?.data || [],
    casesByCourt: dataState.casesByCourt?.data || [],
    casesByNature: dataState.casesByNature?.data || [],
    casesByRating: dataState.casesByRating?.data || [],
    casesByMode: dataState.casesByMode?.data || [],
    casesByCategory: dataState.casesByCategory?.data || [],
    casesByClient: dataState.casesByClient?.data || [],
    casesByAccountOfficer: dataState.casesByAccountOfficer?.data || [],
    monthlyNewCases: dataState.monthlyNewCases?.data || [],
    yearlyNewCases: dataState.yearlyNewCases?.data || [],
    causeList: dataState.causeList?.data || [],
    clientPayments: dataState.clientPayments?.data || [],
    totalBalanceOnPayments: dataState.totalBalanceOnPayments?.data || [],

    // Payment data
    paymentYearData: paymentData.year,
    paymentMonthData: paymentData.month,
    paymentEachMonthData: paymentData.eachMonth,

    // Loading states
    loading: {
      dashboard: loading.dashboard,
      // Map individual loading states
      cases: dataState.loading?.cases || false,
      users: dataState.loading?.users || false,
      reports: dataState.loading?.reports || false,
      tasks: dataState.loading?.tasks || false,
      casesByStatus: dataState.loading?.casesByStatus || false,
      casesByCourt: dataState.loading?.casesByCourt || false,
      casesByNature: dataState.loading?.casesByNature || false,
      casesByRating: dataState.loading?.casesByRating || false,
      casesByMode: dataState.loading?.casesByMode || false,
      casesByCategory: dataState.loading?.casesByCategory || false,
      casesByClient: dataState.loading?.casesByClient || false,
      casesByAccountOfficer: dataState.loading?.casesByAccountOfficer || false,
      monthlyNewCases: dataState.loading?.monthlyNewCases || false,
      yearlyNewCases: dataState.loading?.yearlyNewCases || false,
    },

    // Error states
    error: {
      general: error.general,
      // Map individual error states
      cases: dataState.error?.cases || "",
      users: dataState.error?.users || "",
      reports: dataState.error?.reports || "",
      tasks: dataState.error?.tasks || "",
    },

    // ✅ CRITICAL: Pass fetchData function to components
    fetchData,

    // Refresh function
    refreshDashboard: fetchDashboardData,
  };
};
