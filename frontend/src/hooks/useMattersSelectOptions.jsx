import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMatters,
  getMatter,
  searchMatters,
} from "../redux/features/matter/matterSlice";
import apiService from "../services/api";

/**
 * useMattersSelectOptions
 *
 * Pulls matter data from Redux (matterSlice) instead of making raw API calls.
 * Falls back to direct API only for litigation details (no Redux slice for that).
 *
 * @param {object} options
 * @param {string|null} options.matterType  - Filter by matter type (e.g. "litigation")
 * @param {string}      options.status      - Filter by status (default: "active")
 * @param {number}      options.limit       - Max results (default: 50)
 * @param {boolean}     options.autoFetch   - Fetch on mount (default: true)
 * @param {boolean}     options.includeDetails - Include type-specific detail fields (default: false)
 */
const useMattersSelectOptions = (options = {}) => {
  const {
    matterType = null,
    status = "active",
    limit = 50,
    autoFetch = true,
    includeDetails = false,
  } = options;

  const dispatch = useDispatch();

  // ── Pull from Redux ────────────────────────────────────────────────────────
  const reduxMatters = useSelector((state) => state.matter.matters);
  const reduxLoading = useSelector((state) => state.matter.isLoading);
  const reduxError = useSelector((state) => state.matter.message);
  const reduxIsError = useSelector((state) => state.matter.isError);

  // ── Local search state (search does NOT replace the full list) ─────────────
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Map a matter document to a select option ───────────────────────────────
  const mapMatter = useCallback(
    (matter) => ({
      _id: matter._id,
      value: matter._id,
      label: matter.title || matter.matterNumber,
      subtitle: `${matter.matterType} • ${matter.matterNumber}`,
      matterNumber: matter.matterNumber,
      matterType: matter.matterType,
      client: matter.client,
      status: matter.status,
      priority: matter.priority,
      ...(includeDetails && {
        litigationDetail: matter.litigationDetail,
        corporateDetail: matter.corporateDetail,
        propertyDetail: matter.propertyDetail,
      }),
    }),
    [includeDetails],
  );

  // ── Fetch full list via Redux thunk ────────────────────────────────────────
  const fetchMatters = useCallback(
    async (searchText = "") => {
      if (searchText && searchText.length >= 2) {
        // Use the Redux searchMatters thunk for keyword queries
        setSearchLoading(true);
        try {
          const result = await dispatch(
            searchMatters({
              search: searchText,
              limit,
              status,
              ...(matterType && { matterType }),
            }),
          ).unwrap();

          const data = result?.data || (Array.isArray(result) ? result : []);
          setSearchResults(data.map(mapMatter));
        } catch (err) {
          console.error("Matter search failed:", err);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        // Clear search results → fall back to the Redux list
        setSearchResults(null);

        // Only dispatch getMatters if not already loaded or options differ
        await dispatch(
          getMatters({
            limit,
            status,
            ...(matterType && { matterType }),
          }),
        );
      }
    },
    [dispatch, limit, status, matterType, mapMatter],
  );

  // ── Fetch single matter by ID ──────────────────────────────────────────────
  const getMatterById = useCallback(
    async (matterId) => {
      try {
        const result = await dispatch(getMatter(matterId)).unwrap();
        return result?.data?.matter || result?.data || null;
      } catch (err) {
        console.error("Error fetching matter:", err);
        return null;
      }
    },
    [dispatch],
  );

  // ── Fetch litigation details (no Redux slice — direct API) ─────────────────
  const getLitigationDetails = useCallback(async (matterId) => {
    try {
      const response = await apiService.get(`/litigation/${matterId}/details`);
      return response.data?.data?.litigationDetail || null;
    } catch (err) {
      console.error("Error fetching litigation details:", err);
      return null;
    }
  }, []);

  // ── Auto-fetch on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (autoFetch) {
      dispatch(
        getMatters({
          limit,
          status,
          ...(matterType && { matterType }),
        }),
      );
    }
  }, [autoFetch, dispatch, limit, status, matterType]);

  // ── Derive the active list (search results take priority) ─────────────────
  const activeMatters =
    searchResults !== null
      ? searchResults
      : (reduxMatters || []).map(mapMatter);

  // ── Ant Design <Select> options format ────────────────────────────────────
  const mattersOptions = activeMatters.map((matter) => ({
    value: matter.value,
    label: matter.label,
    matter: matter,
    subtitle: matter.subtitle,
    matterType: matter.matterType,
    matterNumber: matter.matterNumber,
  }));

  return {
    matters: activeMatters,
    mattersOptions,
    loading: reduxLoading || searchLoading,
    error: reduxIsError ? reduxError || "Failed to fetch matters" : null,
    fetchMatters, // call with searchText to search, or "" to reset
    getMatterById,
    getLitigationDetails,
  };
};

export default useMattersSelectOptions;
