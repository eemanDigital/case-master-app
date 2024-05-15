import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// Create a context
const DataContext = createContext();
const DataFetcherContext = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [files, setFiles] = useState([]);
  // const [user, setUser] = useState([]);

  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  // const [loadingUser, setLoadingUser] = useState(false);
  const [errorCases, setErrorCases] = useState("");
  const [errorUsers, setErrorUsers] = useState("");
  // const [errorUser, setErrorUser] = useState("");
  const [errorReports, setErrorReports] = useState("");
  const [errorFiles, setErrorFiles] = useState("");

  const params = useParams();

  useEffect(() => {
    // Fetch cases function

    async function fetchCases() {
      // Fetch cases function

      async function fetchCases() {
        try {
          setLoadingCases(true);
          const response = await axios.get(
            "http://localhost:3000/api/v1/cases"
          );
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
          const response = await axios.get(
            "http://localhost:3000/api/v1/users"
          );
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
            "http://localhost:3000/api/v1/reports"
          );

          setReports(response.data);
        } catch (err) {
          setErrorReports(err.message || "Failed to fetch users");
        } finally {
          setLoadingReports(false);
        }
      }
      // Fetch Reports function
      // async function fetchFiles() {
      //   try {
      //     setLoadingFiles(true);
      //     const response = await axios.get(
      //       `http://localhost:3000/api/v1/documents`
      //     );
      //     setFiles(response.data);
      //   } catch (err) {
      //     setErrorFiles(err.message || "Failed to fetch users");
      //   } finally {
      //     setLoadingFiles(false);
      //   }
      // }

      // Call the functions to fetch cases and users separately
      fetchCases();
      fetchUsers();
      fetchReports();
      // fetchFiles()
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        cases,
        users,
        reports,
        files,
        loadingCases,
        loadingUsers,
        errorCases,
        errorUsers,
        loadingReports,
        errorReports,
        loadingFiles,
        errorFiles,
      }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataFetcherContext };
