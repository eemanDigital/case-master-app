import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import calendarService from "./calenderService";

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  // Calendar Events
  events: {
    data: [],
    total: 0,
    page: 1,
    results: 0,
  },
  currentEvent: null,
  myCalendar: [],
  upcomingEvents: [],
  eventsByMatter: [],
  calendarStats: null,

  // Blocked Dates
  blockedDates: {
    data: [],
    total: 0,
    page: 1,
    results: 0,
  },
  currentBlock: null,
  myBlockedDates: [],
  blockCheckResult: null,

  // UI State
  loading: {
    events: false,
    event: false,
    blockedDates: false,
    blockCheck: false,
    stats: false,
  },
  error: {
    events: null,
    event: null,
    blockedDates: null,
    blockCheck: null,
    stats: null,
  },

  // Operation Status
  operationStatus: {
    type: null, // 'create', 'update', 'delete', etc.
    success: false,
    message: null,
  },
};

// ============================================
// ASYNC THUNKS - CALENDAR EVENTS
// ============================================

/**
 * Create a new calendar event
 */
export const createEvent = createAsyncThunk(
  "calendar/createEvent",
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await calendarService.createEvent(eventData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create event",
      );
    }
  },
);

/**
 * Get all calendar events
 */
export const getAllEvents = createAsyncThunk(
  "calendar/getAllEvents",
  async (params, { rejectWithValue }) => {
    try {
      const response = await calendarService.getAllEvents(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch events",
      );
    }
  },
);

/**
 * Get single event by ID
 */
export const getEvent = createAsyncThunk(
  "calendar/getEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await calendarService.getEvent(eventId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch event",
      );
    }
  },
);

/**
 * Update calendar event
 */
export const updateEvent = createAsyncThunk(
  "calendar/updateEvent",
  async ({ eventId, updateData }, { rejectWithValue }) => {
    try {
      const response = await calendarService.updateEvent(eventId, updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update event",
      );
    }
  },
);

/**
 * Delete calendar event
 */
export const deleteEvent = createAsyncThunk(
  "calendar/deleteEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      await calendarService.deleteEvent(eventId);
      return eventId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete event",
      );
    }
  },
);

/**
 * Restore deleted event
 */
export const restoreEvent = createAsyncThunk(
  "calendar/restoreEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await calendarService.restoreEvent(eventId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restore event",
      );
    }
  },
);

/**
 * Update event status
 */
export const updateEventStatus = createAsyncThunk(
  "calendar/updateEventStatus",
  async ({ eventId, statusData }, { rejectWithValue }) => {
    try {
      const response = await calendarService.updateEventStatus(
        eventId,
        statusData,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update event status",
      );
    }
  },
);

/**
 * Respond to event invitation
 */
export const respondToInvitation = createAsyncThunk(
  "calendar/respondToInvitation",
  async ({ eventId, responseData }, { rejectWithValue }) => {
    try {
      const response = await calendarService.respondToInvitation(
        eventId,
        responseData,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to respond to invitation",
      );
    }
  },
);

/**
 * Get my calendar events
 */
export const getMyCalendar = createAsyncThunk(
  "calendar/getMyCalendar",
  async (params, { rejectWithValue }) => {
    try {
      const response = await calendarService.getMyCalendar(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch calendar",
      );
    }
  },
);

// calender sync
export const syncHearingToCalendar = createAsyncThunk(
  "calendar/syncHearingToCalendar",
  async (syncData, { rejectWithValue }) => {
    try {
      const response = await calendarService.syncHearingToCalendar(syncData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to sync hearing to calendar",
      );
    }
  },
);

/**
 * Update next hearing date in calendar
 */
export const updateNextHearingDate = createAsyncThunk(
  "calendar/updateNextHearingDate",
  async (updateData, { rejectWithValue }) => {
    try {
      const response = await calendarService.updateNextHearingDate(updateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update next hearing date",
      );
    }
  },
);

/**
 * Mark past hearings as completed
 */
export const completeHearings = createAsyncThunk(
  "calendar/completeHearings",
  async (completionData, { rejectWithValue }) => {
    try {
      const response = await calendarService.completeHearings(completionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete hearings",
      );
    }
  },
);

/**
 * Create deadline from court order
 */
export const createCourtOrderDeadline = createAsyncThunk(
  "calendar/createCourtOrderDeadline",
  async (deadlineData, { rejectWithValue }) => {
    try {
      const response =
        await calendarService.createCourtOrderDeadline(deadlineData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create court order deadline",
      );
    }
  },
);

/**
 * Get upcoming events
 */
