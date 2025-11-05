// // hooks/useDashboardInitialization.js
// import { useEffect, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { getUsers } from "../redux/features/auth/authSlice";
// import { useDataGetterHook } from "./useDataGetterHook";

// export const useDashboardInitialization = () => {
//   const dispatch = useDispatch();
//   const { users, isLoading: authLoading } = useSelector((state) => state.auth);

//   const {
//     fetchData,
//     fetchBatch,
//     dashboardStats,
//     loading: dataLoading,
//   } = useDataGetterHook();

//   // ✅ Track initialization state
//   const isInitializedRef = useRef(false);
//   const usersLoadedRef = useRef(false);

//   useEffect(() => {
//     // ✅ Prevent multiple initializations
//     if (isInitializedRef.current) {
//       return;
//     }

//     const initializeDashboard = async () => {
//       try {
//         console.log("📊 Initializing dashboard...");

//         // Mark as initialized immediately
//         isInitializedRef.current = true;

//         // ✅ Load users only once
//         if (!usersLoadedRef.current && (!users || users.length === 0)) {
//           console.log("👥 Fetching users...");
//           usersLoadedRef.current = true; // Mark before dispatch
//           await dispatch(getUsers()).unwrap();
//           console.log("✅ Users fetched");
//         }

//         // ✅ Fetch dashboard stats (single aggregate endpoint)
//         console.log("📈 Fetching dashboard stats...");
//         await fetchData("cases/dashboard-stats", "dashboardStats");
//         console.log("✅ Dashboard stats fetched");

//         // ✅ Fetch other essential data in parallel
//         console.log("📦 Fetching additional data...");
//         await fetchBatch([
//           { endpoint: "reports", key: "reports" },
//           { endpoint: "tasks", key: "tasks" },
//           { endpoint: "reports/upcoming", key: "causeList" },
//           { endpoint: "payments/totalBalance", key: "totalBalanceOnPayments" },
//         ]);
//         console.log("✅ Dashboard initialization complete");
//       } catch (error) {
//         console.error("❌ Dashboard initialization failed:", error);
//         // Don't reset - we've tried once
//       }
//     };

//     initializeDashboard();
//   }, [dispatch]); // ✅ Only dispatch as dependency

//   return {
//     dashboardStats,
//     isLoading: authLoading || dataLoading.dashboardStats,
//   };
// };
