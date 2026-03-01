// hooks/useFirmStorage.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

const useFirmStorage = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStorageInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${baseURL}/files/firm-storage-info`, {
        withCredentials: true,
      });

      if (response.data?.status === "success") {
        setStorageInfo(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching storage info:", err);
      setError(err.response?.data?.message || "Failed to load storage info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo]);

  // Force refresh - call this after upload/delete
  const refresh = useCallback(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo]);

  // Helper to format storage display
  const formatStorage = (gb) => {
    if (gb < 1) {
      return `${(gb * 1024).toFixed(1)} MB`;
    }
    return `${gb} GB`;
  };

  return {
    storageInfo,
    loading,
    error,
    refresh,
    isNearLimit: storageInfo?.isNearLimit || false,
    isAtLimit: storageInfo?.isAtLimit || false,
    usagePercentage: storageInfo?.usagePercentage || 0,
    storageUsedGB: storageInfo?.storageUsedGB || 0,
    storageUsedMB: storageInfo?.storageUsedMB || 0,
    storageLimitGB: storageInfo?.storageLimitGB || 0,
    storageAvailableGB: storageInfo?.storageAvailableGB || 0,
    plan: storageInfo?.plan || "FREE",
    totalFiles: storageInfo?.totalFiles || 0,
    formatStorage,
  };
};

export default useFirmStorage;