export const getUpcomingEvents = createAsyncThunk(
  "calendar/getUpcomingEvents",
  async (params, { rejectWithValue }) => {
    try {
      const response = await calendarService.getUpcomingEvents(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch upcoming events",
      );
    }
  },
);

/**
 * Get events by matter
 */
export const getEventsByMatter = createAsyncThunk(
  "calendar/getEventsByMatter",
  async (matterId, { rejectWithValue }) => {
    try {
      const response = await calendarService.getEventsByMatter(matterId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch matter events",
      );
    }
  },
);

/**
 * Get calendar statistics
 */
export const getCalendarStats = createAsyncThunk(
  "calendar/getCalendarStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await calendarService.getCalendarStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch calendar stats",
      );
    }
  },
);

// ============================================
// ASYNC THUNKS - BLOCKED DATES
// ============================================

/**
 * Create a blocked date
 */
export const createBlockedDate = createAsyncThunk(
  "calendar/createBlockedDate",
  async (blockData, { rejectWithValue }) => {
    try {
      const response = await calendarService.createBlockedDate(blockData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create blocked date",
      );
    }
  },
);

/**
 * Get all blocked dates
 */
export const getAllBlockedDates = createAsyncThunk(
  "calendar/getAllBlockedDates",
  async (params, { rejectWithValue }) => {
    try {
      const response = await calendarService.getAllBlockedDates(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blocked dates",
      );
    }
  },
);

/**
 * Get single blocked date by ID
 */
export const getBlockedDate = createAsyncThunk(
  "calendar/getBlockedDate",
  async (blockId, { rejectWithValue }) => {
    try {
      const response = await calendarService.getBlockedDate(blockId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch blocked date",
      );
    }
  },
);

/**
 * Update blocked date
 */
export const updateBlockedDate = createAsyncThunk(
  "calendar/updateBlockedDate",
  async ({ blockId, updateData }, { rejectWithValue }) => {
    try {
      const response = await calendarService.updateBlockedDate(
        blockId,
        updateData,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update blocked date",
      );
    }
  },
);

/**
 * Delete blocked date
 */
export const deleteBlockedDate = createAsyncThunk(
  "calendar/deleteBlockedDate",
  async (blockId, { rejectWithValue }) => {
    try {
      await calendarService.deleteBlockedDate(blockId);
      return blockId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete blocked date",
      );
    }
  },
);

/**
 * Restore blocked date
 */
export const restoreBlockedDate = createAsyncThunk(
  "calendar/restoreBlockedDate",
  async (blockId, { rejectWithValue }) => {
    try {
      const response = await calendarService.restoreBlockedDate(blockId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to restore blocked date",
      );
    }
  },
);

/**
 * Grant exception to user
 */
export const grantException = createAsyncThunk(
  "calendar/grantException",
  async ({ blockId, exceptionData }, { rejectWithValue }) => {
    try {
      const response = await calendarService.grantException(
        blockId,
        exceptionData,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to grant exception",
      );
    }
  },
);

/**
 * Revoke exception from user
 */
export const revokeException = createAsyncThunk(
  "calendar/revokeException",
  async ({ blockId, userId }, { rejectWithValue }) => {
    try {
      const response = await calendarService.revokeException(blockId, userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to revoke exception",
      );
    }
  },
);

/**
 * Check if date is blocked
 */
export const checkIfBlocked = createAsyncThunk(
  "calendar/checkIfBlocked",
  async (checkData, { rejectWithValue }) => {
    try {
      const response = await calendarService.checkIfBlocked(checkData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to check blocked date",
      );
    }
  },
);

/**
 * Get blocked dates in range
 */
export const getBlockedDatesInRange = createAsyncThunk(
  "calendar/getBlockedDatesInRange",
  async (params, { rejectWithValue }) => {
    try {
      const response = await calendarService.getBlockedDatesInRange(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch blocked dates in range",
      );
    }
  },
);

/**
 * Get my blocked dates
 */
export const getMyBlockedDates = createAsyncThunk(
  "calendar/getMyBlockedDates",
  async (params, { rejectWithValue }) => {
    try {
      const response = await calendarService.getMyBlockedDates(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch my blocked dates",
      );
    }
  },
);

