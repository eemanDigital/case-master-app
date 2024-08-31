import { Form, Input, Button, Typography, Divider } from "antd";
import { useParams } from "react-router-dom";
import useHandleSubmit from "../hooks/useHandleSubmit";
import createMaxLengthRule from "../utils/createMaxLengthRule";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import ReactQuill from "react-quill";
import { useEffect } from "react";
import GoBackButton from "../components/GoBackButton";

const UpdateNote = () => {
  const { id } = useParams();
  const { formData, loading: loadingInitialData } = useInitialDataFetcher(
    "notes",
    id
  );

  const { form, onSubmit, loading } = useHandleSubmit(
    `notes/${id}`,
    "patch",
    undefined,
    undefined,
    undefined
  );

  useEffect(() => {
    if (formData?.note) {
      form.setFieldsValue({
        title: formData.note.title,
        content: formData.note.content,
        user: formData.note.user,
      });
    }
  }, [formData, form]);

  const titleMaxLengthRule = createMaxLengthRule(
    50,
    "Title should not be more than 50 characters"
  );
  const contentMaxLengthRule = createMaxLengthRule(
    2000,
    "Content should not be more than 2000 characters"
  );

  if (loadingInitialData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <GoBackButton />

      <div className="max-w-4xl mx-auto p-4">
        <Form
          className="space-y-6"
          layout="vertical"
          form={form}
          name="Note Update Form"
          onFinish={onSubmit}>
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>Update Note</Typography.Title>
          </Divider>
          <section className="bg-gray-50 p-4 rounded-lg shadow">
            <Form.Item
              label="Note Title"
              name="title"
              rules={[
                {
                  required: true,
                  message: "Please provide a title for the note!",
                },
                titleMaxLengthRule,
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
                contentMaxLengthRule,
              ]}>
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
          </section>
        </Form>
      </div>
    </div>
  );
};

export default UpdateNote;
