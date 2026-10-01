// utils/userDataHelper.js - NEW USER MODEL
// Client and staff accounts are distinguished by userType.
// "role" is a professional function ("client" for client accounts,
// otherwise one of the professional roles). "adminLevel" is the
// administrative authority: "none" | "admin" | "super-admin".

export const prepareUserData = (values) => {
  console.log("🔧 prepareUserData - Input values:", values);

  const isClient = values.userType === "client";
  const role = isClient ? "client" : values.role || "lawyer";
  const adminLevel = isClient ? "none" : values.adminLevel || "none";

  const baseData = {
    firstName: values.firstName,
    lastName: values.lastName,
    middleName: values.middleName,
    email: values.email,
    password: values.password,
    passwordConfirm: values.passwordConfirm,
    userType: values.userType,
    role,
    adminLevel,
    phone: values.phone,
    address: values.address,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth?.format
      ? values.dateOfBirth.format("YYYY-MM-DD")
      : values.dateOfBirth,
    isActive: values.isActive ?? true,
    position: values.position,
  };

  // ✅ Build professionalInfo object
  if (values.bio) {
    baseData.professionalInfo = {
      bio: values.bio,
    };
  }

  if (isClient) {
    // A client is either a person or an organisation. Organisation-only fields
    // are sent exclusively for corporate / government / NGO accounts so an
    // individual client never carries company data.
    const category = values.clientCategory || "individual";
    const isOrganisation =
      category === "corporate" || category === "government" || category === "ngo";

    baseData.clientDetails = {
      clientCategory: category,
      preferredContactMethod: values.preferredContactMethod || "email",
      billingAddress: values.billingAddress || values.address,
      referralSource: values.referralSource,
      clientNotes: values.clientNotes,
      ...(values.clientSince
        ? {
            clientSince: values.clientSince.format
              ? values.clientSince.format("YYYY-MM-DD")
              : values.clientSince,
          }
        : {}),
      ...(isOrganisation
        ? {
            company: values.company,
            industry: values.industry,
            taxId: values.taxId,
          }
        : {}),
    };
    console.log("✅ Added client details");
  } else if (role === "lawyer") {
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
  } else {
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
  }

  console.log("📦 Final prepared data:", baseData);
  return baseData;
};