import { useSelector } from "react-redux";

export const useAdminHook = () => {
  const { user } = useSelector((state) => state.auth);

  // Safely access user data with fallbacks
  const userData = user?.data || user || {};
  const primaryRole = userData?.role || "";
  const userType = userData?.userType || "";
  const additionalRoles = userData?.additionalRoles || [];
  const isLawyerFlag = userData?.isLawyer || false;

  // Get all effective roles (primary + additional)
  const getAllRoles = () => {
    const roles = [primaryRole];
    if (additionalRoles && additionalRoles.length > 0) {
      roles.push(...additionalRoles);
    }
    return [...new Set(roles.filter(Boolean))];
  };

  const allRoles = getAllRoles();

  // Check if user has specific role/privilege
  const hasRole = (role) => {
    if (!role) return false;
    
    // Super-admin has all roles
    if (primaryRole === "super-admin" || userType === "super-admin") {
      return true;
    }
    
    // Check primary role
    if (primaryRole === role) return true;
    
    // Check additional roles
    if (additionalRoles && additionalRoles.includes(role)) {
      return true;
    }
    
    // Special case for lawyer (check isLawyer flag)
    if (role === "lawyer" && isLawyerFlag) {
      return true;
    }
    
    return false;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (rolesArray) => {
    if (!Array.isArray(rolesArray)) return false;
    return rolesArray.some(role => hasRole(role));
  };

  // Check if user has all of the specified roles
  const hasAllRoles = (rolesArray) => {
    if (!Array.isArray(rolesArray)) return false;
    return rolesArray.every(role => hasRole(role));
  };

  // Individual role checks (updated with new model)
  const isAdmin = hasRole("admin");
  const isSuperAdmin = hasRole("super-admin");
  const isSuperOrAdmin = hasAnyRole(["super-admin", "admin"]);
  const isAdminOrHr = hasAnyRole(["super-admin", "admin", "hr"]);
  const isStaff = hasAnyRole(["staff", "admin", "hr", "secretary", "super-admin"]);
  const isLawyer = hasRole("lawyer") || isLawyerFlag;
  const isSecretary = hasRole("secretary");
  const isHr = hasRole("hr");
  
  const isClient = userType === "client" || primaryRole === "client";
  const isUser = primaryRole === "user" || userType === "user"; // For backward compatibility

  // For verified user
  const isVerified = userData?.isVerified === true;

  // Get user position/title
  const userPosition = userData?.position || "";
  
  // Get lawyer practice areas
  const practiceAreas = userData?.lawyerDetails?.practiceAreas || [];

  // Check if user can manage specific modules
  const canManageUsers = userData?.adminDetails?.canManageUsers || isSuperOrAdmin;
  const canManageCases = userData?.adminDetails?.canManageCases || isSuperOrAdmin || isLawyer;
  const canManageBilling = userData?.adminDetails?.canManageBilling || isSuperOrAdmin || isHr;
  const canViewReports = userData?.adminDetails?.canViewReports || isSuperOrAdmin;

  // Check department (for staff)
  const department = userData?.staffDetails?.department || "";

  return {
    // User data
    userData,
    userType,
    primaryRole,
    additionalRoles,
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
    
    // For backward compatibility with existing code
    isAdminOrHr, // Same as before
    isSuperOrAdmin, // Same as before
    isStaff, // Same as before
    isClient, // Same as before
    isVerified, // Same as before
  };
};

// Optional: Create a more specific hook for lawyer-related checks
export const useLawyerHook = () => {
  const { user } = useSelector((state) => state.auth);
  const userData = user?.data || user || {};
  
  return {
    isLawyer: userData?.isLawyer || userData?.role === "lawyer" || userData?.userType === "lawyer",
    practiceAreas: userData?.lawyerDetails?.practiceAreas || [],
    barNumber: userData?.lawyerDetails?.barNumber,
    barAssociation: userData?.lawyerDetails?.barAssociation,
    hourlyRate: userData?.lawyerDetails?.hourlyRate,
    isPartner: userData?.lawyerDetails?.isPartner || false,
    maxCaseload: userData?.lawyerDetails?.maxCaseload || 50,
    availableForNewCases: userData?.lawyerDetails?.availableForNewCases !== false,
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
    preferredContactMethod: userData?.clientDetails?.preferredContactMethod || "email",
  };
};