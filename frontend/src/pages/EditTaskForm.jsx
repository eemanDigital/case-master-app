// import { useCallback, useEffect } from "react";
// import { useDataFetch } from "../hooks/useDataFetch";
// import { taskPriorityOptions } from "./../data/options";
// import {
//   Button,
//   Input,
//   Form,
//   Select,
//   DatePicker,
//   Typography,
//   Card,
// } from "antd";
// import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
// import useUserSelectOptions from "../hooks/useUserSelectOptions";
// import { SelectInputs } from "../components/DynamicInputs";
// import useClientSelectOptions from "../hooks/useClientSelectOptions";
// import { useDataGetterHook } from "../hooks/useDataGetterHook";
// import { useDispatch, useSelector } from "react-redux";
// import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
// import { getUsers } from "../redux/features/auth/authSlice";
// import { formatDate } from "../utils/formatDate";
// import { toast } from "react-toastify";

// import moment from "moment";
// import GoBackButton from "../components/GoBackButton";
// import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
// import { useParams } from "react-router-dom";

// const { TextArea } = Input;
// const { Title } = Typography;

// const EditTaskForm = () => {
//   const { casesOptions } = useCaseSelectOptions();
//   const { userData } = useUserSelectOptions();
//   const { clientOptions } = useClientSelectOptions();
//   const { fetchData } = useDataGetterHook();
//   const dispatch = useDispatch();
//   const { users, user } = useSelector((state) => state.auth);
//   const { emailSent, msg } = useSelector((state) => state.email);
//   const { id } = useParams();

//   const [form] = Form.useForm();
//   const {
//     dataFetcher,
//     loading: loadingData,
//     error: dataError,
//   } = useDataFetch();

//   const { formData, loading } = useInitialDataFetcher("tasks", id); // Initial data fetcher

//   // Set initial form values when formData is available
//   useEffect(() => {
//     if (formData) {
//       form.setFieldsValue({
//         ...formData,
//         dueDate: formData.dueDate ? moment(formData.dueDate) : null,
//         caseToWorkOn: formData.caseToWorkOn
//           ? formData.caseToWorkOn.map((taskCase) => taskCase._id)
//           : [],
//       });
//     }
//   }, [formData, form]);

//   // Handle form submission
//   const handleSubmission = useCallback(
//     (result) => {
//       if (result?.error) {
//         // Handle Error here
//       } else {
//         // Handle Success here
//         form.resetFields();
//       }
//     },
//     [form]
//   );

//   // Fetch users
//   useEffect(() => {
//     dispatch(getUsers());
//   }, [dispatch]);

//   // Handle form submission
//   const handleSubmit = useCallback(
//     async (values) => {
//       try {
//         // Debugging: Log values
//         console.log("Form Values:", values);

//         // Extract user IDs from values.assignedTo
//         const assignedUserIds = values.assignedTo || []; // Ensure it's an array

//         // Find corresponding user objects from the users state
//         const assignedUsers = users?.data?.filter((user) =>
//           assignedUserIds.includes(user._id)
//         );

//         // Map user objects to their email addresses
//         const sendToEmails = assignedUsers?.map((user) => user.email);
//         // Prepare email data
//         const emailData = {
//           subject: "Task Updated - A.T. Lukman & Co.",
//           send_to: sendToEmails,
//           send_from: user?.data?.email,
//           reply_to: "noreply@gmail.com",
//           template: "taskUpdate",
//           url: "dashboard/tasks",
//           context: {
//             sendersName: user?.data?.firstName,
//             sendersPosition: user?.data?.position,
//             title: values.title,
//             dueDate: formatDate(values.dueDate),
//             instruction: values.instruction,
//             taskPriority: values.taskPriority,
//           },
//         };

//         // Update data
//         const result = await dataFetcher(`tasks/${id}`, "patch", values);
//         await fetchData("tasks", "tasks");
//         handleSubmission(result);

//         // Send email if emailData is provided
//         if (!result?.error && emailData) {
//           await dispatch(sendAutomatedCustomEmail(emailData));
//         }
//         form.resetFields();
//       } catch (err) {
//         console.error(err);
//       }
//     },
//     [dataFetcher, fetchData, form, handleSubmission, user, users, dispatch, id]
//   );

//   // Form submission
//   const onSubmit = useCallback(async () => {
//     let values;
//     try {
//       values = await form.validateFields();
//     } catch (errorInfo) {
//       return;
//     }
//     await handleSubmit(values);
//   }, [form, handleSubmit]);

