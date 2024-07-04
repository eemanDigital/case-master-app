// import { Calendar, momentLocalizer } from "react-big-calendar";
// import { Modal, Button } from "antd";
// import moment from "moment";
// import "react-big-calendar/lib/css/react-big-calendar.css";
// import useModal from "../hooks/useModal";

// const localizer = momentLocalizer(moment);

// const EventCalendar = ({ events, causeListCalenderData }) => {
//   const { open, showModal, handleOk, handleCancel } = useModal();

//   // Function to transform individual event
//   const transformEvent = (event) => ({
//     ...event,
//     start: new Date(event.start),
//     end: event.end ? new Date(event.end) : new Date(event.start), // Use start date as fallback for missing end date
//   });

//   // Transform adjourned events
//   const transformedAdjournedEvents =
//     causeListCalenderData?.flatMap((item) => {
//       if (!item?.adjournedDate) return []; // Skip if adjournedDate is missing
//       const adjournedEvent = {
//         title: `Court Case: ${item?.caseReported?.firstParty?.name[0]?.name} vs ${item?.caseReported?.secondParty?.name[0]?.name}`,
//         start: new Date(item.adjournedDate),
//         end: new Date(item.adjournedDate),
//       };
//       return [adjournedEvent];
//     }) || [];

//   // Transform provided events, ensuring they have a start date
//   const transformedProvidedEvents =
//     events?.filter((e) => e.start).map(transformEvent) || [];

//   // Combine and flatten all events
//   const allEvents = [
//     ...transformedAdjournedEvents,
//     ...transformedProvidedEvents,
//   ];

//   return (
//     <div>
//       <Button className="bg-blue-500 text-white" onClick={showModal}>
//         View Events
//       </Button>
//       <Modal
//         width={1000}
//         title="Manage Events"
//         open={open}
//         onOk={handleOk}
//         onCancel={handleCancel}
//         footer={null}>
//         <h2>My Calendar</h2>
//         <Calendar
//           localizer={localizer}
//           events={allEvents}
//           startAccessor="start"
//           endAccessor="end"
//           style={{ height: 500 }}
//         />
//       </Modal>
//     </div>
//   );
// };

// export default EventCalendar;

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { Modal, Button } from "antd";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import useModal from "../hooks/useModal";
import EventForm from "./EventForm";
import { useDataFetch } from "../hooks/useDataFetch";

const localizer = momentLocalizer(moment);

const EventCalendar = ({ events: initialEvents, causeListCalenderData }) => {
  const [events, setEvents] = useState([]);
  const { open, showModal, handleOk, handleCancel } = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const { data, loading, error, dataFetcher } = useDataFetch();

  useEffect(() => {
    // Transform and set initial events
    const transformEvent = (event) => ({
      ...event,
      start: new Date(event.start),
      end: event.end ? new Date(event.end) : new Date(event.start),
    });

    const transformedAdjournedEvents =
      causeListCalenderData?.flatMap((item) => {
        if (!item?.adjournedDate) return [];
        const adjournedEvent = {
          title: `Court Case: ${item?.caseReported?.firstParty?.name[0]?.name} vs ${item?.caseReported?.secondParty?.name[0]?.name}`,
          start: new Date(item.adjournedDate),
          end: new Date(item.adjournedDate),
        };
        return [adjournedEvent];
      }) || [];

    const transformedProvidedEvents =
      initialEvents?.filter((e) => e.start).map(transformEvent) || [];

    setEvents([...transformedAdjournedEvents, ...transformedProvidedEvents]);
  }, [initialEvents, causeListCalenderData]);

  // CRUD Functions
  const addEvent = (event) => {
    dataFetcher("events", "post");
    setEvents([...events, event]);
  };

  const updateEvent = (updatedEvent) => {
    setEvents(
      events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const deleteEvent = (eventToDelete) => {
    setEvents(events.filter((event) => event.id !== eventToDelete.id));
  };

  // Handlers for adding/editing events
  const handleAddEvent = (values) => {
    const newEvent = {
      id: events.length + 1, // Simple ID generation for demo purposes
      title: values.title,
      start: values.start.toDate(),
      end: values.end ? values.end.toDate() : values.start.toDate(),
    };
    addEvent(newEvent);
    handleOk();
  };

  const handleEditEvent = (values) => {
    const updatedEvent = {
      ...currentEvent,
      title: values.title,
      start: values.start.toDate(),
      end: values.end ? values.end.toDate() : values.start.toDate(),
    };
    updateEvent(updatedEvent);
    handleOk();
  };

  const handleSelectEvent = (event) => {
    setCurrentEvent(event);
    setIsEditing(true);
    showModal();
  };

  const handleAddButtonClick = () => {
    setCurrentEvent(null);
    setIsEditing(false);
    showModal();
  };

  return (
    <div>
      <Button className="bg-blue-500 text-white" onClick={handleAddButtonClick}>
        Add Event
      </Button>
      <Modal
        width={1000}
        title={isEditing ? "Edit Event" : "Add Event"}
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}>
        <EventForm
          onSubmit={isEditing ? handleEditEvent : handleAddEvent}
          onCancel={() => {
            handleCancel();
            setCurrentEvent(null); // Reset current event on cancel
          }}
          event={currentEvent}
        />
        <h2>My Calendar</h2>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectEvent={handleSelectEvent}
        />
      </Modal>
    </div>
  );
};

export default EventCalendar;
