import { useState, useCallback } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { taskPriorityOptions } from "./../data/options";
import {
  Button,
  Input,
  Form,
  Modal,
  Card,
  Spin,
  Select,
  DatePicker,
} from "antd";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useModal from "../hooks/useModal";
import { SelectInputs } from "../components/DynamicInputs";
import useClientSelectOptions from "../hooks/useClientSelectOptions";

const CreateTaskForm = () => {
  // destructure textarea from input
  const { TextArea } = Input;
  const { casesOptions } = useCaseSelectOptions();
  const { userData } = useUserSelectOptions();
  const { clientOptions } = useClientSelectOptions();

  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal(); //modal hook

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  // destructor authenticate from useAuth
  const { dataFetcher, data } = useDataFetch();

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
      // console.log("TA", values);
    } catch (errorInfo) {
      return;
    }
    const result = await dataFetcher("tasks", "POST", values); // Submit the form data to the backend
    console.log(values);
    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher]);

  // console.log("TAF", formData);
  return (
    <>
      <Button onClick={showModal} className="bg-green-700 text-white">
        Create Task
      </Button>
      <Modal
        width="70%"
        title="Assign Task"
        open={open}
        onOk={handleOk}
        footer={null}
        // confirmLoading={}
        onCancel={handleCancel}>
        <section className="flex justify-between gap-8 ">
          <Form
            layout="vertical"
            form={form}
            name="dynamic_form_complex"
            // autoComplete="off"
            className="flex  justify-center">
            <div className="flex flex-wrap justify-between items-center">
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
                  options={casesOptions}
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
                // rules={[
                //   {
                //     required: true,
                //     message:
                //       "A task must be assigned to either a staff or a client",
                //   },
                // ]}
              >
                <Select
                  mode="multiple"
                  noStyle
                  notFoundContent={data ? <Spin size="small" /> : null}
                  placeholder="Select a staff"
                  options={userData}
                  allowClear
                  style={{
                    width: "100%",
                  }}
                />
              </Form.Item>
              {/* assignedToClient */}

              <Form.Item
                name="assignedToClient"
                label="Assigned To Client"
                initialValue={formData?.assignedToClient}
                // rules={[
                //   {
                //     required: true,
                //     message:
                //       "A task must be assigned to either a staff or a client",
                //   },
                // ]}
              >
                <Select
                  noStyle
                  notFoundContent={data ? <Spin size="small" /> : null}
                  placeholder="Select a client"
                  options={clientOptions}
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
                  Save
                </Button>
              </Form.Item>
            </div>
          </Form>
        </section>
      </Modal>
    </>
  );
};

export default CreateTaskForm;
