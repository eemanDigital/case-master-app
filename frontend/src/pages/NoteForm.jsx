import { useState } from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import useHandleSubmit from "../hooks/useHandleSubmit";
import createMaxLengthRule from "../utils/createMaxLengthRule";
import ReactQuill from "react-quill";
import GoBackButton from "../components/GoBackButton";

const { Title } = Typography;

const NoteForm = () => {
  const [formData, setFormData] = useState({});

  const { form, onSubmit, loading } = useHandleSubmit(
    "notes",
    "post",
    undefined,
    undefined,
    undefined
  );

  return (
    <Card
      width="80%"
      title={<Title level={3}>Create Note</Title>}
      className="modal-container">
      <GoBackButton />
      <Form
        layout="vertical"
        form={form}
        name="create_note_form"
        className="flex flex-col gap-6"
        initialValues={formData}
        onFinish={onSubmit}>
        <Form.Item
          label="Note Title"
          name="title"
          rules={[
            {
              required: true,
              message: "Please provide a title for the note!",
            },
            createMaxLengthRule(
              50,
              "Title should not be more than 50 characters"
            ),
          ]}>
          <Input placeholder="Enter note title" />
        </Form.Item>
        <Form.Item
          name="content"
          label="Content"
          rules={[
            {
              required: true,
              message: "Please provide content for the note!",
            },
          ]}>
          {/* <TextArea rows={4} placeholder="Enter note content" /> */}
          <ReactQuill
            style={{ height: "300px" }}
            placeholder="Enter note content"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full">
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default NoteForm;
