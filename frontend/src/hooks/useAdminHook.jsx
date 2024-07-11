import { useAuthContext } from "./useAuthContext";

export const useAdminHook = () => {
  const { user } = useAuthContext();

  const isAdmin = user?.data?.user?.role === "admin";
  const isUser = user?.data?.user?.role === "user";
  const isSuperAdmin = user?.data?.user?.role === "super-admin";
  const isSuperOrAdmin =
    user?.data?.user?.role === "super-admin" ||
    user?.data?.user?.role === "admin";
  const isAdminOrHr =
    user?.data?.user?.role === "admin" ||
    user?.data?.user?.role === "hr" ||
    user?.data?.user?.role === "super-admin";

  const isStaff =
    user?.data?.user?.role === "user" ||
    user?.data?.user?.role === "admin" ||
    user?.data?.user?.role === "hr" ||
    user?.data?.user?.role === "super-admin";

  const isClient = user?.data?.user?.role === "client";

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
