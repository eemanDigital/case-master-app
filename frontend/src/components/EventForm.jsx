import { Form, Input, DatePicker, Button, Modal } from "antd";
import useModal from "../hooks/useModal";
import moment from "moment";

const EventForm = ({ onSubmit, onCancel, event }) => {
  const { open, showModal, handleOk, handleCancel } = useModal();

  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Add Event
      </Button>
      <Modal
        width={510}
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}>
        <Form
          initialValues={{
            title: event?.title || "",
            start: event ? moment(event.start) : null,
            end: event ? moment(event.end) : null,
          }}
          onFinish={onSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please input the title!" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="start"
            label="Start"
            rules={[{ required: true, message: "Please select start date!" }]}>
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="end" label="End">
            <DatePicker showTime />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {event ? "Update" : "Add"}
            </Button>
            <Button onClick={onCancel} style={{ marginLeft: "8px" }}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EventForm;
