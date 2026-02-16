// ============================================
// CALENDAR SYSTEM - COMPLETE COMPONENT EXPORTS
// ============================================

// Main Components
export { default as CalendarHeader } from "./components/CalendarHeader";
export { default as EventCard } from "./components/EventCard";
export { default as MonthView } from "./components/MonthView";
export { default as AgendaView } from "./components/AgendaView";
export { default as EventFormModal } from "./components/EventFormModal";
export { default as EventDetailsModal } from "./components/EventDetailsModal";
export { default as CalendarFilters } from "./components/CalendarFilters";
export { default as BlockedDateFormModal } from "./components/BlockedDateFormModal";
export { default as UpcomingEventsWidget } from "./components/UpcomingEventsWidget";
export { default as CourtHearingsWidget } from "./CourtHearingsWidget";
export { default as CourtOrderDeadlinesWidget } from "./CourtOrderDeadlinesWidget";
export { default as MatterHearingsTimeline } from "./MatterHearingsTimeline";

// NEW: Advanced Components
export { default as CalendarStats } from "./components/CalendarStats";
export { default as ExceptionManagementModal } from "./components/ExceptionManagementModal";
export { default as MyBlockedDates } from "./components/MyBlockedDates";
export { default as BlockedDatesRangeViewer } from "./components/BlockedDatesRangeViewer";

// Pages
export { default as CalendarPage } from "./pages/CalendarPage";
export { default as CalendarDashboard } from "./pages/CalendarDashboard";
export { default as BlockedDatesPage } from "./pages/BlockedDatesPage";

// NEW: Additional Pages
export { default as DeletedEventsPage } from "./pages/DeletedEventsPage";

// Hooks
export {
  useCalendarEvents,
  useMyCalendar,
  useUpcomingEvents,
  useMatterEvents,
  useEventOperations,
  useBlockedDates,
  useDateBlockCheck,
  useCalendarView,
} from "./hooks/useCalendar";

// Utils
export * from "./utils/calendarUtils";
export * from "./utils/hearingSyncUtils";

// Constants
export * from "./utils/calendarConstants";
