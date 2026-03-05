import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import dayjs from "dayjs";
import {
  getAllEvents,
  getMyCalendar,
  getUpcomingEvents,
  getEventsByMatter,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  respondToInvitation,
  getAllBlockedDates,
  checkIfBlocked,
  clearErrors,
  clearOperationStatus,
} from "../redux/features/calender/calenderSlice";
import {
  filterEventsByDateRange,
  filterEventsByStatus,
  filterEventsByType,
  filterAutoSyncedEvents,
  searchEvents,
  getEventStatistics,
} from "../utils/calendarUtils";

// ============================================
// USE CALENDAR EVENTS HOOK
// ============================================

export const useCalendarEvents = (params = {}) => {
  const dispatch = useDispatch();
  const { events, loading, error, operationStatus } = useSelector(
    (state) => state.calendar,
  );

  const [filters, setFilters] = useState({
    search: "",
    status: [],
    types: [],
    startDate: null,
    endDate: null,
    autoSyncedOnly: false,
  });

  // Fetch events on mount or when params change
  useEffect(() => {
    dispatch(getAllEvents({ ...params, includeHearings: true }));
  }, [dispatch, JSON.stringify(params)]);

  // Handle operation status messages
  useEffect(() => {
    if (operationStatus.success && operationStatus.message) {
      message.success(operationStatus.message);
      dispatch(clearOperationStatus());
    } else if (!operationStatus.success && operationStatus.message) {
      message.error(operationStatus.message);
      dispatch(clearOperationStatus());
    }
  }, [operationStatus, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error.events) {
      message.error(error.events);
      dispatch(clearErrors());
    }
  }, [error.events, dispatch]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let result = events.data || [];

    // Apply search
    if (filters.search) {
      result = searchEvents(result, filters.search);
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      result = filterEventsByStatus(result, filters.status);
    }

    // Apply type filter
    if (filters.types && filters.types.length > 0) {
      result = filterEventsByType(result, filters.types);
    }

    // Apply auto-sync filter
    if (filters.autoSyncedOnly) {
      result = filterAutoSyncedEvents(result, filters.autoSyncedOnly);
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      result = filterEventsByDateRange(
        result,
        filters.startDate,
        filters.endDate,
      );
    }

    return result;
  }, [events.data, filters]);

  // Get statistics
  const statistics = useMemo(() => {
    return getEventStatistics(filteredEvents);
  }, [filteredEvents]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      status: [],
      types: [],
      startDate: null,
      endDate: null,
      autoSyncedOnly: false,
    });
  }, []);

  // Refresh events
  const refresh = useCallback(() => {
    dispatch(getAllEvents(params));
  }, [dispatch, params]);

  return {
    events: filteredEvents,
    totalEvents: events.total,
    currentPage: events.page,
    resultsCount: events.results,
    loading: loading.events,
    error: error.events,
    statistics,
    filters,
    updateFilters,
    resetFilters,
    refresh,
  };
};

// ============================================
// USE MY CALENDAR HOOK
// ============================================

export const useMyCalendar = (params = {}) => {
  const dispatch = useDispatch();
  const { myCalendar, loading, error } = useSelector((state) => state.calendar);

  useEffect(() => {
    dispatch(getMyCalendar(params));
  }, [dispatch, JSON.stringify(params)]);

  const refresh = useCallback(() => {
    dispatch(getMyCalendar(params));
  }, [dispatch, params]);

  return {
    events: myCalendar || [],
    loading: loading.events,
    error: error.events,
    refresh,
  };
};

// ============================================
// USE UPCOMING EVENTS HOOK
// ============================================

export const useUpcomingEvents = (params = {}) => {
  const dispatch = useDispatch();
  const { upcomingEvents, loading, error } = useSelector(
    (state) => state.calendar,
  );

  useEffect(() => {
    dispatch(getUpcomingEvents(params));
  }, [dispatch, JSON.stringify(params)]);

  const refresh = useCallback(() => {
    dispatch(getUpcomingEvents(params));
  }, [dispatch, params]);

  return {
    events: upcomingEvents || [],
    loading: loading.events,
    error: error.events,
    refresh,
  };
};

// ============================================
// USE MATTER EVENTS HOOK
// ============================================

