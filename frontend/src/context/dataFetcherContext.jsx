import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create a context
const DataContext = createContext();

const DataFetcherContext = ({ children }) => {
  const [state, setState] = useState({
    cases: [],
    users: [],
    reports: [],
    // files: [],
    tasks: [],
    leaveApps: [],
    leaveBalance: [],
    clients: [],
    invoices: [],
    causeList: [],
    payments: [],
    todos: [],
    totalPaymentWeekToYear: [],
    totalBalanceOnPayments: [],
    casesByStatus: [],
    casesByCourt: [],
    casesByNature: [],
    casesByRating: [],
    casesByMode: [],
    casesByCategory: [],
    casesByClient: [],
    casesByAccountOfficer: [],
    monthlyNewCases: [],
    yearlyNewCases: [],
    events: [],
    loading: {
      cases: false,
      users: false,
      reports: false,
      // files: false,
      tasks: false,
      leaveApps: false,
      leaveBalance: false,
      clients: false,
      invoices: false,
      causeList: false,
      payments: false,
      clientsPayments: false,
      todos: false,
      totalPaymentWeekToYear: false,
      totalBalanceOnPayments: false,
      casesByStatus: false,
      casesByCourt: false,
      casesByNature: false,
      casesByRating: false,
      casesByMode: false,
      casesByCategory: false,
      casesByClient: false,
      casesByAccountOfficer: false,
      monthlyNewCases: false,
      yearlyNewCases: false,
      events: false,
    },
    error: {
      cases: "",
      users: "",
      reports: "",
      // files: "",
      tasks: "",
      leaveApps: "",
      leaveBalance: "",
      clients: "",
      invoices: "",
      causeList: "",
      payments: "",
      clientPayments: "",
      todos: "",
      totalPaymentWeekToYear: "",
      totalBalanceOnPayments: "",
      casesByStatus: "",
      casesByCourt: "",
      casesByNature: "",
      casesByRating: "",
      casesByMode: "",
      casesByCategory: "",
      casesByClient: "",
      casesByAccountOfficer: "",
      monthlyNewCases: "",
      yearlyNewCases: "",
      events: "",
    },
  });

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchData = async (endpoint, key) => {
    try {
      setState((prevState) => ({
        ...prevState,
        loading: { ...prevState.loading, [key]: true },
      }));
      const response = await axios.get(
        `http://localhost:3000/api/v1/${endpoint}`,
        {
          headers,
          withCredentials: true,
        }
      );
      setState((prevState) => ({
        ...prevState,
        [key]: response.data,
      }));
    } catch (err) {
      setState((prevState) => ({
        ...prevState,
        error: {
          ...prevState.error,
          [key]: err.message || `Failed to fetch ${key}`,
        },
      }));
    } finally {
      setState((prevState) => ({
        ...prevState,
        loading: { ...prevState.loading, [key]: false },
      }));
    }
  };

  useEffect(() => {
    const endpoints = [
      { endpoint: "cases", key: "cases" },
      { endpoint: "users", key: "users" },
      { endpoint: "reports", key: "reports" },
      // { endpoint: "documents", key: "files" },
      { endpoint: "tasks", key: "tasks" },
      { endpoint: "leaves/applications", key: "leaveApps" },
      { endpoint: "leaves/balances", key: "leaveBalance" },
      { endpoint: "clients", key: "clients" },
      { endpoint: "invoices", key: "invoices" },
      { endpoint: "reports/upcoming", key: "causeList" },
      { endpoint: "payments", key: "payments" },
      { endpoint: "payments/paymentEachClient", key: "clientPayments" },
      { endpoint: "todos", key: "todos" },
      {
        endpoint: "payments/totalWeekPaymentsToYear",
        key: "totalPaymentWeekToYear",
      },
      { endpoint: "payments/totalBalance", key: "totalBalanceOnPayments" },
      { endpoint: "cases/case-status", key: "casesByStatus" },
      { endpoint: "cases/cases-by-court", key: "casesByCourt" },
      { endpoint: "cases/cases-by-natureOfCase", key: "casesByNature" },
      { endpoint: "cases/cases-by-rating", key: "casesByRating" },
      { endpoint: "cases/cases-by-mode", key: "casesByMode" },
      { endpoint: "cases/cases-by-category", key: "casesByCategory" },
      { endpoint: "cases/cases-by-client", key: "casesByClient" },
      {
        endpoint: "cases/cases-by-accountOfficer",
        key: "casesByAccountOfficer",
      },
      { endpoint: "cases/monthly-new-cases", key: "monthlyNewCases" },
      { endpoint: "cases/yearly-new-cases", key: "yearlyNewCases" },
      { endpoint: "events", key: "events" },
    ];

    endpoints.forEach(({ endpoint, key }) => {
      fetchData(endpoint, key);
    });
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
};

export { DataContext, DataFetcherContext };
