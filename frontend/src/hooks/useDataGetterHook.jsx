import { useContext } from "react";
import { DataContext } from "../context/dataFetcherContext";

// export const useDataGetterHook = () => {
//   const context = useContext(DataContext);
//   if (!context) {
//     throw new Error(
//       "useDataGetterHook must be used within a DataFetcherContext provider"
//     );
//   }
//   return context;
// };

// hooks/useDataGetterHook.js

export const useDataGetterHook = () => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error(
      "useDataGetterHook must be used within a DataFetcherContext"
    );
  }

  return {
    ...context,
    // Add the new dashboardStats property
    dashboardStats: context.dashboardStats || {},
  };
};
