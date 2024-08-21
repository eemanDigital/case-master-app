import { useContext } from "react";
import { DataContext } from "../context/dataFetcherContext";

export const useDataGetterHook = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error(
      "useDataGetterHook must be used within a DataFetcherContext provider"
    );
  }
  return context;
};
