import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "../src/redux/features/auth/authSlice";

const ReportDataProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { users, usersLastFetched } = useSelector((state) => state.auth);
  //   const { cases, casesLastFetched } = useSelector((state) => state.cases);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch users once if not cached
      if (!users?.data?.length && !usersLastFetched) {
        console.log("🚀 Fetching users (initial load)");
        dispatch(getUsers());
      }

      // Fetch cases once if not cached
      //   if (!cases?.data?.length && !casesLastFetched) {
      //     console.log("🚀 Fetching cases (initial load)");
      //     // dispatch(getCases());
      //   }
    }
  }, [
    isAuthenticated,
    users?.data?.length,
    usersLastFetched,
    // cases?.data?.length,
    // casesLastFetched,
    dispatch,
  ]);

  return <>{children}</>;
};

export default ReportDataProvider;
