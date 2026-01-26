// utils/userDataHelper.js - UPDATED WITH LOGGING
export const prepareUserData = (values) => {
  console.log("🔧 prepareUserData - Input values:", values);

  const baseData = {
    firstName: values.firstName,
    lastName: values.lastName,
    middleName: values.middleName,
    email: values.email,
    password: values.password,
    passwordConfirm: values.passwordConfirm,
    userType: values.userType,
    phone: values.phone,
    address: values.address,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth?.format ? values.dateOfBirth.format("YYYY-MM-DD") : values.dateOfBirth,
    isActive: values.isActive ?? true,
    position: values.position,
  };

  // ✅ Handle multiple roles/privileges
  const additionalRoles = [];

  // Base role from userType
  if (values.userType === "client") {
    baseData.role = "client";
  } else if (values.userType === "lawyer" || values.hasLawyerPrivileges) {
    baseData.role = "lawyer";
    baseData.isLawyer = true;
  } else if (values.userType === "admin") {
    baseData.role = "admin";
  } else if (values.userType === "super-admin") {
    baseData.role = "super-admin";
  } else {
    baseData.role = values.role || "staff";
  }

  // ✅ Add admin privileges if granted
  if (values.hasAdminPrivileges && values.userType !== "admin" && values.userType !== "super-admin") {
    additionalRoles.push("admin");
    baseData.adminDetails = {
      adminLevel: "firm",
      canManageUsers: values.canManageUsers || false,
      canManageCases: values.canManageCases || false,
      canManageBilling: values.canManageBilling || false,
      canViewReports: values.canViewReports || false,
      systemAccessLevel: values.systemAccessLevel || "restricted",
    };
  }

  // ✅ Add HR privileges if granted
  if (values.hasHrPrivileges && values.role !== "hr") {
    additionalRoles.push("hr");
  }

  // Store additional roles
  if (additionalRoles.length > 0) {
    baseData.additionalRoles = additionalRoles;
  }

  // Add type-specific data
  switch (values.userType) {
    case "client":
      baseData.clientDetails = {
        company: values.company,
        industry: values.industry,
        clientCategory: values.clientCategory,
        preferredContactMethod: values.preferredContactMethod,
        billingAddress: values.billingAddress || values.address,
        referralSource: values.referralSource,
      };
      console.log("✅ Added client details");
      break;

    case "staff":
      baseData.staffDetails = {
        department: values.department,
        designation: values.designation,
        employmentType: values.employmentType,
        workSchedule: values.workSchedule,
        ...(values.skills && {
          skills: values.skills.split(",").map((s) => s.trim()),
        }),
      };
      console.log("✅ Added staff details");
      break;

    case "lawyer":
      baseData.lawyerDetails = {
        barNumber: values.barNumber,
        barAssociation: values.barAssociation,
        yearOfCall: values.yearOfCall?.format ? values.yearOfCall.format("YYYY-MM-DD") : values.yearOfCall,
        practiceAreas: values.practiceAreas,
        hourlyRate: parseFloat(values.hourlyRate) || 0,
        specialization: values.specialization,
        lawSchool: {
          name: values.lawSchoolAttended,
          graduationYear: values.lawSchoolGraduationYear,
          degree: values.lawSchoolDegree,
        },
        undergraduateSchool: {
          name: values.universityAttended,
          graduationYear: values.universityGraduationYear,
          degree: values.universityDegree,
        },
        isPartner: values.isPartner || false,
        ...(values.isPartner && {
          partnershipPercentage: values.partnershipPercentage,
        }),
      };
      baseData.professionalInfo = {
        bio: values.bio,
        ...(values.education && { education: values.education }),
        ...(values.workExperience && {
          workExperience: values.workExperience,
        }),
      };
      console.log("✅ Added lawyer details");
      break;

    case "admin":
      baseData.adminDetails = {
        adminLevel: values.adminLevel || "firm",
        canManageUsers: values.canManageUsers || false,
        canManageCases: values.canManageCases || false,
        canManageBilling: values.canManageBilling || false,
        canViewReports: values.canViewReports || false,
        systemAccessLevel: values.systemAccessLevel || "restricted",
      };
      console.log("✅ Added admin details");
      break;
  }

  // ✅ If hasLawyerPrivileges is true but userType is not lawyer, add lawyer details
  if (values.hasLawyerPrivileges && values.userType !== "lawyer") {
    baseData.isLawyer = true;
    additionalRoles.push("lawyer");
    baseData.lawyerDetails = {
      barNumber: values.barNumber,
      barAssociation: values.barAssociation,
      yearOfCall: values.yearOfCall?.format ? values.yearOfCall.format("YYYY-MM-DD") : values.yearOfCall,
      practiceAreas: values.practiceAreas,
      hourlyRate: parseFloat(values.hourlyRate) || 0,
      specialization: values.specialization,
    };
    console.log("✅ Added lawyer privileges to non-lawyer user");
  }

  console.log("📦 Final prepared data:", baseData);
  return baseData;
};