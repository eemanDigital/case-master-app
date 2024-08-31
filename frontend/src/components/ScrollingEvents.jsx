import { useEffect, useState, useMemo } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import Marquee from "react-fast-marquee";
import { FaRegCalendar, FaRegClock } from "react-icons/fa";
import { Link } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
// import { Calendar, Clock } from "lucide-react";

const ScrollingEvents = () => {
  const { events, fetchData, loading } = useDataGetterHook();
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // Fetch events data
  useEffect(() => {
    fetchData("events", "events");
  }, [fetchData]);

  // Filter events to get only upcoming events
  const filteredEvents = useMemo(() => {
    if (!events?.data) return [];
    const now = new Date();
    return events.data
      .filter((event) => new Date(event.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [events]);

  useEffect(() => {
    setUpcomingEvents(filteredEvents);
  }, [filteredEvents]);

  // Format date
  const formatDate = (dateString) => {
    const options = {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };
  // Get event status
  const getEventStatus = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if event is today, tomorrow or in the next 7 days
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `In ${diffDays} days`;
    return "";
  };

  // Display loading if data is being fetched
  if (loading.events) {
    return (
      <div className="font-medium text-center">
        checking if there is an event...
      </div>
    );
  }

  return (
    <div className=" flex justify-between ">
      {upcomingEvents.length > 0 ? (
        <Marquee speed={40} gradient={false} className="py-1">
          {upcomingEvents.map((event) => (
            <div
              key={event._id}
              className="flex items-center justify-between bg-white rounded-lg shadow-sm p-1 mr-4">
              <div className="mr-3">
                <FaRegCalendar className="text-blue-500" size={24} />
              </div>
              <div>
                <Link
                  to={`events/${event._id}/details`}
                  className="font-medium text-gray-800 hover:text-gray-400">
                  {event.title}
                </Link>
                <div className="flex items-center text-sm text-gray-600">
                  <FaRegClock className="mr-1" size={14} />
                  {formatDate(event.start)}
                </div>
              </div>
              <div className="ml-3">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {getEventStatus(event.start)}
                </span>
              </div>
            </div>
          ))}
        </Marquee>
      ) : (
        []
      )}
    </div>
  );
};

export default ScrollingEvents;
