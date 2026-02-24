import { useState, useEffect, useCallback } from "react";
import apiService from "../services/api";

const useLitigationMattersOptions = (options = {}) => {
  const {
    status = "active",
    limit = 50,
    autoFetch = true,
  } = options;

  const [litigations, setLitigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLitigations = useCallback(async (searchText = "") => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        limit,
        status,
        matterType: "litigation",
        ...(searchText && { search: searchText }),
      };

      const response = await apiService.get("/matters", params);
      const mattersData = response.data?.data || [];

      const mappedLitigations = await Promise.all(
        mattersData.map(async (matter) => {
          let litigationDetail = null;
          try {
            const detailResponse = await apiService.get(`/litigation/${matter._id}/details`);
            litigationDetail = detailResponse.data?.data?.litigationDetail;
          } catch (e) {
            // Ignore detail fetch errors
          }

          return {
            _id: matter._id,
            value: matter._id,
            label: matter.title || matter.matterNumber,
            subtitle: `${matter.matterNumber} • ${matter.status}`,
            matterNumber: matter.matterNumber,
            matterType: matter.matterType,
            status: matter.status,
            priority: matter.priority,
            client: matter.client,
            // Litigation specific fields
            suitNo: litigationDetail?.suitNo,
            courtName: litigationDetail?.courtName,
            courtNo: litigationDetail?.courtNo,
            division: litigationDetail?.division,
            courtLocation: litigationDetail?.courtLocation,
            currentStage: litigationDetail?.currentStage,
            nextHearingDate: litigationDetail?.nextHearingDate,
            litigationDetailId: litigationDetail?._id,
          };
        })
      );

      setLitigations(mappedLitigations);
      return mappedLitigations;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch litigation matters");
      console.error("Error fetching litigation matters:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [limit, status]);

  useEffect(() => {
    if (autoFetch) {
      fetchLitigations();
    }
  }, [autoFetch, fetchLitigations]);

  const litigationOptions = litigations.map((lit) => ({
    value: lit.value,
    label: lit.label,
    subtitle: lit.subtitle,
    matter: lit,
    suitNo: lit.suitNo,
    courtName: lit.courtName,
    nextHearingDate: lit.nextHearingDate,
  }));

  return {
    litigations,
    litigationOptions,
    loading,
    error,
    fetchLitigations,
  };
};

export default useLitigationMattersOptions;
