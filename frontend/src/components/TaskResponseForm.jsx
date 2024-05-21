// import { useState } from "react";
// import { useDataFetch } from "../hooks/useDataFetch";
// import Input from "../components/Inputs";
// // import Button from "../components/Button";
// import { Button, Modal } from "antd";

// const TaskReminder = ({ taskId }) => {
//   const [formData, setFormData] = useState({
//     comment: "",
//     file: "",
//     completed: null,
//   });

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const showModal = () => {
//     setIsModalOpen(true);
//   };
//   const handleOk = () => {
//     setIsModalOpen(false);
//   };
//   const handleCancel = () => {
//     setIsModalOpen(false);
//   };

//   const [click, setClick] = useState(false);
//   // handle reports post and get report data
//   const { dataFetcher, data, loading, error } = useDataFetch();

//   function handleChange(e) {
//     const { name, value, files, checked } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: name === "file" ? files : name === "completed" ? checked : value,
//     }));
//   }

//   console.log(formData, taskId);

//   const fileHeaders = {
//     "Content-Type": "multipart/form-data",
//   };

//   async function handleSubmit(e) {
//     e.preventDefault();

//     try {
//       // Call fetchData with endpoint, method, payload, and any additional arguments
//       await dataFetcher(
//         `tasks/${taskId}/response`,
//         "POST",
//         formData,
//         fileHeaders
//       );
//     } catch (err) {
//       console.log(err);
//     }
//   }

//   function handleClick() {
//     setClick(() => !click);
//   }
//   return (
//     <>
//       <Button
//         onClick={showModal}
//         noStyle
//         className="bg-green-500 hover:bg-green-600">
//         Send Task Response/Report
//       </Button>
//       <Modal
//         title="Task Report Form"
//         open={isModalOpen}
//         onOk={handleOk}
//         onCancel={handleCancel}>
//         <form
//           onSubmit={handleSubmit}
//           className="flex flex-col justify-center items-center ">
//           <div>
//             <Input
//               type="file"
//               name="file" //
//               id=""
//               accept=".pdf,.docx,.jpg,.jpeg, .png"
//               // accept=".jpg,.jpeg, .png"
//               onChange={handleChange}
//               label="upload document"
//               htmlFor="file"
//             />
//           </div>
//           <div>
//             <p>
//               <label htmlFor="completed">
//                 Task Completed
//                 <input
//                   onChange={handleChange}
//                   type="checkbox"
//                   checked={formData.completed}
//                   name="completed"
//                   id=""
//                 />
//               </label>
//             </p>
//           </div>

//           <div>
//             <Input
//               className="w-[400px]"
//               textarea
//               placeholder="Your comment here..."
//               value={formData.comment}
//               name="comment"
//               onChange={handleChange}
//             />
//           </div>

//           <div>
//             <button onClick={handleClick} type="submit">
//               Submit
//             </button>
//             {/* <Button type="submit">Submit</Button> */}
//           </div>
//         </form>
//       </Modal>
//     </>
//   );
// };
// export default TaskReminder;

// // const TaskReminder = () => {
// //   // destructure textarea from input
// //   const { TextArea } = Input;

// //   const [form] = Form.useForm();
// //   const [formData, setFormData] = useState({
// //     reminder: {
// //       message: "",
// //     },
// //   });
// //   // destructor authenticate from useAuth
// //   const { dataFetcher, data, loading, error  } = useDataFetch();

// //   // form submit functionalities
// //   const handleSubmission = useCallback(
// //     (result) => {
// //       if (result?.error) {
// //         // Handle Error here
// //       } else {
// //         // Handle Success here
// //         // form.resetFields();
// //       }
// //     },
// //     []
// //     // [form]
// //   );

// //   // submit data
// //   const onSubmit = useCallback(async () => {
// //     let values;
// //     try {
// //       values = await form.validateFields(); // Validate the form fields
// //     } catch (errorInfo) {
// //       return;
// //     }
// //     const result = await dataFetcher("tasks/", "POST", values); // Submit the form data to the backend
// //     console.log(values);
// //     handleSubmission(result); // Handle the submission after the API Call
// //   }, [form, handleSubmission, dataFetcher]);

// //   return (
// //     <section className="flex justify-between gap-8 ">
// //       <Form
// //         layout="vertical"
// //         form={form}
// //         name="dynamic_form_complex"
// //         // autoComplete="off"
// //         className="flex  justify-center">
// //         <Card
// //           title="Add Task"
// //           bordered={false}
// //           style={{ width: 400, height: 850 }}>
// //           <div>
// //             {/* task title */}
// //             <Form.Item
// //               label="Task Title"
// //               name="title"
// //               initialValue={formData?.title}>
// //               <Input />
// //             </Form.Item>
// //           </div>

// //           {/* instruction */}
// //           <Form.Item
// //             name={["reminder", "message"]}
// //             label="Write your message here..."
// //             //   tooltip="This is a required field"
// //             initialValue={formData?.reminder.message}
// //             rules={[
// //               {
// //                 required: true,
// //                 message: "Please, provide your message!",
// //               },
// //             ]}>
// //             <TextArea rows={5} placeholder="Your text here..." />
// //           </Form.Item>

// //           <Form.Item>
// //             <Button onClick={onSubmit} type="default" htmlType="submit">
// //               Submit
// //             </Button>
// //           </Form.Item>
// //         </Card>
// //       </Form>

// //     </section>
// //   );
// // };

// // export default TaskReminder;

import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import Input from "../components/Inputs";
import { Button, Modal } from "antd";

const TaskReminder = ({ taskId }) => {
  const [formData, setFormData] = useState({
    comment: "",
    doc: null,
    completed: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const { dataFetcher } = useDataFetch();

  function handleChange(e) {
    const { name, value, files, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "doc" ? files[0] : name === "completed" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formPayload = new FormData();
    formPayload.append("comment", formData.comment);
    formPayload.append("doc", formData.doc);
    formPayload.append("completed", formData.completed);

    try {
      await dataFetcher(`tasks/${taskId}/response`, "POST", formPayload);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <Button onClick={showModal} className="bg-green-500 hover:bg-green-600">
        Send Task Response/Report
      </Button>
      <Modal
        title="Task Report Form"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center items-center">
          <div>
            <Input
              type="file"
              name="doc"
              id=""
              accept=".pdf,.docx,.jpg,.jpeg, .png"
              onChange={handleChange}
              label="Upload Document"
              htmlFor="doc"
            />
          </div>
          <div>
            <label htmlFor="completed">
              Task Completed
              <input
                onChange={handleChange}
                type="checkbox"
                checked={formData.completed}
                name="completed"
                id=""
              />
            </label>
          </div>
          <div>
            <Input
              className="w-[400px]"
              textarea
              placeholder="Your comment here..."
              value={formData.comment}
              name="comment"
              onChange={handleChange}
            />
          </div>
          <div>
            <button type="submit">Submit</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default TaskReminder;
