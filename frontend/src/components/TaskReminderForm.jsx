import { useState, useCallback } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { useParams } from "react-router-dom";
import { taskPriorityOptions } from "../data/options";
import {
  Button,
  Input,
  Form,
  Modal,
  //   Space,
  Card,
  Divider,
  Typography,
  Spin,
  Select,
  DatePicker,
} from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { SelectInputs } from "./DynamicInputs";
import TaskList from "./TaskList";

const TaskReminderForm = ({ id }) => {
  //   const { id } = useParams();
  const [open, setOpen] = useState(false);
  //   const [confirmLoading, setConfirmLoading] = useState(false);
  //   const [modalText, setModalText] = useState("Content of the modal");
  const showModal = () => {
    setOpen(true);
  };
  //   const handleOk = () => {
  //     setModalText("The modal will be closed after two seconds");
  //     setConfirmLoading(true);
  //     setTimeout(() => {
  //       setOpen(false);
  //       setConfirmLoading(false);
  //     }, 2000);
  //   };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };

  // destructure textarea from input
  const { TextArea } = Input;

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    reminder: {
      message: "",
    },
  });
  // destructor authenticate from useAuth
  const { dataFetcher, data, loading, error } = useDataFetch();

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
    const result = await dataFetcher(`tasks/${id}`, "patch", values); // Submit the form data to the backend
    console.log("VALUE", values);
    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher, id]);

  // console.log("FORM", formData);
  return (
    <>
      <Button onClick={showModal} className="bg-green-700 text-white">
        Send a reminder
      </Button>
      <Modal
        title="Send Reminder on Task"
        open={open}
        // onOk={handleOk}
        confirmLoading={loading}
        onCancel={handleCancel}>
        <section className="flex justify-between gap-8 ">
          <Form
            layout="vertical"
            form={form}
            name="dynamic_form_complex"
            // autoComplete="off"
            className="flex  justify-center">
            <Card bordered={false} style={{ width: 400 }}>
              {/* instruction */}
              <Form.Item
                name={["reminder", "message"]}
                label="Write your message here..."
                //   tooltip="This is a required field"
                initialValue={formData?.reminder.message}
                rules={[
                  {
                    required: true,
                    message: "Please, provide your message!",
                  },
                ]}>
                <TextArea rows={5} placeholder="Your text here..." />
              </Form.Item>

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
export default TaskReminderForm;

// const TaskReminder = () => {
//   // destructure textarea from input
//   const { TextArea } = Input;

//   const [form] = Form.useForm();
//   const [formData, setFormData] = useState({
//     reminder: {
//       message: "",
//     },
//   });
//   // destructor authenticate from useAuth
//   const { dataFetcher, data, loading, error  } = useDataFetch();

//   // form submit functionalities
//   const handleSubmission = useCallback(
//     (result) => {
//       if (result?.error) {
//         // Handle Error here
//       } else {
//         // Handle Success here
//         // form.resetFields();
//       }
//     },
//     []
//     // [form]
//   );

//   // submit data
//   const onSubmit = useCallback(async () => {
//     let values;
//     try {
//       values = await form.validateFields(); // Validate the form fields
//     } catch (errorInfo) {
//       return;
//     }
//     const result = await dataFetcher("tasks/", "POST", values); // Submit the form data to the backend
//     console.log(values);
//     handleSubmission(result); // Handle the submission after the API Call
//   }, [form, handleSubmission, dataFetcher]);

//   return (
//     <section className="flex justify-between gap-8 ">
//       <Form
//         layout="vertical"
//         form={form}
//         name="dynamic_form_complex"
//         // autoComplete="off"
//         className="flex  justify-center">
//         <Card
//           title="Add Task"
//           bordered={false}
//           style={{ width: 400, height: 850 }}>
//           <div>
//             {/* task title */}
//             <Form.Item
//               label="Task Title"
//               name="title"
//               initialValue={formData?.title}>
//               <Input />
//             </Form.Item>
//           </div>

//           {/* instruction */}
//           <Form.Item
//             name={["reminder", "message"]}
//             label="Write your message here..."
//             //   tooltip="This is a required field"
//             initialValue={formData?.reminder.message}
//             rules={[
//               {
//                 required: true,
//                 message: "Please, provide your message!",
//               },
//             ]}>
//             <TextArea rows={5} placeholder="Your text here..." />
//           </Form.Item>

//           <Form.Item>
//             <Button onClick={onSubmit} type="default" htmlType="submit">
//               Submit
//             </Button>
//           </Form.Item>
//         </Card>
//       </Form>

//     </section>
//   );
// };

// export default TaskReminder;
