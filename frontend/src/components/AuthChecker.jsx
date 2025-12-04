// components/AuthChecker.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLoginStatus } from "../redux/features/auth/authSlice";

// This component should be placed at the root level (e.g., in App.jsx)
const AuthChecker = () => {
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  useEffect(() => {
    // Only check login status:
    // 1. On initial load
    // 2. Every 5 minutes if logged in
    // 3. When isLoggedIn changes
    const checkAuth = async () => {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Don't check too frequently
      if (now - lastCheckTime < 30000) {
        // 30 seconds minimum
        return;
      }

      // If logged out, check immediately
      // If logged in, check every 5 minutes
      if (!isLoggedIn || now - lastCheckTime > fiveMinutes) {
        try {
          await dispatch(getLoginStatus()).unwrap();
          setLastCheckTime(now);
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
    };

    checkAuth();
  }, [dispatch, isLoggedIn, lastCheckTime]);

  return null; // This component doesn't render anything
};

export default AuthChecker;
