import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Layout, message, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import CalendarHeader from "../../components/calender/CalendarHeader";
import MonthView from "../../components/calender/MonthView";
import WeekView from "../../components/calender/WeekView";
import AgendaView from "../../components/calender/AgendaView";
import EventFormModal from "../../components/calender/EventFormModal";
import EventDetailsModal from "../../components/calender/EventDetailsModal";
import CalendarFilters from "../../components/calender/CalendarFilters";
import {
  useCalendarEvents,
  useCalendarView,
  useEventOperations,
  useDateBlockCheck,
} from "../../hooks/useCalendar";
const { Content } = Layout;

const CalendarPage = () => {
  // State
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formMode, setFormMode] = useState("create");
  const { user } = useSelector((state) => state.auth);

  // Get current user
  const currentUserId = user?._id;

  // Hooks
  const {
    currentDate,
    view,
    goToToday,
    goToNext,
    goToPrevious,
    goToDate,
    changeView,
  } = useCalendarView("month");

  const {
    events,
    loading,
    filters,
    updateFilters,
    resetFilters,
    refresh,
    statistics,
  } = useCalendarEvents();

  const {
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus,
    respondToInvitation,
    loading: operationLoading,
  } = useEventOperations();

  const { checkDate } = useDateBlockCheck();

  // Handlers
  const handleCreateEvent = () => {
    setFormMode("create");
    setSelectedEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event) => {
    setFormMode("edit");
    setSelectedEvent(event);
    setShowEventDetails(false);
    setShowEventForm(true);
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleDateClick = (date) => {
    goToDate(date);
    if (view !== "day") {
      changeView("day");
    }
  };

  const handleFormSubmit = async (eventData) => {
    try {
      // Check if date is blocked
      const blockCheck = await checkDate({
        startDateTime: eventData.startDateTime,
        endDateTime: eventData.endDateTime,
        eventType: eventData.eventType,
      });

      if (blockCheck?.isBlocked) {
        message.warning(
          blockCheck.message || "This date/time is blocked for scheduling",
        );
        return;
      }

      if (blockCheck?.hasWarning) {
        message.info(blockCheck.message);
      }

      // Create or update event
      let result;
      if (formMode === "create") {
        result = await createEvent(eventData);
      } else {
        result = await updateEvent(selectedEvent._id, eventData);
      }

      if (result.success) {
        setShowEventForm(false);
        setSelectedEvent(null);
        refresh();
      }
    } catch (error) {
      console.error("Error submitting event:", error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this event?",
      );
      if (!confirmed) return;

      const result = await deleteEvent(eventId);
      if (result.success) {
        setShowEventDetails(false);
        setSelectedEvent(null);
        refresh();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleUpdateStatus = async (eventId, statusData) => {
    try {
      const result = await updateStatus(eventId, statusData);
      if (result.success) {
        refresh();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleRespond = async (eventId, responseData) => {
    try {
      const result = await respondToInvitation(eventId, responseData);
      if (result.success) {
        setShowEventDetails(false);
        refresh();
      }
    } catch (error) {
      console.error("Error responding to invitation:", error);
    }
  };

  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const renderCalendarView = () => {
    switch (view) {
      case "month":
        return (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleViewEvent}
          />
        );

      case "week":
        return (
          <WeekView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleViewEvent}
          />
        );

      case "agenda":
        return (
          <AgendaView
            events={events}
            onEventClick={handleViewEvent}
            dateRange={{ start: currentDate, end: currentDate }}
          />
        );

      // Add day view here
      default:
        return (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleViewEvent}
          />
        );
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={changeView}
        onPreviousClick={goToPrevious}
        onNextClick={goToNext}
        onTodayClick={goToToday}
        onDateChange={goToDate}
        onCreateEvent={handleCreateEvent}
        onFilterClick={() => setShowFilters(true)}
        onRefresh={refresh}
        loading={loading}
      />

      <Content className="p-6">
        {/* Statistics Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.total}
              </div>
              <div className="text-sm text-gray-500">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {statistics.today}
              </div>
              <div className="text-sm text-gray-500">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.upcoming}
              </div>
              <div className="text-sm text-gray-500">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {statistics.past}
              </div>
              <div className="text-sm text-gray-500">Past</div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <Spin
          spinning={loading}
          indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          tip="Loading events...">
          {renderCalendarView()}
        </Spin>
      </Content>

      {/* Modals */}
      <EventFormModal
        visible={showEventForm}
        mode={formMode}
        initialValues={selectedEvent}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowEventForm(false);
          setSelectedEvent(null);
        }}
        loading={operationLoading}
      />

      <EventDetailsModal
        visible={showEventDetails}
        event={selectedEvent}
        currentUserId={currentUserId}
        onClose={() => {
          setShowEventDetails(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onUpdateStatus={handleUpdateStatus}
        onRespond={handleRespond}
      />

      <CalendarFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />
    </Layout>
  );
};

export default CalendarPage;
