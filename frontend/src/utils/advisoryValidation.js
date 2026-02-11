// utils/advisoryValidation.js

export const validateAdvisoryForm = (values) => {
  const errors = {};

  if (!values.advisoryType) {
    errors.advisoryType = "Advisory type is required";
  }

  if (values.advisoryType === "other" && !values.otherAdvisoryType?.trim()) {
    errors.otherAdvisoryType = "Please specify the advisory type";
  }

  if (!values.requestDescription?.trim()) {
    errors.requestDescription = "Request description is required";
  } else if (values.requestDescription.length > 5000) {
    errors.requestDescription =
      "Request description must be less than 5000 characters";
  }

  if (values.scope && values.scope.length > 5000) {
    errors.scope = "Scope must be less than 5000 characters";
  }

  if (values.researchNotes && values.researchNotes.length > 10000) {
    errors.researchNotes = "Research notes must be less than 10000 characters";
  }

  if (values.opinion?.summary && values.opinion.summary.length > 5000) {
    errors.opinion = errors.opinion || {};
    errors.opinion.summary = "Summary must be less than 5000 characters";
  }

  if (values.opinion?.conclusion && values.opinion.conclusion.length > 2000) {
    errors.opinion = errors.opinion || {};
    errors.opinion.conclusion = "Conclusion must be less than 2000 characters";
  }

  // Validate research questions
  if (values.researchQuestions) {
    const researchQuestionErrors = [];
    values.researchQuestions.forEach((q, index) => {
      const questionErrors = {};
      if (!q.question?.trim()) {
        questionErrors.question = "Question is required";
      }
      if (questionErrors.question) {
        researchQuestionErrors[index] = questionErrors;
      }
    });
    if (researchQuestionErrors.length > 0) {
      errors.researchQuestions = researchQuestionErrors;
    }
  }

  // Validate deliverables
  if (values.deliverables) {
    const deliverableErrors = [];
    values.deliverables.forEach((d, index) => {
      const deliverableError = {};
      if (!d.title?.trim()) {
        deliverableError.title = "Title is required";
      }
      if (deliverableError.title) {
        deliverableErrors[index] = deliverableError;
      }
    });
    if (deliverableErrors.length > 0) {
      errors.deliverables = deliverableErrors;
    }
  }

  return errors;
};

export const formatAdvisoryForSubmit = (values) => {
  const formatted = { ...values };

  // Helper function to format dates
  const formatDate = (date) => {
    if (!date) return null;
    if (typeof date.toISOString === "function") {
      return date.toISOString();
    }
    if (typeof date === "string") {
      return date;
    }
    return null;
  };

  // Convert date fields to ISO strings
  const dateFields = [
    "requestDate",
    "targetDeliveryDate",
    "actualDeliveryDate",
  ];
  dateFields.forEach((field) => {
    formatted[field] = formatDate(formatted[field]);
  });

  // Format nested date fields in deliverables
  if (formatted.deliverables && Array.isArray(formatted.deliverables)) {
    formatted.deliverables = formatted.deliverables.map((d) => ({
      ...d,
      dueDate: formatDate(d.dueDate),
      deliveryDate: formatDate(d.deliveryDate),
    }));
  }

  // Format nested date fields in compliance checklist
  if (
    formatted.complianceChecklist &&
    Array.isArray(formatted.complianceChecklist)
  ) {
    formatted.complianceChecklist = formatted.complianceChecklist.map((c) => ({
      ...c,
      dueDate: formatDate(c.dueDate),
    }));
  }

  // Ensure arrays are present
  const arrayFields = [
    "jurisdiction",
    "applicableLaws",
    "regulatoryBodies",
    "researchQuestions",
    "keyFindings",
    "legalPrecedents",
    "deliverables",
    "complianceChecklist",
    "recommendations",
  ];

  arrayFields.forEach((field) => {
    if (!Array.isArray(formatted[field])) {
      formatted[field] = [];
    }
  });

  // Ensure nested objects are present
  if (!formatted.opinion) formatted.opinion = {};
  if (!formatted.riskAssessment) formatted.riskAssessment = {};

  return formatted;
};
