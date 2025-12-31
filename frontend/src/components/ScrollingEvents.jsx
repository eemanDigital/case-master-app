import { useEffect, useState, useMemo } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import Marquee from "react-fast-marquee";
import { FaRegCalendar, FaRegClock } from "react-icons/fa";
import { Link } from "react-router-dom";
import moment from "moment";
import LoadingSpinner from "./LoadingSpinner";

const ScrollingEvents = () => {
  const { events, fetchData, loading } = useDataGetterHook();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(moment());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch events data
  useEffect(() => {
    fetchData("events", "events");
  }, [fetchData]);

  // Filter events to get only upcoming and today's events
  const filteredEvents = useMemo(() => {
    if (!events?.data) return [];

    const now = moment();

    return events.data
      .filter((event) => {
        const eventStart = moment(event.start);
        const eventEnd = moment(event.end);

        // Include events that:
        // 1. Are happening today (started or about to start)
        // 2. Are in the future
        // 3. Exclude events that ended more than 1 hour ago

        const isToday = eventStart.isSame(now, "day");
        const isFuture = eventStart.isAfter(now);
        const endedRecently = eventEnd.isAfter(now.subtract(1, "hour"));

        return (isToday && endedRecently) || isFuture;
      })
      .sort((a, b) => moment(a.start) - moment(b.start));
  }, [events, currentTime]);

  useEffect(() => {
    setUpcomingEvents(filteredEvents);
  }, [filteredEvents]);

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = moment(dateString);
    const now = moment();

    if (date.isSame(now, "day")) {
      // Show time only for today's events
      return date.format("h:mm A");
    } else if (date.isSame(now.add(1, "day"), "day")) {
      // Show "Tomorrow" and time
      return `Tomorrow ${date.format("h:mm A")}`;
    } else {
      // Show date and time
      return date.format("MMM D, h:mm A");
    }
  };

  // Get event status with better categorization
  const getEventStatus = (startDate, endDate) => {
    const now = moment();
    const start = moment(startDate);
    const end = moment(endDate);

    // Check if event is currently happening
    if (now.isBetween(start, end)) {
      return (
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          Happening Now
        </span>
      );
    }

    const diffMinutes = start.diff(now, "minutes");
    const diffHours = start.diff(now, "hours");
    const diffDays = start.diff(now, "days");

    // Event starts within 15 minutes
    if (diffMinutes > 0 && diffMinutes <= 15) {
      return (
        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          Starting Soon
        </span>
      );
    }

    // Event starts within 1 hour
    if (diffHours === 0 && diffMinutes > 15) {
      return (
        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          In {diffMinutes} min
        </span>
      );
    }

    // Event starts within 24 hours
    if (diffHours > 0 && diffHours < 24) {
      return (
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          In {diffHours} hr{diffHours > 1 ? "s" : ""}
        </span>
      );
    }

    // Event starts tomorrow
    if (diffDays === 1) {
      return (
        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          Tomorrow
        </span>
      );
    }

    // Event starts in next 7 days
    if (diffDays > 1 && diffDays <= 7) {
      return (
        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          In {diffDays} days
        </span>
      );
    }

    // Event is far in the future
    return (
      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
        Upcoming
      </span>
    );
  };

  // Get event card background based on status
  const getEventCardStyle = (startDate, endDate) => {
    const now = moment();
    const start = moment(startDate);
    const end = moment(endDate);

    if (now.isBetween(start, end)) {
      return "bg-green-50 border-l-4 border-green-500";
    }

    const diffMinutes = start.diff(now, "minutes");
    if (diffMinutes > 0 && diffMinutes <= 60) {
      return "bg-yellow-50 border-l-4 border-yellow-500";
    }

    return "bg-white border-l-4 border-blue-500";
  };

  // Display loading if data is being fetched
  if (loading.events) {
    return (
      <div className="font-medium text-center text-gray-500 py-2">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span>Loading events...</span>
        </div>
      </div>
    );
  }

  // If no events
  if (!loading.events && upcomingEvents.length === 0) {
    return (
      <div className="text-center text-gray-500 py-3">
        <div className="flex items-center justify-center">
          <FaRegCalendar className="mr-2 text-gray-400" />
          <span>No upcoming events scheduled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-between">
      {upcomingEvents.length > 0 && (
        <Marquee
          speed={40}
          gradient={false}
          pauseOnHover={true}
          className="py-2">
          {upcomingEvents.map((event) => (
            <div
              key={event._id}
              className={`flex items-center justify-between rounded-lg shadow-sm p-2 mr-4 min-w-[320px] ${getEventCardStyle(
                event.start,
                event.end
              )}`}>
              <div className="mr-3 flex-shrink-0">
                <FaRegCalendar className="text-blue-500" size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  to={`events/${event._id}/details`}
                  className="font-medium text-gray-800 hover:text-blue-600 truncate block"
                  title={event.title}>
                  {event.title}
                </Link>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <FaRegClock className="mr-1 flex-shrink-0" size={12} />
                  <span className="truncate">
                    {formatDateTime(event.start)}
                    {event.end && ` - ${moment(event.end).format("h:mm A")}`}
                  </span>
                </div>
                {event.location && (
                  <div
                    className="text-xs text-gray-500 mt-1 truncate"
                    title={event.location}>
                    📍 {event.location}
                  </div>
                )}
              </div>

              <div className="ml-3 flex-shrink-0">
                {getEventStatus(event.start, event.end)}
              </div>
            </div>
          ))}
        </Marquee>
      )}

      {/* Static display for debugging - shows count and next event */}
      <div className="hidden md:flex items-center ml-4">
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
          <span className="font-medium text-blue-600">
            {upcomingEvents.length}
          </span>{" "}
          upcoming event{upcomingEvents.length !== 1 ? "s" : ""}
          {upcomingEvents.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Next: {moment(upcomingEvents[0]?.start).format("h:mm A")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrollingEvents;
