// ============================================================
// ADVISORY SLICE - OPTIMIZED
// RTK-based slice with normalized state, per-operation loading
// flags, optimistic updates, and memoized selectors.
// ============================================================

import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import advisoryService from "./advisoryService";
import {
  ADVISORY_SLICE_NAME,
  ADVISORY_LOADING_KEYS,
  ADVISORY_PAGINATION_DEFAULTS,
} from "../../../utils/advisoryConstants";

// ── Initial State ─────────────────────────────────────────────
const initialState = {
  // Paginated matter list
  matters: [],
  pagination: {
    page: ADVISORY_PAGINATION_DEFAULTS.PAGE,
    limit: ADVISORY_PAGINATION_DEFAULTS.LIMIT,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },

  // Current open advisory detail (by matterId)
  currentDetail: null,

  // Search results (separate from list so they don't clobber it)
  searchResults: [],
  searchPagination: null,

  // Stats / dashboard
  stats: null,

  // Active filters (kept in slice so components can read them)
  filters: {
    page: ADVISORY_PAGINATION_DEFAULTS.PAGE,
    limit: ADVISORY_PAGINATION_DEFAULTS.LIMIT,
    sort: ADVISORY_PAGINATION_DEFAULTS.SORT,
    status: "",
    advisoryType: "",
    industry: "",
    search: "",
    includeDeleted: false,
    onlyDeleted: false,
  },

  // Granular loading flags — one key per operation
  loading: Object.keys(ADVISORY_LOADING_KEYS).reduce((acc, key) => {
    acc[ADVISORY_LOADING_KEYS[key]] = false;
    return acc;
  }, {}),

  // Per-operation errors (null = no error)
  errors: Object.keys(ADVISORY_LOADING_KEYS).reduce((acc, key) => {
    acc[ADVISORY_LOADING_KEYS[key]] = null;
    return acc;
  }, {}),
};

// ── Helpers ───────────────────────────────────────────────────

/** Extract a serializable error message from any thrown value. */
const extractError = (err) =>
  err?.response?.data?.message ||
  err?.message ||
  "An unexpected error occurred";

/**
 * ✅ OPTIMIZED: Universal thunk case handler
 * Replaces buildLoadingHandlers pattern with a single reusable function
 */
const addThunkCases = (builder, thunk, loadingKey, onFulfilled) => {
  builder
    .addCase(thunk.pending, (state) => {
      state.loading[loadingKey] = true;
      state.errors[loadingKey] = null;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.loading[loadingKey] = false;
      onFulfilled(state, action);
    })
    .addCase(thunk.rejected, (state, { payload }) => {
      state.loading[loadingKey] = false;
      state.errors[loadingKey] = payload;
    });
};

/**
 * Helper to sync detail updates with matters list
 * Keeps the list and detail in sync when detail is updated
 */
const syncDetailWithMatters = (state, updatedDetail) => {
  if (!updatedDetail) return;

  const matterId = updatedDetail.matterId?.toString();
  if (!matterId) return;

  const idx = state.matters.findIndex((m) => m._id === matterId);
  if (idx !== -1) {
    state.matters[idx] = {
      ...state.matters[idx],
      advisoryDetail: updatedDetail,
      isDeleted: updatedDetail.isDeleted || false,
      status: updatedDetail.matter?.status || state.matters[idx].status,
    };
  }
};

// ── Async Thunks ──────────────────────────────────────────────

// --- Listing & Search ---

