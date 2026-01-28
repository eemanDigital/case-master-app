// utils/userDataHelper.js - VERIFY THIS IS CORRECT

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
    dateOfBirth: values.dateOfBirth?.format
      ? values.dateOfBirth.format("YYYY-MM-DD")
      : values.dateOfBirth,
    isActive: values.isActive ?? true,
    position: values.position,
    role: values.role || values.userType,
    isLawyer: values.hasLawyerPrivileges || values.userType === "lawyer",
    additionalRoles: values.additionalRoles || [],
  };

  // ✅ Build professionalInfo object
  if (values.bio) {
    baseData.professionalInfo = {
      bio: values.bio,
    };
  }

  // Add type-specific data AS NESTED OBJECTS
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
      // ✅ CRITICAL: Send as complete nested object
      baseData.lawyerDetails = {
        barNumber: values.barNumber,
        barAssociation: values.barAssociation,
        yearOfCall: values.yearOfCall?.format
          ? values.yearOfCall.format("YYYY-MM-DD")
          : values.yearOfCall,
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

      console.log("✅ Added lawyer details:", baseData.lawyerDetails);
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

  // ✅ If hasLawyerPrivileges is true but userType is not lawyer
  if (values.hasLawyerPrivileges && values.userType !== "lawyer") {
    baseData.isLawyer = true;
    if (!baseData.additionalRoles.includes("lawyer")) {
      baseData.additionalRoles.push("lawyer");
    }

    baseData.lawyerDetails = {
      barNumber: values.barNumber,
      barAssociation: values.barAssociation,
      yearOfCall: values.yearOfCall?.format
        ? values.yearOfCall.format("YYYY-MM-DD")
        : values.yearOfCall,
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
    };
    console.log("✅ Added lawyer privileges to non-lawyer user");
  }

  // ✅ Add admin privileges
  if (
    values.hasAdminPrivileges &&
    !["admin", "super-admin"].includes(values.userType)
  ) {
    if (!baseData.additionalRoles.includes("admin")) {
      baseData.additionalRoles.push("admin");
    }

    baseData.adminDetails = {
      adminLevel: "firm",
      canManageUsers: values.canManageUsers || false,
      canManageCases: values.canManageCases || false,
      canManageBilling: values.canManageBilling || false,
      canViewReports: values.canViewReports || false,
      systemAccessLevel: values.systemAccessLevel || "restricted",
    };
  }

  console.log("📦 Final prepared data:", baseData);
  return baseData;
};
