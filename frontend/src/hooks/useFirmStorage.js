// hooks/useFirmStorage.js
import { useState, useEffect } from "react";
import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

const useFirmStorage = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStorageInfo = async () => {
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
  };

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  const refresh = () => {
    fetchStorageInfo();
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
    storageLimitGB: storageInfo?.storageLimitGB || 0,
    storageAvailableGB: storageInfo?.storageAvailableGB || 0,
    plan: storageInfo?.plan || "FREE",
  };
};

export default useFirmStorage;
