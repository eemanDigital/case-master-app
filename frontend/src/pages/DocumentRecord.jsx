import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  DatePicker,
  Select,
} from "antd";
import useHandleSubmit from "../hooks/useHandleSubmit";
import createMaxLengthRule from "../utils/createMaxLengthRule";
import GoBackButton from "../components/GoBackButton";
import { doc_type } from "../data/options";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { useSelector } from "react-redux";

const { Title } = Typography;

const DocumentRecord = () => {
  const [formData, setFormData] = useState({});
  const { userData } = useUserSelectOptions();
  // const { user } = useSelector((state) => state.auth);
  // const currentUerName = user?.data?.firstName + " " + user?.data?.lastName;

  // console.log(currentUerName);

  const { form, onSubmit, loading } = useHandleSubmit(
    "documentRecord",
    "post",
    undefined,
    undefined,
    undefined
  );

  return (
    <Card
      width="80%"
      title={<Title level={3}>Add Document</Title>}
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
          label="Document Name"
          name="documentName"
          rules={[
            {
              required: true,
              message: "Please provide a name or title for the document!",
            },
            createMaxLengthRule(
              50,
              "Title should not be more than 50 characters"
            ),
          ]}>
          <Input placeholder="Enter note title" />
        </Form.Item>
        <Form.Item
          label="Document Type"
          name="documentType"
          rules={[
            {
              required: true,
              message: "Please provide a document type!",
            },
          ]}>
          <Select
            placeholder="Select Document's type"
            showSearch
            // filterOption={filterOption}
            options={doc_type}
            allowClear
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          label="Document Reference"
          name="docRef"
          rules={[
            {
              required: true,
              message: "Please provide a reference for the document!",
            },
          ]}>
          <Input placeholder="Enter document reference e.g. Suit No." />
        </Form.Item>
        <Form.Item
          label="Sender"
          name="sender"
          rules={[
            {
              required: true,
              message: "Please provide the sender's name or description!",
            },
          ]}>
          <Input placeholder="Enter sender's name" />
        </Form.Item>
        <Form.Item
          label="Recipient"
          name="recipient"
          rules={[
            {
              required: true,
              message: "Please provide the recipient's name!",
            },
          ]}>
          <Select
            placeholder="Select account officer"
            options={userData}
            allowClear
            className="w-full"
          />
        </Form.Item>
        <Form.Item
          label="Forwarded To"
          name="forwardedTo"
          rules={[
            {
              required: true,
              message:
                "Please provide the name of the person the document was forwarded to!",
            },
          ]}>
          <Select
            placeholder="Select person document is forwarded to"
            options={userData}
            allowClear
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          label="Date Received"
          name="dateReceived"
          rules={[
            {
              required: true,
              message: "Please provide the date the document was received!",
            },
          ]}>
          <DatePicker />
        </Form.Item>

        {/* <Form.Item
          label="Date Received"
          name="dateReceived"
          rules={[
            {
              required: true,
              message: "Please provide the date the document was received!",
            },
          ]}>
          <Input placeholder="Enter date received" />
        </Form.Item> */}

        <Form.Item label="Note" name="note">
          <Input placeholder="Enter note" />
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

export default DocumentRecord;
