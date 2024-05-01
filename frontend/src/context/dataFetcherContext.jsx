import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create a context
const DataContext = createContext();
const DataFetcherContext = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getCases() {
      try {
        setLoading(true);
        const casesRes = await axios.get("http://localhost:3000/api/v1/cases");
        const usersRes = await axios.get("http://localhost:3000/api/v1/users");
        setCases(casesRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.log(setError(err.message || "failed to fetch data"));
        // console.log("ERROR", );
      } finally {
        setLoading(false);
      }
    }
    getCases(); // Call the function to fetch cases and users
  }, []);

  return (
    <DataContext.Provider value={{ cases, users, loading, error }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataFetcherContext };
