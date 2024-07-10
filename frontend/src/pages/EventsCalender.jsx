import { Calendar, Modal, Badge } from "antd";
import moment from "moment";
import useModal from "../hooks/useModal";
import { useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";

const EventsCalendar = ({ tasks }) => {
  const { open, showModal, handleOk, handleCancel } = useModal();
  const [selectedTaskDate, setSelectedTaskDate] = useState(null);
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id;

  const onSelect = (date) => {
    const tasksForDate = tasks.filter(
      (task) =>
        moment(task.dueDate).format("YYYY-MM-DD") ===
        moment(date).format("YYYY-MM-DD")
    );
    if (tasksForDate.length > 0) {
      setSelectedTaskDate(tasksForDate);
      showModal();
    }
  };

  const getListData = (value) => {
    const formattedDate = value.format("YYYY-MM-DD");
    const dynamicData =
      tasks
        ?.filter(
          (task) => moment(task.dueDate).format("YYYY-MM-DD") === formattedDate
        )
        .map((task) => ({
          type: "success",
          content: task.title,
          description: task.description,
        })) || [];

    // Add static test data
    if (value.date() === 8) {
      dynamicData.push({
        type: "warning",
        content: "Meeting",
        description: "Office Meeting",
      });
    }

    return dynamicData;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <div>
        {listData.map((item, index) => (
          <div key={index}>
            <strong className="text-rose-600"> Due Date</strong>
            <Badge status={item.type} text={item.content} />
            {item.description && <p>{item.description}</p>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <Calendar dateCellRender={dateCellRender} onSelect={onSelect} />
      <Modal
        title="Task Details"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}>
        {selectedTaskDate &&
          selectedTaskDate.map((task, index) => (
            <div key={index}>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
            </div>
          ))}
      </Modal>
    </div>
  );
};

export default EventsCalendar;