// ============================================
// CALENDAR SLICE
// ============================================

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    // Clear errors
    clearErrors: (state) => {
      state.error = {
        events: null,
        event: null,
        blockedDates: null,
        blockCheck: null,
        stats: null,
      };
    },

    // Clear operation status
    clearOperationStatus: (state) => {
      state.operationStatus = {
        type: null,
        success: false,
        message: null,
      };
    },

    // Clear current event
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },

    // Clear current block
    clearCurrentBlock: (state) => {
      state.currentBlock = null;
    },

    // Clear block check result
    clearBlockCheckResult: (state) => {
      state.blockCheckResult = null;
    },

    // Reset calendar state
    resetCalendarState: () => initialState,
  },
  extraReducers: (builder) => {
    // ============================================
    // CREATE EVENT
    // ============================================
    builder
      .addCase(createEvent.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading.event = false;
        state.events.data.unshift(action.payload.event);
        state.events.results += 1;
        state.events.total += 1;
        state.operationStatus = {
          type: "create",
          success: true,
          message: "Event created successfully",
        };
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "create",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // GET ALL EVENTS
    // ============================================
    builder
      .addCase(getAllEvents.pending, (state) => {
        state.loading.events = true;
        state.error.events = null;
      })
      .addCase(getAllEvents.fulfilled, (state, action) => {
        state.loading.events = false;
        state.events = {
          data: action.payload.data.events,
          total: action.payload.total,
          page: action.payload.page,
          results: action.payload.results,
        };
      })
      .addCase(getAllEvents.rejected, (state, action) => {
        state.loading.events = false;
        state.error.events = action.payload;
      });

    // ============================================
    // GET SINGLE EVENT
    // ============================================
    builder
      .addCase(getEvent.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(getEvent.fulfilled, (state, action) => {
        state.loading.event = false;
        state.currentEvent = action.payload.event;
      })
      .addCase(getEvent.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
      });

    // ============================================
    // UPDATE EVENT
    // ============================================
    builder
      .addCase(updateEvent.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading.event = false;
        const index = state.events.data.findIndex(
          (event) => event._id === action.payload.event._id,
        );
        if (index !== -1) {
          state.events.data[index] = action.payload.event;
        }
        state.currentEvent = action.payload.event;
        state.operationStatus = {
          type: "update",
          success: true,
          message: "Event updated successfully",
        };
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "update",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // DELETE EVENT
    // ============================================
    builder
      .addCase(deleteEvent.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading.event = false;
        state.events.data = state.events.data.filter(
          (event) => event._id !== action.payload,
        );
        state.events.results -= 1;
        state.events.total -= 1;
        state.operationStatus = {
          type: "delete",
          success: true,
          message: "Event deleted successfully",
        };
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "delete",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // RESTORE EVENT
    // ============================================
    builder
      .addCase(restoreEvent.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(restoreEvent.fulfilled, (state, action) => {
        state.loading.event = false;
        state.events.data.unshift(action.payload.event);
        state.events.results += 1;
        state.events.total += 1;
        state.operationStatus = {
          type: "restore",
          success: true,
          message: "Event restored successfully",
        };
      })
      .addCase(restoreEvent.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "restore",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // UPDATE EVENT STATUS
    // ============================================
    builder
      .addCase(updateEventStatus.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(updateEventStatus.fulfilled, (state, action) => {
        state.loading.event = false;
        const index = state.events.data.findIndex(
          (event) => event._id === action.payload.event._id,
        );
        if (index !== -1) {
          state.events.data[index] = action.payload.event;
        }
        state.currentEvent = action.payload.event;
        state.operationStatus = {
          type: "updateStatus",
          success: true,
          message: "Event status updated successfully",
        };
      })
      .addCase(updateEventStatus.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "updateStatus",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // SYNC HEARING TO CALENDAR
    // ============================================
    builder
      .addCase(syncHearingToCalendar.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(syncHearingToCalendar.fulfilled, (state, action) => {
        state.loading.event = false;
        // Add synced event to events list if it exists
        if (action.payload.event) {
          const existingIndex = state.events.data.findIndex(
            (event) => event._id === action.payload.event._id,
          );

          if (existingIndex !== -1) {
            // Update existing event
            state.events.data[existingIndex] = action.payload.event;
          } else {
            // Add new event
            state.events.data.unshift(action.payload.event);
            state.events.results += 1;
            state.events.total += 1;
          }
        }
        state.operationStatus = {
          type: "syncHearing",
          success: true,
          message: "Hearing synced to calendar successfully",
        };
      })
      .addCase(syncHearingToCalendar.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "syncHearing",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // UPDATE NEXT HEARING DATE
    // ============================================
    builder
      .addCase(updateNextHearingDate.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(updateNextHearingDate.fulfilled, (state, action) => {
        state.loading.event = false;
        state.operationStatus = {
          type: "updateNextHearing",
          success: true,
          message: "Next hearing date updated successfully",
        };
      })
      .addCase(updateNextHearingDate.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "updateNextHearing",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // COMPLETE HEARINGS
    // ============================================
    builder
      .addCase(completeHearings.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(completeHearings.fulfilled, (state, action) => {
        state.loading.event = false;
        state.operationStatus = {
          type: "completeHearings",
          success: true,
          message: "Past hearings marked as completed",
        };
      })
      .addCase(completeHearings.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "completeHearings",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // CREATE COURT ORDER DEADLINE
    // ============================================
    builder
      .addCase(createCourtOrderDeadline.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(createCourtOrderDeadline.fulfilled, (state, action) => {
        state.loading.event = false;
        state.operationStatus = {
          type: "createDeadline",
          success: true,
          message: "Court order deadline created successfully",
        };
      })
      .addCase(createCourtOrderDeadline.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "createDeadline",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // RESPOND TO INVITATION
    // ============================================
    builder
      .addCase(respondToInvitation.pending, (state) => {
        state.loading.event = true;
        state.error.event = null;
      })
      .addCase(respondToInvitation.fulfilled, (state, action) => {
        state.loading.event = false;
        const index = state.events.data.findIndex(
          (event) => event._id === action.payload.event._id,
        );
        if (index !== -1) {
          state.events.data[index] = action.payload.event;
        }
        state.currentEvent = action.payload.event;
        state.operationStatus = {
          type: "respond",
          success: true,
          message: "Response recorded successfully",
        };
      })
      .addCase(respondToInvitation.rejected, (state, action) => {
        state.loading.event = false;
        state.error.event = action.payload;
        state.operationStatus = {
          type: "respond",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // GET MY CALENDAR
    // ============================================
    builder
      .addCase(getMyCalendar.pending, (state) => {
        state.loading.events = true;
        state.error.events = null;
      })
      .addCase(getMyCalendar.fulfilled, (state, action) => {
        state.loading.events = false;
        state.myCalendar = action.payload.events;
      })
      .addCase(getMyCalendar.rejected, (state, action) => {
        state.loading.events = false;
        state.error.events = action.payload;
      });

    // ============================================
    // GET UPCOMING EVENTS
    // ============================================
    builder
      .addCase(getUpcomingEvents.pending, (state) => {
        state.loading.events = true;
        state.error.events = null;
      })
      .addCase(getUpcomingEvents.fulfilled, (state, action) => {
        state.loading.events = false;
        state.upcomingEvents = action.payload.events;
      })
      .addCase(getUpcomingEvents.rejected, (state, action) => {
        state.loading.events = false;
        state.error.events = action.payload;
      });

    // ============================================
    // GET EVENTS BY MATTER
    // ============================================
    builder
      .addCase(getEventsByMatter.pending, (state) => {
        state.loading.events = true;
        state.error.events = null;
      })
      .addCase(getEventsByMatter.fulfilled, (state, action) => {
        state.loading.events = false;
        state.eventsByMatter = action.payload.events;
      })
      .addCase(getEventsByMatter.rejected, (state, action) => {
        state.loading.events = false;
        state.error.events = action.payload;
      });

    // ============================================
    // GET CALENDAR STATS
    // ============================================
    builder
      .addCase(getCalendarStats.pending, (state) => {
        state.loading.stats = true;
        state.error.stats = null;
      })
      .addCase(getCalendarStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.calendarStats = action.payload;
      })
      .addCase(getCalendarStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error.stats = action.payload;
      });

    // ============================================
    // CREATE BLOCKED DATE
    // ============================================
    builder
      .addCase(createBlockedDate.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(createBlockedDate.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        state.blockedDates.data.unshift(action.payload.block);
        state.blockedDates.results += 1;
        state.blockedDates.total += 1;
        state.operationStatus = {
          type: "createBlock",
          success: true,
          message: "Blocked date created successfully",
        };
      })
      .addCase(createBlockedDate.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
        state.operationStatus = {
          type: "createBlock",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // GET ALL BLOCKED DATES
    // ============================================
    builder
      .addCase(getAllBlockedDates.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(getAllBlockedDates.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        state.blockedDates = {
          data: action.payload.data.blocks,
          total: action.payload.total,
          page: action.payload.page,
          results: action.payload.results,
        };
      })
      .addCase(getAllBlockedDates.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
      });

    // ============================================
    // GET SINGLE BLOCKED DATE
    // ============================================
    builder
      .addCase(getBlockedDate.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(getBlockedDate.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        state.currentBlock = action.payload.block;
      })
      .addCase(getBlockedDate.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
      });

    // ============================================
    // UPDATE BLOCKED DATE
    // ============================================
    builder
      .addCase(updateBlockedDate.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(updateBlockedDate.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        const index = state.blockedDates.data.findIndex(
          (block) => block._id === action.payload.block._id,
        );
        if (index !== -1) {
          state.blockedDates.data[index] = action.payload.block;
        }
        state.currentBlock = action.payload.block;
        state.operationStatus = {
          type: "updateBlock",
          success: true,
          message: "Blocked date updated successfully",
        };
      })
      .addCase(updateBlockedDate.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
        state.operationStatus = {
          type: "updateBlock",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // DELETE BLOCKED DATE
    // ============================================
    builder
      .addCase(deleteBlockedDate.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(deleteBlockedDate.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        state.blockedDates.data = state.blockedDates.data.filter(
          (block) => block._id !== action.payload,
        );
        state.blockedDates.results -= 1;
        state.blockedDates.total -= 1;
        state.operationStatus = {
          type: "deleteBlock",
          success: true,
          message: "Blocked date deleted successfully",
        };
      })
      .addCase(deleteBlockedDate.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
        state.operationStatus = {
          type: "deleteBlock",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // RESTORE BLOCKED DATE
    // ============================================
    builder
      .addCase(restoreBlockedDate.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(restoreBlockedDate.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        state.blockedDates.data.unshift(action.payload.block);
        state.blockedDates.results += 1;
        state.blockedDates.total += 1;
        state.operationStatus = {
          type: "restoreBlock",
          success: true,
          message: "Blocked date restored successfully",
        };
      })
      .addCase(restoreBlockedDate.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
        state.operationStatus = {
          type: "restoreBlock",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // GRANT EXCEPTION
    // ============================================
    builder
      .addCase(grantException.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(grantException.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        const index = state.blockedDates.data.findIndex(
          (block) => block._id === action.payload.block._id,
        );
        if (index !== -1) {
          state.blockedDates.data[index] = action.payload.block;
        }
        state.currentBlock = action.payload.block;
        state.operationStatus = {
          type: "grantException",
          success: true,
          message: "Exception granted successfully",
        };
      })
      .addCase(grantException.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
        state.operationStatus = {
          type: "grantException",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // REVOKE EXCEPTION
    // ============================================
    builder
      .addCase(revokeException.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(revokeException.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        const index = state.blockedDates.data.findIndex(
          (block) => block._id === action.payload.block._id,
        );
        if (index !== -1) {
          state.blockedDates.data[index] = action.payload.block;
        }
        state.currentBlock = action.payload.block;
        state.operationStatus = {
          type: "revokeException",
          success: true,
          message: "Exception revoked successfully",
        };
      })
      .addCase(revokeException.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
        state.operationStatus = {
          type: "revokeException",
          success: false,
          message: action.payload,
        };
      });

    // ============================================
    // CHECK IF BLOCKED
    // ============================================
    builder
      .addCase(checkIfBlocked.pending, (state) => {
        state.loading.blockCheck = true;
        state.error.blockCheck = null;
      })
      .addCase(checkIfBlocked.fulfilled, (state, action) => {
        state.loading.blockCheck = false;
        state.blockCheckResult = action.payload;
      })
      .addCase(checkIfBlocked.rejected, (state, action) => {
        state.loading.blockCheck = false;
        state.error.blockCheck = action.payload;
      });

    // ============================================
    // GET BLOCKED DATES IN RANGE
    // ============================================
    builder
      .addCase(getBlockedDatesInRange.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(getBlockedDatesInRange.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        state.blockedDates.data = action.payload.blocks;
        state.blockedDates.results = action.payload.results;
      })
      .addCase(getBlockedDatesInRange.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
      });

    // ============================================
    // GET MY BLOCKED DATES
    // ============================================
    builder
      .addCase(getMyBlockedDates.pending, (state) => {
        state.loading.blockedDates = true;
        state.error.blockedDates = null;
      })
      .addCase(getMyBlockedDates.fulfilled, (state, action) => {
        state.loading.blockedDates = false;
        state.myBlockedDates = action.payload.blocks;
      })
      .addCase(getMyBlockedDates.rejected, (state, action) => {
        state.loading.blockedDates = false;
        state.error.blockedDates = action.payload;
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const {
  clearErrors,
  clearOperationStatus,
  clearCurrentEvent,
  clearCurrentBlock,
  clearBlockCheckResult,
  resetCalendarState,
} = calendarSlice.actions;

export default calendarSlice.reducer;