export const useMatterEvents = (matterId) => {
  const dispatch = useDispatch();
  const { eventsByMatter, loading, error } = useSelector(
    (state) => state.calendar,
  );

  useEffect(() => {
    if (matterId) {
      dispatch(getEventsByMatter(matterId));
    }
  }, [dispatch, matterId]);

  const refresh = useCallback(() => {
    if (matterId) {
      dispatch(getEventsByMatter(matterId));
    }
  }, [dispatch, matterId]);

  return {
    events: eventsByMatter || [],
    loading: loading.events,
    error: error.events,
    refresh,
  };
};

// ============================================
// USE EVENT OPERATIONS HOOK
// ============================================

export const useEventOperations = () => {
  const dispatch = useDispatch();
  const { loading, error, operationStatus } = useSelector(
    (state) => state.calendar,
  );

  const handleCreateEvent = useCallback(
    async (eventData) => {
      try {
        await dispatch(createEvent(eventData)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    [dispatch],
  );

  const handleUpdateEvent = useCallback(
    async (eventId, updateData) => {
      try {
        await dispatch(updateEvent({ eventId, updateData })).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    [dispatch],
  );

  const handleDeleteEvent = useCallback(
    async (eventId) => {
      try {
        await dispatch(deleteEvent(eventId)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    [dispatch],
  );

  const handleUpdateStatus = useCallback(
    async (eventId, statusData) => {
      try {
        await dispatch(updateEventStatus({ eventId, statusData })).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    [dispatch],
  );

  const handleRespondToInvitation = useCallback(
    async (eventId, responseData) => {
      try {
        await dispatch(respondToInvitation({ eventId, responseData })).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    },
    [dispatch],
  );

  return {
    createEvent: handleCreateEvent,
    updateEvent: handleUpdateEvent,
    deleteEvent: handleDeleteEvent,
    updateStatus: handleUpdateStatus,
    respondToInvitation: handleRespondToInvitation,
    loading: loading.event,
    error: error.event,
    operationStatus,
  };
};

// ============================================
// USE BLOCKED DATES HOOK
// ============================================

export const useBlockedDates = (params = {}) => {
  const dispatch = useDispatch();
  const { blockedDates, loading, error } = useSelector(
    (state) => state.calendar,
  );

  useEffect(() => {
    dispatch(getAllBlockedDates(params));
  }, [dispatch, JSON.stringify(params)]);

  const refresh = useCallback(() => {
    dispatch(getAllBlockedDates(params));
  }, [dispatch, params]);

  return {
    blockedDates: blockedDates.data || [],
    totalBlocks: blockedDates.total,
    loading: loading.blockedDates,
    error: error.blockedDates,
    refresh,
  };
};

// ============================================
// USE DATE BLOCK CHECK HOOK
// ============================================

export const useDateBlockCheck = () => {
  const dispatch = useDispatch();
  const { blockCheckResult, loading, error } = useSelector(
    (state) => state.calendar,
  );

  const checkDate = useCallback(
    async (checkData) => {
      try {
        const result = await dispatch(checkIfBlocked(checkData)).unwrap();
        return result;
      } catch (error) {
        return { isBlocked: false, error };
      }
    },
    [dispatch],
  );

  return {
    checkDate,
    result: blockCheckResult,
    loading: loading.blockCheck,
    error: error.blockCheck,
  };
};

// ============================================
// USE CALENDAR VIEW HOOK
// ============================================

export const useCalendarView = (defaultView = "month") => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [view, setView] = useState(defaultView);

  const goToToday = useCallback(() => {
    setCurrentDate(dayjs());
  }, []);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      switch (view) {
        case "day":
          return prev.add(1, "day");
        case "week":
          return prev.add(1, "week");
        case "month":
          return prev.add(1, "month");
        default:
          return prev;
      }
    });
  }, [view]);

  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      switch (view) {
        case "day":
          return prev.subtract(1, "day");
        case "week":
          return prev.subtract(1, "week");
        case "month":
          return prev.subtract(1, "month");
        default:
          return prev;
      }
    });
  }, [view]);

  const goToDate = useCallback((date) => {
    setCurrentDate(dayjs(date));
  }, []);

  const changeView = useCallback((newView) => {
    setView(newView);
  }, []);

  return {
    currentDate: currentDate.toDate(),
    view,
    goToToday,
    goToNext,
    goToPrevious,
    goToDate,
    changeView,
  };
};
