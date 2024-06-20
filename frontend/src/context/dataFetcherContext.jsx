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
    ];

    endpoints.forEach(({ endpoint, key }) => {
      fetchData(endpoint, key);
    });
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
};

export { DataContext, DataFetcherContext };
