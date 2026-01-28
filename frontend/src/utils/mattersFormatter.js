// utils/matterFormatter.js

/**
 * Format matter data from API to form structure
 */
export const formatMatterForForm = (matter) => {
  if (!matter) return {};

  return {
    ...matter,
    // Ensure arrays are properly formatted
    opposingParties: matter.opposingParties?.map((p) => p.name) || [],
    objectives: matter.objectives?.map((o) => o.name) || [],
    strengths: matter.strengths?.map((s) => s.name) || [],
    weaknesses: matter.weaknesses?.map((w) => w.name) || [],
    risks: matter.risks?.map((r) => r.name) || [],
    stepsToBeTaken: matter.stepsToBeTaken?.map((s) => s.name) || [],
    // Format account officers as array of IDs
    accountOfficer: matter.accountOfficer?.map((ao) => ao._id || ao) || [],
    // Format client as ID
    client: matter.client?._id || matter.client,
    // Date formatting
    dateOpened: matter.dateOpened ? new Date(matter.dateOpened) : undefined,
    expectedClosureDate: matter.expectedClosureDate
      ? new Date(matter.expectedClosureDate)
      : undefined,
    // Include detail data if exists
    detailData: matter.detailData || {},
  };
};

/**
 * Format form data for API submission
 */
export const formatMatterForAPI = (formData) => {
  const apiData = {
    ...formData,
    // Clean arrays - remove empty strings and convert to schema format
    opposingParties:
      formData.opposingParties
        ?.filter((party) => party?.trim())
        .map((name) => ({ name })) || [],

    objectives:
      formData.objectives
        ?.filter((obj) => obj?.trim())
        .map((name) => ({ name })) || [],

    strengths:
      formData.strengths
        ?.filter((str) => str?.trim())
        .map((name) => ({ name })) || [],

    weaknesses:
      formData.weaknesses
        ?.filter((weak) => weak?.trim())
        .map((name) => ({ name })) || [],

    risks:
      formData.risks
        ?.filter((risk) => risk?.trim())
        .map((name) => ({ name })) || [],

    stepsToBeTaken:
      formData.stepsToBeTaken
        ?.filter((step) => step?.trim())
        .map((name) => ({ name })) || [],

    // Ensure accountOfficer is array of strings
    accountOfficer: Array.isArray(formData.accountOfficer)
      ? formData.accountOfficer.filter((id) => id)
      : formData.accountOfficer
        ? [formData.accountOfficer]
        : [],

    // Remove undefined and null values
    ...Object.fromEntries(
      Object.entries(formData).filter(
        ([_, value]) => value !== undefined && value !== null && value !== "",
      ),
    ),
  };

  // Remove form-specific fields
  delete apiData.detailData;

  return apiData;
};

/**
 * Validate matter form data
 */
export const validateMatterForm = (formData) => {
  const errors = {};

  if (!formData.title?.trim()) {
    errors.title = "Title is required";
  } else if (formData.title.length > 500) {
    errors.title = "Title must be less than 500 characters";
  }

  if (!formData.description?.trim()) {
    errors.description = "Description is required";
  } else if (formData.description.length > 5000) {
    errors.description = "Description must be less than 5000 characters";
  }

  if (!formData.matterType) {
    errors.matterType = "Matter type is required";
  }

  if (!formData.natureOfMatter) {
    errors.natureOfMatter = "Nature of matter is required";
  }

  if (!formData.client) {
    errors.client = "Client is required";
  }

  if (!formData.accountOfficer || formData.accountOfficer.length === 0) {
    errors.accountOfficer = "At least one account officer is required";
  }

  if (formData.matterType === "litigation" && !formData.category) {
    errors.category = "Category is required for litigation matters";
  }

  if (!formData.priority) {
    errors.priority = "Priority is required";
  }

  if (!formData.status) {
    errors.status = "Status is required";
  }

  // Validate objectives if provided
  if (formData.objectives?.some((obj) => !obj?.trim())) {
    errors.objectives = "Objectives cannot be empty";
  }

  return errors;
};
