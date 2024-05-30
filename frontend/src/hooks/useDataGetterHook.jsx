import { DataContext } from "../context/dataFetcherContext";
import { useContext } from "react";

export const useDataGetterHook = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw Error("useDataFetcher error Hook Error");
  }
  return context;
};
