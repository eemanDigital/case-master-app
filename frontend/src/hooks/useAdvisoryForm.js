// hooks/useAdvisoryForm.js
import { useState, useCallback, useRef } from "react";
import { debounce } from "lodash";

export const useAdvisoryForm = (initialData = null) => {
  const [formData, setFormData] = useState(() => ({
    advisoryType: initialData?.advisoryType || "legal_opinion",
    requestDescription: initialData?.requestDescription || "",
    scope: initialData?.scope || "",
    researchNotes: initialData?.researchNotes || "",
    jurisdiction: initialData?.jurisdiction || [],
    applicableLaws: initialData?.applicableLaws || [],
    regulatoryBodies: initialData?.regulatoryBodies || [],
    researchQuestions: initialData?.researchQuestions || [],
    keyFindings: initialData?.keyFindings || [],
    legalPrecedents: initialData?.legalPrecedents || [],
    deliverables: initialData?.deliverables || [],
    complianceChecklist: initialData?.complianceChecklist || [],
    opinion: initialData?.opinion || { confidence: "medium" },
    recommendations: initialData?.recommendations || [],
    riskAssessment: initialData?.riskAssessment || { overallRisk: "medium" },
    requestDate: initialData?.requestDate || new Date().toISOString(),
    targetDeliveryDate: initialData?.targetDeliveryDate || null,
    actualDeliveryDate: initialData?.actualDeliveryDate || null,
    otherAdvisoryType: initialData?.otherAdvisoryType || "",
  }));

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // ✅ FIX: Create debounced function outside of useCallback
  // The debounced function needs to be stable across renders
  const debouncedUpdateRef = useRef(
    debounce((field, value, setFormData) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }, 300),
  );

  const debouncedNestedUpdateRef = useRef(
    debounce((parent, field, value, setFormData) => {
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value,
        },
      }));
    }, 300),
  );

  // ✅ FIX: useCallback wraps the call to the debounced function
  const updateField = useCallback((field, value) => {
    debouncedUpdateRef.current(field, value, setFormData);
  }, []);

  const updateNestedField = useCallback((parent, field, value) => {
    debouncedNestedUpdateRef.current(parent, field, value, setFormData);
  }, []);

  const addArrayItem = useCallback((field, item) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), item],
    }));
  }, []);

  const updateArrayItem = useCallback((field, index, updatedItem) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = { ...newArray[index], ...updatedItem };
      return {
        ...prev,
        [field]: newArray,
      };
    });
  }, []);

  const removeArrayItem = useCallback((field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      advisoryType: "legal_opinion",
      requestDescription: "",
      scope: "",
      researchNotes: "",
      jurisdiction: [],
      applicableLaws: [],
      regulatoryBodies: [],
      researchQuestions: [],
      keyFindings: [],
      legalPrecedents: [],
      deliverables: [],
      complianceChecklist: [],
      opinion: { confidence: "medium" },
      recommendations: [],
      riskAssessment: { overallRisk: "medium" },
      requestDate: new Date().toISOString(),
      targetDeliveryDate: null,
      actualDeliveryDate: null,
      otherAdvisoryType: "",
    });
  }, []);

  const getFormData = useCallback(() => formDataRef.current, []);

  return {
    formData,
    updateField,
    updateNestedField,
    addArrayItem,
    updateArrayItem,
    removeArrayItem,
    resetForm,
    getFormData,
  };
};
