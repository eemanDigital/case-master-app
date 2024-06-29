import { useAuthContext } from "./useAuthContext";

export const useAdminHook = () => {
  const { user } = useAuthContext();

  const isAdmin = user?.data?.user?.role === "admin";
  const isSuperAdmin = user?.data?.user?.role === "super-admin";
  const isSuperOrAdmin =
    user?.data?.user?.role === "super-admin" ||
    user?.data?.user?.role === "admin";
  const isAdminOrHr =
    user?.data?.user?.role === "admin" ||
    user?.data?.user?.role === "hr" ||
    user?.data?.user?.role === "super-admin";

  return { isAdmin, isSuperAdmin, isAdminOrHr, isSuperOrAdmin };
};
