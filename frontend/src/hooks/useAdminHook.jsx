import { useSelector } from "react-redux";

export const useAdminHook = () => {
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);

  const isAdmin = user?.data?.role === "admin";
  const isUser = user?.data?.role === "user";
  const isSuperAdmin = user?.data?.role === "super-admin";
  const isSuperOrAdmin =
    user?.data?.role === "super-admin" || user?.data?.role === "admin";
  const isAdminOrHr =
    user?.data?.role === "admin" ||
    user?.data?.role === "hr" ||
    user?.data?.role === "super-admin";
  const isStaff =
    user?.data?.role === "user" ||
    user?.data?.role === "admin" ||
    user?.data?.role === "hr" ||
    user?.data?.role === "super-admin";

  const isClient = user?.data?.role === "client";

  return {
    isAdmin,
    isSuperAdmin,
    isAdminOrHr,
    isSuperOrAdmin,
    isClient,
    isStaff,
    isUser,
  };
};
