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
  Spin,
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
import LoadingSpinner from "../components/LoadingSpinner";

// const baseURL = import.meta.env.VITE_BASE_URL;

const UpdateCaseReportForm = ({ reportId }) => {
  const { casesOptions } = useCaseSelectOptions();
  const { formData, loading } = useInitialDataFetcher("reports", reportId);
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

  // loading initialData
  if (loading) {
    return <LoadingSpinner />;
  }

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
          // autoComplete="off"
          className="flex  justify-center">
          {/* <h1 className="text-4xl">Case Report</h1> */}
          <Card
            title="Update Case Report"
            bordered={false}
            style={{ width: 850 }}>
            <Form.Item name="date" label="Report Date">
              <DatePicker />
            </Form.Item>
            {/* UPDATE */}

            <Form.Item
              name="update"
              label="Write update here..."
              //   tooltip="This is a required field"
              initialValue={formData?.update}
              rules={[
                {
                  required: true,
                  message: "Please write your update!",
                },
              ]}>
              {/* <TextArea rows={8} placeholder="Your text here..." /> */}
              <ReactQuill
                className="h-[200px] mb-7"
                theme="snow"
                formats={formats}
                // value={formData.body}
                dangerouslySetInnerHTML={{ __html: formData?.update }}
              />
            </Form.Item>

            {/* MATTER ADJOURNED FOR */}
            <Form.Item
              name="adjournedFor"
              label="Matter adjourned for"
              //   tooltip="This is a required field"
              initialValue={formData?.adjournedFor}
              rules={[
                {
                  required: true,
                  message: "write what the matter was adjourned for!",
                },
              ]}>
              <Input placeholder="Your text here..." />
            </Form.Item>

            {/* CASE REPORTED */}

            <Form.Item
              name="caseReported"
              label="Case Reported"
              initialValue={formData?.caseReported}
              rules={[
                {
                  required: true,
                  message: "Please, provide the case you are reporting on",
                },
              ]}>
              <Select
                noStyle
                notFoundContent={data ? <Spin size="small" /> : null}
                placeholder="Select a case here"
                options={casesOptions}
                allowClear
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>

            {/* REPORTER */}
            <Form.Item
              name="reportedBy"
              label="Case Reporter"
              initialValue={formData?.reportedBy}
              rules={[
                {
                  required: true,
                  message: "Please, select reporter!",
                },
              ]}>
              <Select
                noStyle
                notFoundContent={data ? <Spin size="small" /> : null}
                placeholder="Select a reporter"
                options={userData}
                allowClear
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>

            {/* ADJOURNED DATE */}
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
