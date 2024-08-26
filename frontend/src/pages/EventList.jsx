import { useEffect, useState } from "react";
import { Table, Space, Button, Popconfirm, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { deleteData } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { MdEventAvailable } from "react-icons/md";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import AddEventToCalender from "../components/AddEventToCalender"; // Import the component

const EventList = () => {
  const { events, fetchData, error } = useDataGetterHook();
  const [isModalVisible, setIsModalVisible] = useState(false);
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  const dispatch = useDispatch();
  useEffect(() => {
    fetchData("events", "events");
  }, []);

  // handle delete
  const deleteEvent = async (id) => {
    try {
      await dispatch(deleteData(`events/${id}`));
      await fetchData("events", "events");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  // error toast
  if (error.events) {
    return (
      <PageErrorAlert
        errorCondition={error.events}
        errorMessage={error.event || "Failed to fetch event data"}
      />
    );
  }

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Link to={`events/${record?._id}/details`}>{text}</Link>
      ),
    },
    {
      title: "Start",
      dataIndex: "start",
      key: "start",
      render: (start) => new Date(start).toLocaleString(),
    },
    {
      title: "End",
      dataIndex: "end",
      key: "end",
      render: (end) => new Date(end).toLocaleString(),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <AddEventToCalender
            title={`Office Event:  ${record.title}`}
            description={`Event Description: ${record.description}`}
            startDate={record.start}
            endDate={record.end}
          />
          <Popconfirm
            title="Are you sure you want to delete this event?"
            onConfirm={() => deleteEvent(record?._id)}
            okText="Yes"
            cancelText="No">
            <Button icon={<DeleteOutlined />} danger></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full p-4">
      <Button
        onClick={() => setIsModalVisible(true)}
        className="flex items-center space-x-2 bg-white text-blue-500 ">
        <MdEventAvailable size={20} />
        <span>Show Events</span>
      </Button>
      <Modal
        width={1000}
        title="Event List"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}>
        <Table
          columns={columns}
          dataSource={events?.data}
          rowKey="_id"
          pagination={{ pageSize: 5 }} // Add pagination for better UX
          scroll={{ x: 700 }}
        />
      </Modal>
    </div>
  );
};

export default EventList;
