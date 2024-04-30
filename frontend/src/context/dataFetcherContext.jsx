import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Create a context
const DataContext = createContext();
const DataFetcherContext = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function getCases() {
      try {
        const casesRes = await axios.get("http://localhost:3000/api/v1/cases");
        const usersRes = await axios.get("http://localhost:3000/api/v1/users");
        setCases(casesRes.data);
        setUsers(usersRes.data);
      } catch (error) {
        console.log(error);
      }
    }
    getCases(); // Call the function to fetch cases and users
  }, []);

  return (
    <DataContext.Provider value={{ cases, users }}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContext, DataFetcherContext };
