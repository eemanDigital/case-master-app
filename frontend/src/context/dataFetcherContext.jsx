import { createContext, useState } from "react";
import axios from "axios";

// Create a context
const DataContext = createContext();

const DataFetcherContext = ({ children }) => {
  const [state, setState] = useState({
    cases: [],
    users: [],
    reports: [],
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
    clientPayments: [],
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
      tasks: false,
      leaveApps: false,
      leaveBalance: false,
      clients: false,
      invoices: false,
      causeList: false,
      clientPayments: false,
      payments: false,
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
      tasks: "",
      leaveApps: "",
      leaveBalance: "",
      clients: "",
      invoices: "",
      causeList: "",
      payments: "",
      todos: "",
      totalPaymentWeekToYear: "",
      totalBalanceOnPayments: "",
      casesByStatus: "",
      casesByCourt: "",
      casesByNature: "",
      casesByRating: "",
      casesByMode: "",
      casesByCategory: "",
      clientPayments: "",
      casesByClient: "",
      casesByAccountOfficer: "",
      monthlyNewCases: "",
      yearlyNewCases: "",
      events: "",
    },
  });

  // const token = document.cookie
  //   .split("; ")
  //   .find((row) => row.startsWith("jwt="))
  //   ?.split("=")[1];

  // const headers = {
  //   "Content-Type": "application/json",
  //   Authorization: `Bearer ${token}`,
  // };

  const fetchData = async (endpoint, key) => {
    try {
      setState((prevState) => ({
        ...prevState,
        loading: { ...prevState.loading, [key]: true },
      }));
      const response = await axios.get(
        `http://localhost:3000/api/v1/${endpoint}`
        // {
        //   headers,
        //   withCredentials: true,
        // }
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
          [key]:
            (err.response && err.response.data && err.response.data.message) ||
            err.message ||
            err.toString() ||
            `Failed to fetch ${key}`,
        },
      }));
    } finally {
      setState((prevState) => ({
        ...prevState,
        loading: { ...prevState.loading, [key]: false },
      }));
    }
  };

  return (
    <DataContext.Provider value={{ ...state, fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataFetcherContext };
