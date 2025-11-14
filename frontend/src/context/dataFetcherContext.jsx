import PropTypes from "prop-types";
import { createContext, useCallback, useState, useRef } from "react";
import axios from "axios";

// Create a context
const DataContext = createContext();

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

// ✅ Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();
const pendingRequests = new Map(); // Prevent duplicate concurrent requests

const DataFetcherContext = ({ children }) => {
  const [state, setState] = useState({
    cases: [],
    users: [],
    reports: [],
    tasks: [],
    leaveApps: [],
    leaveBalance: [],
    clients: [],
    invoices: [],
    causeList: [],
    payments: [],
    documents: [],
    todos: [],
    totalPaymentWeekToYear: [],
    totalBalanceOnPayments: [],
    clientPayments: [],
    casesByStatus: [],
    casesByCourt: [],
    casesByNature: [],
    casesByRating: [],
    casesByMode: [],
    casesByCategory: [],
    casesByClient: [],
    casesByAccountOfficer: [],
    monthlyNewCases: [],
    yearlyNewCases: [],
    deletedCases: [],
    deletedReports: [],
    accountOfficerAggregates: [],
    events: [],
    notes: [],
    documentRecord: [],
    loading: {},
    error: {},
  });

  // ✅ Track mounted state to prevent memory leaks
  const isMountedRef = useRef(true);

  // ✅ Abort controller for cancelling requests
  const abortControllersRef = useRef(new Map());

  /**
   * ✅ Check if cached data is still valid
   */
  const isCacheValid = (cacheKey) => {
    const cached = cache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < CACHE_DURATION;
  };

  /**
   * ✅ Get cached data
   */
  const getCachedData = (cacheKey) => {
    if (isCacheValid(cacheKey)) {
      return cache.get(cacheKey).data;
    }
    return null;
  };

  /**
   * ✅ Set cache data
   */
  const setCacheData = (cacheKey, data) => {
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  };

  /**
   * ✅ Clear cache for specific key or all
   */
  const clearCache = useCallback((key = null) => {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }, []);

  /**
   * ✅ Fetch data with caching, deduplication, and cancellation
   */
  const fetchData = useCallback(async (endpoint, key, options = {}) => {
    const { skipCache = false, forceRefresh = false, params = {} } = options;

    const cacheKey = `${endpoint}-${JSON.stringify(params)}`;

    // ✅ Check cache first (unless skipCache or forceRefresh)
    if (!skipCache && !forceRefresh) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log(`📦 Using cached data for: ${key}`);
        setState((prevState) => ({
          ...prevState,
          [key]: cachedData,
          error: { ...prevState.error, [key]: "" },
        }));
        return cachedData;
      }
    }

    // ✅ Check if same request is already pending
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Request already pending for: ${key}`);
      return pendingRequests.get(cacheKey);
    }

    // ✅ Cancel previous request for this key if exists
    if (abortControllersRef.current.has(key)) {
      abortControllersRef.current.get(key).abort();
    }

    // ✅ Create new abort controller
    const abortController = new AbortController();
    abortControllersRef.current.set(key, abortController);

    // Set loading state
    setState((prevState) => ({
      ...prevState,
      loading: { ...prevState.loading, [key]: true },
      error: { ...prevState.error, [key]: "" },
    }));

    // ✅ Create the fetch promise
    const fetchPromise = (async () => {
      try {
        console.log(`🔄 Fetching: ${key} from ${endpoint}`);

        const response = await axios.get(`${baseURL}/${endpoint}`, {
          params,
          withCredentials: true,
          signal: abortController.signal,
          timeout: 30000, // 30 second timeout
        });

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState((prevState) => ({
            ...prevState,
            [key]: response.data,
            loading: { ...prevState.loading, [key]: false },
            error: { ...prevState.error, [key]: "" },
          }));

          // ✅ Cache the response
          setCacheData(cacheKey, response.data);

          console.log(`✅ Fetched: ${key}`);
        }

        return response.data;
      } catch (err) {
        // Don't set error if request was cancelled
        if (axios.isCancel(err) || err.name === "CanceledError") {
          console.log(`🚫 Request cancelled for: ${key}`);
          return null;
        }

        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          `Failed to fetch ${key}`;

        if (isMountedRef.current) {
          setState((prevState) => ({
            ...prevState,
            error: { ...prevState.error, [key]: errorMessage },
            loading: { ...prevState.loading, [key]: false },
          }));
        }

        console.error(`❌ Error fetching ${key}:`, errorMessage);
        throw err;
      } finally {
        // Clean up
        pendingRequests.delete(cacheKey);
        abortControllersRef.current.delete(key);
      }
    })();

    // ✅ Store pending request to prevent duplicates
    pendingRequests.set(cacheKey, fetchPromise);

    return fetchPromise;
  }, []);

  /**
   * ✅ Batch fetch multiple endpoints
   */
  const fetchBatch = useCallback(
    async (requests) => {
      console.log(`📦 Batch fetching ${requests.length} endpoints...`);

      const promises = requests.map(({ endpoint, key, options }) =>
        fetchData(endpoint, key, options).catch((err) => {
          console.error(`Failed to fetch ${key}:`, err);
          return null;
        })
      );

      const results = await Promise.allSettled(promises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      console.log(
        `✅ Batch fetch complete: ${successful}/${requests.length} successful`
      );

      return results;
    },
    [fetchData]
  );

  /**
   * ✅ Refresh specific data
   */
  const refreshData = useCallback(
    (endpoint, key) => {
      return fetchData(endpoint, key, { forceRefresh: true });
    },
    [fetchData]
  );

  /**
   * ✅ Prefetch data (fetch without setting loading state)
   */
  const prefetchData = useCallback(async (endpoint, key) => {
    const cacheKey = `${endpoint}`;

    // Only prefetch if not in cache
    if (!isCacheValid(cacheKey)) {
      try {
        const response = await axios.get(`${baseURL}/${endpoint}`, {
          withCredentials: true,
        });
        setCacheData(cacheKey, response.data);
        console.log(`🔮 Prefetched: ${key}`);
      } catch (err) {
        console.error(`Failed to prefetch ${key}:`, err.message);
      }
    }
  }, []);

  /**
   * ✅ Cancel all pending requests
   */
  const cancelAllRequests = useCallback(() => {
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
    pendingRequests.clear();
    console.log("🚫 All requests cancelled");
  }, []);

  // ✅ Cleanup on unmount
  useState(() => {
    return () => {
      isMountedRef.current = false;
      cancelAllRequests();
      cache.clear();
    };
  }, [cancelAllRequests]);

  const contextValue = {
    ...state,
    fetchData,
    fetchBatch,
    refreshData,
    prefetchData,
    clearCache,
    cancelAllRequests,
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
};

DataFetcherContext.propTypes = {
  children: PropTypes.node.isRequired,
};

export { DataContext, DataFetcherContext };