export const fetchAllAdvisoryMatters = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/fetchAll`,
  async (params, { rejectWithValue }) => {
    try {
      return await advisoryService.getAllAdvisoryMatters(params);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const searchAdvisoryMatters = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/search`,
  async ({ criteria, options }, { rejectWithValue }) => {
    try {
      return await advisoryService.searchAdvisoryMatters(criteria, options);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const fetchAdvisoryStats = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/fetchStats`,
  async (_, { rejectWithValue }) => {
    try {
      return await advisoryService.getAdvisoryStats();
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

// --- Advisory Details CRUD ---

export const fetchAdvisoryDetails = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/fetchDetails`,
  async (matterId, { rejectWithValue }) => {
    try {
      return await advisoryService.getAdvisoryDetails(matterId);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const createAdvisoryDetails = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/createDetails`,
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.createAdvisoryDetails(matterId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const updateAdvisoryDetails = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/updateDetails`,
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.updateAdvisoryDetails(matterId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const deleteAdvisoryDetails = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/deleteDetails`,
  async ({ matterId, deletionType = "soft" }, { rejectWithValue }) => {
    try {
      return await advisoryService.deleteAdvisoryDetails(
        matterId,
        deletionType,
      );
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const restoreAdvisoryDetails = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/restoreDetails`,
  async (matterId, { rejectWithValue }) => {
    try {
      return await advisoryService.restoreAdvisoryDetails(matterId);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const completeAdvisory = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/complete`,
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.completeAdvisory(matterId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

// --- Research Questions ---

export const addResearchQuestion = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/addResearchQuestion`,
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.addResearchQuestion(matterId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const updateResearchQuestion = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/updateResearchQuestion`,
  async ({ matterId, questionId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.updateResearchQuestion(
        matterId,
        questionId,
        data,
      );
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const deleteResearchQuestion = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/deleteResearchQuestion`,
  async ({ matterId, questionId }, { rejectWithValue }) => {
    try {
      return await advisoryService.deleteResearchQuestion(matterId, questionId);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

// --- Key Findings ---

export const addKeyFinding = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/addKeyFinding`,
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.addKeyFinding(matterId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const updateKeyFinding = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/updateKeyFinding`,
  async ({ matterId, findingId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.updateKeyFinding(matterId, findingId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const deleteKeyFinding = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/deleteKeyFinding`,
  async ({ matterId, findingId }, { rejectWithValue }) => {
    try {
      return await advisoryService.deleteKeyFinding(matterId, findingId);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

// --- Opinion ---

export const updateOpinion = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/updateOpinion`,
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.updateOpinion(matterId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

// --- Recommendations ---

export const addRecommendation = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/addRecommendation`,
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.addRecommendation(matterId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const updateRecommendation = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/updateRecommendation`,
  async ({ matterId, recommendationId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.updateRecommendation(
        matterId,
        recommendationId,
        data,
      );
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const deleteRecommendation = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/deleteRecommendation`,
  async ({ matterId, recommendationId }, { rejectWithValue }) => {
    try {
      return await advisoryService.deleteRecommendation(
        matterId,
        recommendationId,
      );
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

// --- Deliverables ---

export const addDeliverable = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/addDeliverable`,
  async ({ matterId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.addDeliverable(matterId, data);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const updateDeliverable = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/updateDeliverable`,
  async ({ matterId, deliverableId, data }, { rejectWithValue }) => {
    try {
      return await advisoryService.updateDeliverable(
        matterId,
        deliverableId,
        data,
      );
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

export const deleteDeliverable = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/deleteDeliverable`,
  async ({ matterId, deliverableId }, { rejectWithValue }) => {
    try {
      return await advisoryService.deleteDeliverable(matterId, deliverableId);
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

// --- Bulk ---

export const bulkUpdateAdvisoryMatters = createAsyncThunk(
  `${ADVISORY_SLICE_NAME}/bulkUpdate`,
  async ({ matterIds, updates }, { rejectWithValue }) => {
    try {
      return await advisoryService.bulkUpdateAdvisoryMatters(
        matterIds,
        updates,
      );
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────

const advisorySlice = createSlice({
  name: ADVISORY_SLICE_NAME,
  initialState,

  reducers: {
    /** Sync filter updates (e.g. from URL params or UI controls) */
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },

    /** Reset filters to defaults */
    resetFilters(state) {
      state.filters = initialState.filters;
    },

    /** Clear the current detail panel without a network call */
    clearCurrentDetail(state) {
      state.currentDetail = null;
      Object.keys(state.errors).forEach((key) => {
        state.errors[key] = null;
      });
    },

    /** Clear search results */
    clearSearchResults(state) {
      state.searchResults = [];
      state.searchPagination = null;
    },

    /** Dismiss a specific error */
    clearError(state, action) {
      const key = action.payload;
      if (key in state.errors) state.errors[key] = null;
    },

    /** Clear all errors at once */
    clearAllErrors(state) {
      Object.keys(state.errors).forEach((key) => {
        state.errors[key] = null;
      });
    },

    /** Optimistically update a research question (for immediate UI feedback) */
    optimisticallyUpdateResearchQuestion(state, action) {
      const { questionId, updates } = action.payload;
      if (state.currentDetail?.researchQuestions) {
        const idx = state.currentDetail.researchQuestions.findIndex(
          (q) => q._id === questionId,
        );
        if (idx !== -1) {
          state.currentDetail.researchQuestions[idx] = {
            ...state.currentDetail.researchQuestions[idx],
            ...updates,
          };
        }
      }
    },

    /** Optimistically update a deliverable */
    optimisticallyUpdateDeliverable(state, action) {
      const { deliverableId, updates } = action.payload;
      if (state.currentDetail?.deliverables) {
        const idx = state.currentDetail.deliverables.findIndex(
          (d) => d._id === deliverableId,
        );
        if (idx !== -1) {
          state.currentDetail.deliverables[idx] = {
            ...state.currentDetail.deliverables[idx],
            ...updates,
          };
        }
      }
    },

    /** Update advisory status locally */
    updateAdvisoryStatus(state, action) {
      const { matterId, status } = action.payload;

      // Update current detail if it matches
      if (state.currentDetail?.matterId === matterId) {
        if (state.currentDetail.matter) {
          state.currentDetail.matter.status = status;
        }
      }

      // Update in matters list
      const matterIndex = state.matters.findIndex((m) => m._id === matterId);
      if (matterIndex !== -1) {
        state.matters[matterIndex] = {
          ...state.matters[matterIndex],
          status,
        };
      }
    },
  },

  extraReducers: (builder) => {
    const L = ADVISORY_LOADING_KEYS;

    // ✅ OPTIMIZED: Using addThunkCases helper for cleaner code

    // ── Fetch All ────────────────────────────────────────────
    addThunkCases(
      builder,
      fetchAllAdvisoryMatters,
      L.FETCH_ALL,
      (state, { payload }) => {
        state.matters = payload.data ?? [];
        state.pagination = {
          page: payload.page,
          limit: payload.limit,
          total: payload.total,
          totalPages: payload.totalPages,
          hasNextPage: payload.hasNextPage,
          hasPrevPage: payload.hasPrevPage,
        };
      },
    );

    // ── Search ───────────────────────────────────────────────
    addThunkCases(
      builder,
      searchAdvisoryMatters,
      L.SEARCH,
      (state, { payload }) => {
        state.searchResults = payload.data ?? [];
        state.searchPagination = {
          total: payload.total,
          totalPages: payload.totalPages,
        };
      },
    );

    // ── Stats ────────────────────────────────────────────────
    addThunkCases(
      builder,
      fetchAdvisoryStats,
      L.FETCH_STATS,
      (state, { payload }) => {
        state.stats = payload.data ?? null;
      },
    );

    // ── Fetch Details ────────────────────────────────────────
    addThunkCases(
      builder,
      fetchAdvisoryDetails,
      L.FETCH_DETAILS,
      (state, { payload }) => {
        state.currentDetail = payload.data?.advisoryDetail ?? null;
      },
    );

    // ── Create Details ───────────────────────────────────────
    addThunkCases(
      builder,
      createAdvisoryDetails,
      L.CREATE_DETAILS,
      (state, { payload }) => {
        state.currentDetail = payload.data?.advisoryDetail ?? null;

        // Add to matters list if not already present
        if (payload.data?.advisoryDetail) {
          const matterId = payload.data.advisoryDetail.matterId;
          const exists = state.matters.some((m) => m._id === matterId);
          if (!exists && payload.data?.matter) {
            state.matters.unshift({
              ...payload.data.matter,
              advisoryDetail: payload.data.advisoryDetail,
            });
          }
        }
      },
    );

    // ── Update Details ───────────────────────────────────────
    addThunkCases(
      builder,
      updateAdvisoryDetails,
      L.UPDATE_DETAILS,
      (state, { payload }) => {
        state.currentDetail =
          payload.data?.advisoryDetail ?? state.currentDetail;
        syncDetailWithMatters(state, payload.data?.advisoryDetail);
      },
    );

    // ── Delete Details ───────────────────────────────────────
    addThunkCases(
      builder,
      deleteAdvisoryDetails,
      L.DELETE_DETAILS,
      (state, { meta, payload }) => {
        const { matterId, deletionType } = meta.arg;

        if (deletionType === "hard") {
          // Hard delete - remove from list
          state.matters = state.matters.filter((m) => m._id !== matterId);

          // Clear current detail if it's the deleted one
          if (state.currentDetail?.matterId === matterId) {
            state.currentDetail = null;
          }
        } else {
          // Soft delete - mark as deleted
          if (state.currentDetail?.matterId === matterId) {
            state.currentDetail.isDeleted = true;
            state.currentDetail.deletedAt = new Date().toISOString();
            state.currentDetail.deletedBy = payload.data?.deletedBy;
          }

          // Update in matters list
          const matterIndex = state.matters.findIndex(
            (m) => m._id === matterId,
          );
          if (matterIndex !== -1) {
            state.matters[matterIndex] = {
              ...state.matters[matterIndex],
              isDeleted: true,
              deletedAt: new Date().toISOString(),
            };
          }
        }
      },
    );

    // ── Restore Details ──────────────────────────────────────
    addThunkCases(
      builder,
      restoreAdvisoryDetails,
      L.RESTORE_DETAILS,
      (state, { meta, payload }) => {
        const matterId = meta.arg;

        // Update current detail
        if (state.currentDetail?.matterId === matterId) {
          state.currentDetail.isDeleted = false;
          state.currentDetail.deletedAt = null;
          state.currentDetail.deletedBy = null;

          if (payload.data?.advisoryDetail) {
            state.currentDetail = {
              ...state.currentDetail,
              ...payload.data.advisoryDetail,
            };
          }
        }

        // Update in matters list
        const matterIndex = state.matters.findIndex((m) => m._id === matterId);
        if (matterIndex !== -1) {
          state.matters[matterIndex] = {
            ...state.matters[matterIndex],
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
          };
        }
      },
    );

    // ── Complete Advisory ────────────────────────────────────
    addThunkCases(
      builder,
      completeAdvisory,
      L.COMPLETE,
      (state, { payload }) => {
        state.currentDetail =
          payload.data?.advisoryDetail ?? state.currentDetail;
        syncDetailWithMatters(state, payload.data?.advisoryDetail);
      },
    );

    // ── Research Questions ───────────────────────────────────
    const updateCurrentDetail = (state, { payload }) => {
      state.currentDetail = payload.data?.advisoryDetail ?? state.currentDetail;
    };

    addThunkCases(
      builder,
      addResearchQuestion,
      L.RESEARCH_QUESTION,
      updateCurrentDetail,
    );
    addThunkCases(
      builder,
      updateResearchQuestion,
      L.RESEARCH_QUESTION,
      updateCurrentDetail,
    );
    addThunkCases(
      builder,
      deleteResearchQuestion,
      L.RESEARCH_QUESTION,
      updateCurrentDetail,
    );

    // ── Key Findings ─────────────────────────────────────────
    addThunkCases(builder, addKeyFinding, L.KEY_FINDING, updateCurrentDetail);
    addThunkCases(
      builder,
      updateKeyFinding,
      L.KEY_FINDING,
      updateCurrentDetail,
    );
    addThunkCases(
      builder,
      deleteKeyFinding,
      L.KEY_FINDING,
      updateCurrentDetail,
    );

    // ── Opinion ──────────────────────────────────────────────
    addThunkCases(builder, updateOpinion, L.OPINION, updateCurrentDetail);

    // ── Recommendations ──────────────────────────────────────
    addThunkCases(
      builder,
      addRecommendation,
      L.RECOMMENDATION,
      updateCurrentDetail,
    );
    addThunkCases(
      builder,
      updateRecommendation,
      L.RECOMMENDATION,
      updateCurrentDetail,
    );
    addThunkCases(
      builder,
      deleteRecommendation,
      L.RECOMMENDATION,
      updateCurrentDetail,
    );

    // ── Deliverables ─────────────────────────────────────────
    addThunkCases(builder, addDeliverable, L.DELIVERABLE, updateCurrentDetail);
    addThunkCases(
      builder,
      updateDeliverable,
      L.DELIVERABLE,
      updateCurrentDetail,
    );
    addThunkCases(
      builder,
      deleteDeliverable,
      L.DELIVERABLE,
      updateCurrentDetail,
    );

    // ── Bulk Update ──────────────────────────────────────────
    addThunkCases(
      builder,
      bulkUpdateAdvisoryMatters,
      L.BULK_UPDATE,
      (state, { meta }) => {
        const { matterIds, updates } = meta.arg;

        // Update matters in list
        matterIds.forEach((matterId) => {
          const idx = state.matters.findIndex((m) => m._id === matterId);
          if (idx !== -1) {
            state.matters[idx] = {
              ...state.matters[idx],
              ...updates,
            };
          }
        });

        // Update current detail if affected
        if (
          state.currentDetail &&
          matterIds.includes(state.currentDetail.matterId)
        ) {
          if (state.currentDetail.matter) {
            state.currentDetail.matter = {
              ...state.currentDetail.matter,
              ...updates,
            };
          }
        }
      },
    );
  },
});

// ── Actions ───────────────────────────────────────────────────

export const {
  setFilters,
  resetFilters,
  clearCurrentDetail,
  clearSearchResults,
  clearError,
  clearAllErrors,
  optimisticallyUpdateResearchQuestion,
  optimisticallyUpdateDeliverable,
  updateAdvisoryStatus,
} = advisorySlice.actions;

// ── Base Selector ─────────────────────────────────────────────

const selectAdvisoryState = (state) => state[ADVISORY_SLICE_NAME];

// ── Memoized Selectors ────────────────────────────────────────

export const selectAdvisoryMatters = createSelector(
  selectAdvisoryState,
  (s) => s.matters,
);

export const selectActiveAdvisoryMatters = createSelector(
  selectAdvisoryMatters,
  (matters) => matters.filter((m) => !m.isDeleted),
);

export const selectDeletedAdvisoryMatters = createSelector(
  selectAdvisoryMatters,
  (matters) => matters.filter((m) => m.isDeleted),
);

export const selectAdvisoryPagination = createSelector(
  selectAdvisoryState,
  (s) => s.pagination,
);

export const selectCurrentAdvisoryDetail = createSelector(
  selectAdvisoryState,
  (s) => s.currentDetail,
);

export const selectAdvisorySearchResults = createSelector(
  selectAdvisoryState,
  (s) => s.searchResults,
);

export const selectAdvisoryStats = createSelector(
  selectAdvisoryState,
  (s) => s.stats,
);

export const selectAdvisoryFilters = createSelector(
  selectAdvisoryState,
  (s) => s.filters,
);

/** Select loading flag for a specific operation key */
export const selectAdvisoryLoading = (key) =>
  createSelector(selectAdvisoryState, (s) => s.loading[key] ?? false);

/** Select error for a specific operation key */
export const selectAdvisoryError = (key) =>
  createSelector(selectAdvisoryState, (s) => s.errors[key] ?? null);

/** True if ANY operation is currently loading */
export const selectAnyAdvisoryLoading = createSelector(
  selectAdvisoryState,
  (s) => Object.values(s.loading).some(Boolean),
);

/** Check if current advisory is deleted */
export const selectIsCurrentAdvisoryDeleted = createSelector(
  selectCurrentAdvisoryDetail,
  (detail) => detail?.isDeleted || false,
);

/** Get deletion info for current advisory */
export const selectAdvisoryDeletionInfo = createSelector(
  selectCurrentAdvisoryDetail,
  (detail) => ({
    isDeleted: detail?.isDeleted || false,
    deletedAt: detail?.deletedAt,
    deletedBy: detail?.deletedBy,
    canRestore: detail?.isDeleted && !detail?.permanentlyDeleted,
  }),
);

// ── Sub-resource selectors (derived from currentDetail) ───────

export const selectResearchQuestions = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.researchQuestions ?? [],
);

export const selectKeyFindings = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.keyFindings ?? [],
);

export const selectLegalPrecedents = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.legalPrecedents ?? [],
);

export const selectOpinion = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.opinion ?? null,
);

export const selectRecommendations = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.recommendations ?? [],
);

export const selectDeliverables = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.deliverables ?? [],
);

export const selectRiskAssessment = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.riskAssessment ?? null,
);

export const selectComplianceChecklist = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.complianceChecklist ?? [],
);

export const selectJurisdiction = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.jurisdiction ?? [],
);

export const selectApplicableLaws = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.applicableLaws ?? [],
);

export const selectRegulatoryBodies = createSelector(
  selectCurrentAdvisoryDetail,
  (d) => d?.regulatoryBodies ?? [],
);

// ── Derived Stats Selectors ───────────────────────────────────

export const selectResearchQuestionStats = createSelector(
  selectResearchQuestions,
  (questions) => ({
    total: questions.length,
    answered: questions.filter((q) => q.status === "answered").length,
    researching: questions.filter((q) => q.status === "researching").length,
    pending: questions.filter((q) => q.status === "pending").length,
  }),
);

export const selectDeliverableStats = createSelector(
  selectDeliverables,
  (deliverables) => ({
    total: deliverables.length,
    delivered: deliverables.filter(
      (d) => d.status === "delivered" || d.status === "approved",
    ).length,
    inProgress: deliverables.filter((d) => d.status === "in-progress").length,
    pending: deliverables.filter((d) => d.status === "pending").length,
  }),
);

export const selectRecommendationStats = createSelector(
  selectRecommendations,
  (recommendations) => ({
    total: recommendations.length,
    implemented: recommendations.filter(
      (r) => r.implementationStatus === "implemented",
    ).length,
    inProgress: recommendations.filter(
      (r) => r.implementationStatus === "in-progress",
    ).length,
    pending: recommendations.filter((r) => r.implementationStatus === "pending")
      .length,
    rejected: recommendations.filter(
      (r) => r.implementationStatus === "rejected",
    ).length,
  }),
);

// ── Filtered List Selectors ───────────────────────────────────

export const selectFilteredAdvisoryMatters = createSelector(
  [selectAdvisoryMatters, selectAdvisoryFilters],
  (matters, filters) => {
    let filtered = [...matters];

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter((m) => m.status === filters.status);
    }

    // Apply advisory type filter
    if (filters.advisoryType) {
      filtered = filtered.filter(
        (m) => m.advisoryDetail?.advisoryType === filters.advisoryType,
      );
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(searchLower) ||
          m.matterNumber?.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower),
      );
    }

    // Apply deletion filters
    if (filters.onlyDeleted) {
      filtered = filtered.filter((m) => m.isDeleted);
    } else if (!filters.includeDeleted) {
      filtered = filtered.filter((m) => !m.isDeleted);
    }

    return filtered;
  },
);

export default advisorySlice.reducer;
