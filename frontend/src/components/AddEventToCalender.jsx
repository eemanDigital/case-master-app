import { useState } from "react";
import { google, outlook, office365, yahoo, ics } from "calendar-link";
import { Modal, Button, Tooltip } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { FaGoogle, FaMicrosoft, FaYahoo, FaApple } from "react-icons/fa";
import PropTypes from "prop-types";

const AddEventToCalender = ({ title, description, startDate, endDate }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // check if date string is valid
  const isValidDate = (date) => {
    return !isNaN(Date.parse(date));
  };

  // Calculate duration of event
  const calculateDuration = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationInHours = (end - start) / (1000 * 60 * 60);
    return [Math.max(1, Math.round(durationInHours)), "hour"];
  };

  // Event object for calendar
  // const event = {
  //   title: title,
  //   description: description,
  //   start: new Date(startDate).toISOString(),
  //   end: new Date(endDate).toISOString(),
  //   duration: calculateDuration(),
  // };
  const event = {
    title: title,
    description: description,
    start: isValidDate(startDate)
      ? new Date(startDate).toISOString()
      : new Date().toISOString(),
    end: isValidDate(endDate)
      ? new Date(endDate).toISOString()
      : new Date().toISOString(),
    duration: calculateDuration(),
  };

  console.log(event, "EVENT");
  // Calendar links for different services
  const googleUrl = google(event);
  const outlookUrl = outlook(event);
  const officeUrl = office365(event);
  const yahooUrl = yahoo(event);
  const appleUrl = ics(event);

  // Modal functions
  const showModal = () => setIsModalVisible(true);
  const handleOk = () => setIsModalVisible(false);
  const handleCancel = () => setIsModalVisible(false);

  return (
    <div>
      <Tooltip title="Add to Calendar">
        <Button
          type="primary"
          icon={<CalendarOutlined />}
          onClick={showModal}
          className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600">
          Add to Calendar
        </Button>
      </Tooltip>
      <Modal
        title={
          <span className="text-lg font-semibold">Add Event to Calendar</span>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        className="font-sans">
        <div className="grid grid-cols-1 gap-4">
          <CalendarButton
            icon={<FaGoogle className="text-red-500" />}
            text="Google Calendar"
            url={googleUrl}
          />
          <CalendarButton
            icon={<FaMicrosoft className="text-blue-500" />}
            text="Outlook Calendar"
            url={outlookUrl}
          />
          <CalendarButton
            icon={<FaMicrosoft className="text-blue-700" />}
            text="Office 365 Calendar"
            url={officeUrl}
          />
          <CalendarButton
            icon={<FaYahoo className="text-purple-600" />}
            text="Yahoo Calendar"
            url={yahooUrl}
          />
          <CalendarButton
            icon={<FaApple className="text-gray-700" />}
            text="Apple Calendar (ICS)"
            url={appleUrl}
          />
        </div>
      </Modal>
    </div>
  );
};

// CalendarButton component
const CalendarButton = ({ icon, text, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
    <span className="text-xl mr-3">{icon}</span>
    <span className="text-gray-700">{text}</span>
  </a>
);

// PropTypes for AddEventToCalender component
CalendarButton.propTypes = {
  icon: PropTypes.element.isRequired,
  text: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
};

// PropTypes for CalendarButton component
AddEventToCalender.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
};

export default AddEventToCalender;
