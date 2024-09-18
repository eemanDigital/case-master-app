import { useEffect } from "react";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { EditOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import useModal from "../hooks/useModal";
import {
  Button,
  Input,
  Form,
  Card,
  Select,
  DatePicker,
  Modal,
  Tooltip,
} from "antd";
import ReactQuill from "react-quill";
import { formats } from "../utils/quillFormat";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import useHandleSubmit from "../hooks/useHandleSubmit";
import { useNavigate } from "react-router-dom";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import moment from "moment";

const UpdateCaseReportForm = ({ reportId }) => {
  const { casesOptions } = useCaseSelectOptions();
  const { clientEmailsOption } = useClientSelectOptions();
  const { formData } = useInitialDataFetcher("reports", reportId);
  const { userData } = useUserSelectOptions();
  const { open, showModal, handleOk, handleCancel } = useModal(); //modal hook
  const navigate = useNavigate();

  // custom hook to handle form submission
  const {
    form,
    data,
    onSubmit,
    loading: submitLoading,
  } = useHandleSubmit(`reports/${reportId}`, "patch", "reports", "reports");

  // navigate after success
  useEffect(() => {
    if (data) {
      navigate(-1);
    }
  }, [data, navigate]);

  // Extract necessary data for caseReported and reportedBy
  const caseReported = formData?.caseReported?._id || "";
  const reportedBy = formData?.reportedBy?._id || "";

  return (
    <>
      <Tooltip title="Edit Report">
        <Button
          onClick={showModal}
          icon={<EditOutlined />}
          className="bg-yellow-500 text-white hover:bg-yellow-600"
        />
      </Tooltip>
      <Modal
        open={open}
        onOk={handleOk}
        width={900}
        footer={null}
        onCancel={handleCancel}>
        <Form
          layout="vertical"
          form={form}
          name="dynamic_form_complex"
          initialValues={{
            date: formData?.date ? moment(formData.date) : null,
            update: formData?.update,
            adjournedFor: formData?.adjournedFor,
            caseReported: caseReported,
            clientEmail: formData?.clientEmail,
            reportedBy: reportedBy,
            adjournedDate: formData?.adjournedDate
              ? moment(formData.adjournedDate)
              : null,
          }}
          className="flex justify-center">
          <Card
            title="Update Case Report"
            bordered={false}
            style={{ width: 850 }}>
            <Form.Item name="date" label="Report Date">
              <DatePicker />
            </Form.Item>

            <Form.Item
              className="mb-10 "
              name="update"
              label="Write update here..."
              rules={[
                {
                  required: true,
                  message: "Please write your update!",
                },
              ]}>
              <ReactQuill
                className="h-[200px] mb-7"
                theme="snow"
                formats={formats}
                value={formData?.update}
              />
            </Form.Item>

            <Form.Item
              className="mt-5 p-2"
              name="adjournedFor"
              label="Matter adjourned for"
              rules={[
                {
                  required: true,
                  message: "write what the matter was adjourned for!",
                },
              ]}>
              <Input placeholder="Your text here..." />
            </Form.Item>

            <Form.Item
              name="caseReported"
              label="Case Reported"
              rules={[
                {
                  required: true,
                  message: "Please, provide the case you are reporting on",
                },
              ]}>
              <Select
                placeholder="Select a case here"
                options={casesOptions}
                allowClear
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>

            <Form.Item
              name="clientEmail"
              label="Client's Name"
              rules={[
                {
                  required: true,
                  message: "Please select client to send report",
                },
              ]}>
              <Select
                placeholder="Select a client here"
                options={clientEmailsOption}
                allowClear
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="reportedBy"
              label="Case Reporter"
              rules={[
                {
                  required: true,
                  message: "Please, select reporter!",
                },
              ]}>
              <Select
                placeholder="Select a reporter"
                options={userData}
                allowClear
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>

            <Form.Item name="adjournedDate" label="Next Adjourned Date">
              <DatePicker />
            </Form.Item>

            <Form.Item>
              <Button
                loading={submitLoading}
                onClick={onSubmit}
                type="default"
                htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Card>
        </Form>
      </Modal>
    </>
  );
};

UpdateCaseReportForm.propTypes = {
  reportId: PropTypes.string.isRequired,
};

export default UpdateCaseReportForm;
