import { useState, useCallback, useEffect } from "react";
import { message, Modal } from "antd";
import api from "../services/api";
import { useSelector } from "react-redux";

export const useMatters = () => {
  const [matters, setMatters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Fetch matters with filters
  const fetchMatters = useCallback(
    async (params = {}) => {
      setLoading(true);
      try {
        const response = await api.get("/matters", {
          params: {
            page: params.page || pagination.page,
            limit: params.limit || pagination.limit,
            ...filters,
            ...params,
          },
        });

        setMatters(response.data.data || []);
        setPagination(response.data.pagination || {});
        return response.data;
      } catch (error) {
        message.error("Failed to fetch matters");
        console.error("Error fetching matters:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination],
  );

  // Fetch single matter with details
  const fetchMatterById = useCallback(async (id, includeDetails = true) => {
    setDetailLoading(true);
    try {
      const include = includeDetails ? "documents,tasks,events,invoices" : "";
      const response = await api.get(`/matters/${id}`, {
        params: { include },
      });
      setSelectedMatter(response.data.data.matter);
      return response.data.data.matter;
    } catch (error) {
      message.error("Failed to fetch matter details");
      console.error("Error fetching matter:", error);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Create new matter
  const createMatter = useCallback(
    async (matterData) => {
      setLoading(true);
      try {
        const response = await api.post("/matters", matterData);
        message.success("Matter created successfully");

        // Refresh the list
        await fetchMatters({ page: 1 });

        return response.data.data.matter;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Failed to create matter";
        message.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchMatters],
  );

  // Update matter
  const updateMatter = useCallback(
    async (id, updates) => {
      setLoading(true);
      try {
        const response = await api.patch(`/matters/${id}`, updates);
        message.success("Matter updated successfully");

        // Update in local state
        setMatters((prev) =>
          prev.map((matter) =>
            matter._id === id ? { ...matter, ...updates } : matter,
          ),
        );

        if (selectedMatter?._id === id) {
          setSelectedMatter((prev) => ({ ...prev, ...updates }));
        }

        return response.data.data.matter;
      } catch (error) {
        message.error("Failed to update matter");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [selectedMatter],
  );

  // Soft delete matter
  const deleteMatter = useCallback(
    async (id) => {
      return new Promise((resolve, reject) => {
        Modal.confirm({
          title: "Are you sure you want to delete this matter?",
          content: "This action can be undone by restoring from the archive.",
          okText: "Yes, Delete",
          okType: "danger",
          cancelText: "No",
          async onOk() {
            try {
              await api.delete(`/matters/${id}`);
              message.success("Matter deleted successfully");

              // Remove from local state
              setMatters((prev) => prev.filter((matter) => matter._id !== id));
              if (selectedMatter?._id === id) {
                setSelectedMatter(null);
              }

              resolve(true);
            } catch (error) {
              message.error("Failed to delete matter");
              reject(error);
            }
          },
          onCancel() {
            resolve(false);
          },
        });
      });
    },
    [selectedMatter],
  );

  // Restore matter
  const restoreMatter = useCallback(
    async (id) => {
      try {
        await api.patch(`/matters/${id}/restore`);
        message.success("Matter restored successfully");

        // Refresh the list
        await fetchMatters({ page: pagination.page });

        return true;
      } catch (error) {
        message.error("Failed to restore matter");
        return false;
      }
    },
    [fetchMatters, pagination.page],
  );

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Get matter statistics
  const getStats = useCallback(async () => {
    try {
      const response = await api.get("/matters/stats");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      return null;
    }
  }, []);

  // Get "My Matters"
  const getMyMatters = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get("/matters/my-matters", { params });
      setMatters(response.data.data || []);
      setPagination(response.data.pagination || {});
      return response.data;
    } catch (error) {
      message.error("Failed to fetch your matters");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk operations
  const bulkUpdate = useCallback(
    async (matterIds, updates) => {
      try {
        await api.patch("/matters/bulk-update", { matterIds, updates });
        message.success("Matters updated successfully");

        // Refresh the list
        await fetchMatters({ page: pagination.page });

        return true;
      } catch (error) {
        message.error("Failed to update matters");
        return false;
      }
    },
    [fetchMatters, pagination.page],
  );

  // Initialize
  useEffect(() => {
    fetchMatters();
  }, [filters, pagination.page, pagination.limit]);

  return {
    matters,
    loading,
    pagination,
    filters,
    selectedMatter,
    detailLoading,
    fetchMatters,
    fetchMatterById,
    createMatter,
    updateMatter,
    deleteMatter,
    restoreMatter,
    updateFilters,
    clearFilters,
    getStats,
    getMyMatters,
    bulkUpdate,
    setPagination,
    setSelectedMatter,
  };
};

// Hook for matter form handling
export const useMatterForm = (initialValues = {}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors],
  );

  const handleNestedChange = useCallback((parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  }, []);

  const handleArrayChange = useCallback((field, index, value) => {
    setFormData((prev) => {
      const newArray = [...(prev[field] || [])];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray,
      };
    });
  }, []);

  const addArrayItem = useCallback((field, defaultValue = {}) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), defaultValue],
    }));
  }, []);

  const removeArrayItem = useCallback((field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    // Required fields validation
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.description?.trim())
      newErrors.description = "Description is required";
    if (!formData.matterType) newErrors.matterType = "Matter type is required";
    if (!formData.client) newErrors.client = "Client is required";
    if (!formData.accountOfficer?.length)
      newErrors.accountOfficer = "At least one account officer is required";

    // Max length validation
    if (formData.title?.length > 500)
      newErrors.title = "Title must be less than 500 characters";
    if (formData.description?.length > 5000)
      newErrors.description = "Description must be less than 5000 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback((newValues = {}) => {
    setFormData(newValues);
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    handleChange,
    handleNestedChange,
    handleArrayChange,
    addArrayItem,
    removeArrayItem,
    validate,
    reset,
    setFormData,
    setErrors,
  };
};
