import { useEffect, useState, useMemo } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import Marquee from "react-fast-marquee";
import { FaRegCalendar, FaRegClock } from "react-icons/fa";
// import { Calendar, Clock } from "lucide-react";

const ScrollingEvents = () => {
  const { events, fetchData, loading } = useDataGetterHook();
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    fetchData("events", "events");
  }, [fetchData]);

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

  const formatDate = (dateString) => {
    const options = {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getEventStatus = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `In ${diffDays} days`;
    return "";
  };

  if (loading.events) {
    return (
      <div className="flex justify-center items-center h-16">
        Loading events...
      </div>
    );
  }

  return (
    <div className=" flex justify-between ">
      {/* <h2 className="text-xl font-semibold mb-2 text-gray-800">
        Upcoming Events
      </h2> */}
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
                <h3 className="font-medium text-gray-800">{event.title}</h3>
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
        <p className="text-gray-600 italic">No upcoming events to display.</p>
      )}
    </div>
  );
};

export default ScrollingEvents;
