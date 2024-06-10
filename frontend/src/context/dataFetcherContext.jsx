import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create a context
const DataContext = createContext();
const DataFetcherContext = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [files, setFiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaveApps, setLeaveApp] = useState([]);
  const [clients, setClients] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [causeList, setCauseList] = useState([]);

  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingLeaveApp, setLoadingLeaveApp] = useState(false);
  const [loadingLeaveBalance, setLoadingLeaveBalance] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingCauseList, setLoadingCauseList] = useState(false);

  const [errorCases, setErrorCases] = useState("");
  const [errorUsers, setErrorUsers] = useState("");
  // const [errorUser, setErrorUser] = useState("");
  const [errorReports, setErrorReports] = useState("");
  const [errorFiles, setErrorFiles] = useState("");
  const [errorTasks, setErrorTasks] = useState("");
  const [errorLeaveApp, setErrorLeaveApp] = useState("");
  const [errorLeaveBalance, setErrorLeaveBalance] = useState("");
  const [errorClients, setErrorClients] = useState("");
  const [errorInvoices, setErrorInvoices] = useState("");
  const [errorCauseList, setErrorCauseList] = useState("");

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  // Merge custom headers with default headers
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    // Fetch cases function

    async function fetchCases() {
      try {
        setLoadingCases(true);
        const response = await axios.get("http://localhost:3000/api/v1/cases", {
          headers,
          withCredentials: true,
        });
        setCases(response.data);
      } catch (err) {
        setErrorCases(err.message || "Failed to fetch cases");
      } finally {
        setLoadingCases(false);
      }
    }

    // Fetch users function

    async function fetchUsers() {
      try {
        setLoadingUsers(true);
        const response = await axios.get("http://localhost:3000/api/v1/users", {
          headers,
          withCredentials: true,
        });
        setUsers(response.data);
      } catch (err) {
        setErrorUsers(err.message || "Failed to fetch users");
      } finally {
        setLoadingUsers(false);
      }
    }

    // Fetch Reports function
    async function fetchReports() {
      try {
        setLoadingUsers(true);
        const response = await axios.get(
          "http://localhost:3000/api/v1/reports",
          {
            headers,
            withCredentials: true,
          }
        );

        setReports(response.data);
      } catch (err) {
        setErrorReports(err.message || "Failed to fetch users");
      } finally {
        setLoadingReports(false);
      }
    }
    // Fetch file function
    async function fetchFiles() {
      try {
        setLoadingFiles(true);
        const response = await axios.get(
          `http://localhost:3000/api/v1/documents`,
          {
            headers,
            withCredentials: true,
          }
        );
        setFiles(response.data);
      } catch (err) {
        setErrorFiles(err.message || "Failed to fetch users");
      } finally {
        setLoadingFiles(false);
      }
    }

    // fetch tasks
    async function fetchTasks() {
      try {
        setLoadingTasks(true);
        const response = await axios.get(`http://localhost:3000/api/v1/tasks`, {
          headers,
          withCredentials: true,
        });
        setTasks(response.data);
      } catch (err) {
        setErrorTasks(err.message || "Failed to fetch users");
      } finally {
        setLoadingTasks(false);
      }
    }
    // fetch tasks
    async function fetchLeaveApp() {
      try {
        setLoadingLeaveApp(true);
        const response = await axios.get(
          `http://localhost:3000/api/v1/leaves/applications`,
          {
            headers,
            withCredentials: true,
          }
        );

        setLeaveApp(response.data);
      } catch (err) {
        setErrorLeaveApp(err.message || "Failed to fetch users");
      } finally {
        setLoadingLeaveApp(false);
      }
    }
    // fetch clients
    async function fetchLeaveBalance() {
      try {
        setLoadingLeaveBalance(true);
        const response = await axios.get(
          `http://localhost:3000/api/v1/leaves/balances`,
          {
            headers,
            withCredentials: true,
          }
        );

        setLeaveBalance(response.data);
      } catch (err) {
        setErrorLeaveBalance(err.message || "Failed to fetch users");
      } finally {
        setLoadingLeaveBalance(false);
      }
    }

    // client
    async function fetchClients() {
      try {
        setLoadingClients(true);
        const response = await axios.get(
          `http://localhost:3000/api/v1/clients`,
          {
            headers,
            withCredentials: true,
          }
        );

        setClients(response.data);
      } catch (err) {
        setErrorClients(err.message || "Failed to fetch users");
      } finally {
        setLoadingClients(false);
      }
    }
    // invoices
    async function fetchInvoices() {
      try {
        setLoadingInvoices(true);
        const response = await axios.get(
          `http://localhost:3000/api/v1/invoices`,
          {
            headers,
            withCredentials: true,
          }
        );

        setInvoices(response.data);
      } catch (err) {
        setErrorInvoices(err.message || "Failed to fetch users");
      } finally {
        setLoadingInvoices(false);
      }
    }
    async function fetchCauseList() {
      try {
        setLoadingCauseList(true);
        const response = await axios.get(
          `http://localhost:3000/api/v1/reports/upcoming`,
          {
            headers,
            withCredentials: true,
          }
        );

        setCauseList(response.data);
      } catch (err) {
        setErrorCauseList(err.message || "Failed to fetch users");
      } finally {
        setLoadingCauseList(false);
      }
    }

    // Call the functions to fetch cases and users separately
    fetchCases();
    fetchUsers();
    fetchReports();
    fetchFiles();
    fetchTasks();
    fetchLeaveApp();
    fetchLeaveBalance();
    fetchClients();
    fetchInvoices();
    fetchCauseList();
  }, []);

  return (
    <DataContext.Provider
      value={{
        cases,
        users,
        reports,
        files,
        tasks,
        leaveApps,
        leaveBalance,
        clients,
        invoices,
        causeList,
        loadingCases,
        loadingUsers,
        loadingClients,
        errorCases,
        errorUsers,
        loadingReports,
        errorReports,
        loadingFiles,
        loadingLeaveApp,
        loadingLeaveBalance,
        loadingInvoices,
        loadingCauseList,
        errorFiles,
        loadingTasks,
        errorTasks,
        errorLeaveApp,
        errorLeaveBalance,
        errorInvoices,
        errorClients,
        errorCauseList,
      }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataFetcherContext };

// import { createContext, useState, useEffect } from "react";
// import axios from "axios";

// // Create a context
// const DataContext = createContext();

// // Custom hook for fetching data
// const useFetchData = (url, initialData) => {
//   const [data, setData] = useState(initialData);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const response = await axios.get(url);
//         setData(response.data);
//       } catch (err) {
//         setError(err.message || "Failed to fetch data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [url]);

//   return { data, loading, error };
// };

// const DataFetcherContext = ({ children }) => {
//   const cases = useFetchData("http://localhost:3000/api/v1/cases", []);
//   const users = useFetchData("http://localhost:3000/api/v1/users", []);
//   const reports = useFetchData("http://localhost:3000/api/v1/reports", []);
//   const files = useFetchData("http://localhost:3000/api/v1/documents", []);
//   const tasks = useFetchData("http://localhost:3000/api/v1/tasks", []);

//   return (
//     <DataContext.Provider
//       value={{
//         cases,
//         users,
//         reports,
//         files,
//         tasks,
//       }}>
//       {children}
//     </DataContext.Provider>
//   );
// };

// export { DataContext, DataFetcherContext };
