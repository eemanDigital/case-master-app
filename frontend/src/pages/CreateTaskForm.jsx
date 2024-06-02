import { useState, useCallback, useMemo } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { taskPriorityOptions } from "./../data/options";
import {
  Button,
  Input,
  Form,
  Modal,
  Card,
  Divider,
  Typography,
  Spin,
  Select,
  DatePicker,
} from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { SelectInputs } from "../components/DynamicInputs";

const CreateTaskForm = () => {
  // destructure textarea from input
  const { TextArea } = Input;

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState("Content of the modal");
  const showModal = () => {
    setOpen(true);
  };
  const handleOk = () => {
    setModalText("The modal will be closed after two seconds");
    setConfirmLoading(true);
    setTimeout(() => {
      setOpen(false);
      setConfirmLoading(false);
    }, 2000);
  };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  // destructor authenticate from useAuth
  const { dataFetcher, data } = useDataFetch();
  const { cases, users } = useDataGetterHook();

  //  map over cases value
  const casesData = Array.isArray(cases?.data)
    ? cases?.data.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.name[0]?.name;
        const secondName = secondParty?.name[0]?.name;

        return {
          value: singleCase?._id,
          label: `${firstName || ""} vs ${secondName || ""}`,
        };
      })
    : [];

  //  get users/reporter data
  const usersData = Array.isArray(users?.data)
    ? users?.data.map((user) => {
        return {
          value: user?._id,
          label: user?.fullName,
        };
      })
    : [];

  // console.log(users);

  // form submit functionalities
  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        // form.resetFields();
      }
    },
    []
    // [form]
  );

  // submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      return;
    }
    const result = await dataFetcher("tasks", "POST", values); // Submit the form data to the backend
    console.log(values);
    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher]);

  return (
    <>
      <Button onClick={showModal} className="bg-green-700 text-white">
       Create Task
      </Button>
      <Modal
        title="Send Reminder on Task"
        open={open}
        onOk={handleOk}
        // confirmLoading={}
        onCancel={handleCancel}>
        <section className="flex justify-between gap-8 ">
          <Form
            layout="vertical"
            form={form}
            name="dynamic_form_complex"
            // autoComplete="off"
            className="flex  justify-center">
            <Card
              title="Add Task"
              bordered={false}
              style={{ width: 400, height: 850 }}>
              <div>
                {/* task title */}
                <Form.Item
                  label="Task Title"
                  name="title"
                  initialValue={formData?.title}>
                  <Input />
                </Form.Item>
              </div>

              {/* instruction */}
              <Form.Item
                name="instruction"
                label="Write Instruction here..."
                //   tooltip="This is a required field"
                initialValue={formData?.instruction}
                rules={[
                  {
                    required: true,
                    message: "Please, provide your instruction!",
                  },
                ]}>
                <TextArea rows={5} placeholder="Your text here..." />
              </Form.Item>

              {/* case to work on */}
              <Form.Item
                name="caseToWorkOn"
                label="Case To Work On"
                initialValue={formData?.caseToWorkOn}>
                <Select
                  noStyle
                  notFoundContent={data ? <Spin size="small" /> : null}
                  placeholder="Select a case here"
                  options={casesData}
                  allowClear
                  style={{
                    width: "100%",
                  }}
                />
              </Form.Item>

              {/* assigned to */}

              <Form.Item
                name="assignedTo"
                label="Assigned To"
                initialValue={formData?.assignedTo}
                rules={[
                  {
                    required: true,
                    message: "Please, select reporter!",
                  },
                ]}>
                <Select
                  mode="multiple"
                  noStyle
                  notFoundContent={data ? <Spin size="small" /> : null}
                  placeholder="Select a staff"
                  options={usersData}
                  allowClear
                  style={{
                    width: "100%",
                  }}
                />
              </Form.Item>

              {/* date assigned */}
              {/* <Form.Item name="dateAssigned" label="Assigned Date">
            <DatePicker />
          </Form.Item> */}

              {/* due date */}
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[
                  {
                    required: true,
                    message: "Specify date for staff to complete the task",
                  },
                ]}>
                <DatePicker />
              </Form.Item>
              {/* UPDATE */}

              {/* task priority */}

              <SelectInputs
                defaultValue="high"
                fieldName="taskPriority"
                label="Task Priority"
                initialValue={formData?.taskPriority}
                options={taskPriorityOptions}
              />

              <Form.Item>
                <Button onClick={onSubmit} type="default" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Card>
          </Form>
        </section>
      </Modal>
    </>
  );
};

export default CreateTaskForm;
