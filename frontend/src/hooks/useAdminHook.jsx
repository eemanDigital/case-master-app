import { useSelector } from "react-redux";

// Permission hook built on the new authorization model.
//  - userType: "client" | "staff"
//  - role: professional function ("client", "lawyer", "paralegal", "secretary",
//    "accountant", "hr", "receptionist", "it", "other")
//  - adminLevel: "none" | "admin" | "super-admin"
export const useAdminHook = () => {
  const { user } = useSelector((state) => state.auth);

  // Safely access user data with fallbacks
  const userData = user?.data || user || {};
  const primaryRole = userData?.role || "";
  const userType = userData?.userType || "";
  const adminLevel = userData?.adminLevel || "none";

  // There is exactly one role per user. A role-less/staff fallback is "other".
  const allRoles = [primaryRole || (userType === "staff" ? "other" : "")].filter(
    Boolean
  );

  // Check if user has specific role/privilege
  const hasRole = (role) => {
    if (!role) return false;

    // Admin levels imply the admin/super-admin "privileges"
    if (role === "super-admin") return adminLevel === "super-admin";
    if (role === "admin") return adminLevel === "admin" || adminLevel === "super-admin";

    // Otherwise check the single professional role
    return primaryRole === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (rolesArray) => {
    if (!Array.isArray(rolesArray)) return false;
    return rolesArray.some((role) => hasRole(role));
  };

  // Check if user has all of the specified roles
  const hasAllRoles = (rolesArray) => {
    if (!Array.isArray(rolesArray)) return false;
    return rolesArray.every((role) => hasRole(role));
  };

  // Individual role checks
  const isAdmin = adminLevel === "admin" || adminLevel === "super-admin";
  const isSuperAdmin = adminLevel === "super-admin";
  const isSuperOrAdmin = isAdmin;
  const isAdminOrHr = isAdmin || primaryRole === "hr";
  const isStaff = userType === "staff" || isAdmin;
  const isLawyer = primaryRole === "lawyer";
  const isSecretary = primaryRole === "secretary";
  const isHr = primaryRole === "hr";

  const isClient = userType === "client" || primaryRole === "client";
  const isUser = false; // "user" is not a valid role in the new model

  // For verified user
  const isVerified = userData?.isVerified === true;

  // Get user position/title
  const userPosition = userData?.position || "";

  // Get lawyer practice areas
  const practiceAreas = userData?.lawyerDetails?.practiceAreas || [];

  // Module access is implied by admin level (admins manage the firm),
  // with case management also open to lawyers and billing to HR.
  const canManageUsers = isSuperOrAdmin;
  const canManageCases = isSuperOrAdmin || isLawyer;
  const canManageBilling = isSuperOrAdmin || isHr;
  const canViewReports = isSuperOrAdmin;

  // Check department (for staff)
  const department = userData?.staffDetails?.department || "";

  return {
    // User data
    userData,
    userType,
    primaryRole,
    adminLevel,
    allRoles,

    // Position and department
    userPosition,
    department,
    practiceAreas,

    // Role checks (individual)
    isAdmin,
    isSuperAdmin,
    isSuperOrAdmin,
    isAdminOrHr,
    isStaff,
    isLawyer,
    isSecretary,
    isHr,
    isClient,
    isUser,
    isVerified,

    // Dynamic role checking methods
    hasRole,
    hasAnyRole,
    hasAllRoles,

    // Permission checks
    canManageUsers,
    canManageCases,
    canManageBilling,
    canViewReports,
  };
};

// Optional: Create a more specific hook for lawyer-related checks
export const useLawyerHook = () => {
  const { user } = useSelector((state) => state.auth);
  const userData = user?.data || user || {};

  return {
    isLawyer: userData?.role === "lawyer",
    practiceAreas: userData?.lawyerDetails?.practiceAreas || [],
    barNumber: userData?.lawyerDetails?.barNumber,
    barAssociation: userData?.lawyerDetails?.barAssociation,
    hourlyRate: userData?.lawyerDetails?.hourlyRate,
    isPartner: userData?.lawyerDetails?.isPartner || false,
    maxCaseload: userData?.lawyerDetails?.maxCaseload || 50,
    availableForNewCases:
      userData?.lawyerDetails?.availableForNewCases !== false,
  };
};

// Optional: Create a more specific hook for client-related checks
export const useClientHook = () => {
  const { user } = useSelector((state) => state.auth);
  const userData = user?.data || user || {};

  return {
    isClient: userData?.userType === "client" || userData?.role === "client",
    clientCategory: userData?.clientDetails?.clientCategory || "individual",
    company: userData?.clientDetails?.company,
    industry: userData?.clientDetails?.industry,
    clientSince: userData?.clientDetails?.clientSince,
    billingAddress: userData?.clientDetails?.billingAddress,
    preferredContactMethod:
      userData?.clientDetails?.preferredContactMethod || "email",
  };
};