//   // Email success
//   useEffect(() => {
//     if (emailSent) {
//       toast.success(msg);
//     }
//   }, [emailSent, msg]);

//   // DataFetcher error
//   useEffect(() => {
//     if (dataError) {
//       toast.error(dataError || "An error occurred");
//     }
//   }, [dataError]);

//   return (
//     <>
//       <GoBackButton />
//       <Card
//         width="80%"
//         title={<Title level={3}>Edit Task</Title>}
//         className="modal-container">
//         <Form
//           layout="vertical"
//           form={form}
//           name="edit_task_form"
//           className="flex flex-col gap-6"
//           initialValues={{
//             title: formData?.title,
//             instruction: formData?.instruction,
//             caseToWorkOn: formData?.caseToWorkOn,
//             assignedTo: formData?.assignedTo,
//             assignedToClient: formData?.assignedToClient,
//             dueDate: formData?.dueDate ? moment(formData.dueDate) : null,
//             taskPriority: formData?.taskPriority || "high",
//           }}>
//           <Form.Item
//             label="Task Title"
//             name="title"
//             rules={[
//               {
//                 required: true,
//                 message: "Please provide title for the task!",
//               },
//             ]}>
//             <Input placeholder="Enter task title" />
//           </Form.Item>
//           <Form.Item
//             name="instruction"
//             label="Instruction"
//             rules={[
//               {
//                 required: true,
//                 message: "Please provide instructions for the task!",
//               },
//             ]}>
//             <TextArea rows={4} placeholder="Enter detailed instructions" />
//           </Form.Item>
//           <Form.Item name="caseToWorkOn" label="Case To Work On">
//             <Select
//               placeholder="Select a case"
//               options={casesOptions}
//               allowClear
//               className="w-full"
//             />
//           </Form.Item>
//           <div className="flex w-full justify-center items-center space-x-4">
//             <div className="flex-1">
//               <Form.Item
//                 name="assignedTo"
//                 label="Staff"
//                 dependencies={["assignedToClient"]}
//                 rules={[
//                   ({ getFieldValue }) => ({
//                     validator(_, value) {
//                       if (value || getFieldValue("assignedToClient")) {
//                         return Promise.resolve();
//                       }
//                       return Promise.reject(
//                         new Error(
//                           'Task must be assigned to "Staff" or "Client".'
//                         )
//                       );
//                     },
//                   }),
//                 ]}>
//                 <Select
//                   mode="multiple"
//                   placeholder="Select staff members"
//                   options={userData}
//                   allowClear
//                   className="w-full"
//                 />
//               </Form.Item>
//             </div>

//             <div className="flex-1">
//               <Form.Item
//                 name="assignedToClient"
//                 label="Client"
//                 dependencies={["assignedTo"]}
//                 rules={[
//                   ({ getFieldValue }) => ({
//                     validator(_, value) {
//                       if (value || getFieldValue("assignedTo")) {
//                         return Promise.resolve();
//                       }
//                       return Promise.reject(
//                         new Error(
//                           'Task must be assigned to "Staff" or "Client".'
//                         )
//                       );
//                     },
//                   }),
//                 ]}>
//                 <Select
//                   placeholder="Select a client"
//                   options={clientOptions}
//                   allowClear
//                   className="w-full"
//                 />
//               </Form.Item>
//             </div>
//           </div>
//           <Form.Item
//             name="dueDate"
//             label="Due Date"
//             rules={[
//               {
//                 required: true,
//                 message: "Specify the due date for the task",
//               },
//               ({ getFieldValue }) => ({
//                 validator(_, value) {
//                   const assignedDate = getFieldValue("assignedDate");
//                   if (!value || !assignedDate || value.isAfter(assignedDate)) {
//                     return Promise.resolve();
//                   }
//                   return Promise.reject(
//                     new Error("Due date must be after the assigned date.")
//                   );
//                 },
//               }),
//             ]}>
//             <DatePicker className="w-full" />
//           </Form.Item>
//           <SelectInputs
//             defaultValue="high"
//             fieldName="taskPriority"
//             label="Task Priority"
//             rules={[
//               {
//                 required: true,
//                 message: "Specify task priority",
//               },
//             ]}
//             options={taskPriorityOptions}
//           />
//           <Form.Item>
//             <Button
//               onClick={onSubmit}
//               loading={loadingData}
//               htmlType="submit"
//               className="w-full blue-btn">
//               Save
//             </Button>
//           </Form.Item>
//         </Form>
//       </Card>
//     </>
//   );
// };

// export default EditTaskForm;
