import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import Input from "../components/Inputs";
import { Button, Modal } from "antd";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";

const TaskResponseForm = ({ taskId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    comment: "",
    doc: null,
    completed: false,
  });

  const { open, showModal, handleCancel } = useModal();

  const { dataFetcher, loading, data, error: dataError } = useDataFetch();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("comment", formData.comment);
    payload.append("doc", formData.doc);
    payload.append("completed", formData.completed);

    try {
      const response = await dataFetcher(
        `tasks/${taskId}/response`,
        "post",
        payload
      );
      console.log("API Response:", response);

      if (response && response.message === "success") {
        toast.success("Document uploaded successfully!");
        console.log("Task response data:", response);

        // Prepare email data
        const emailData = {
          subject: "Task Response Submitted - A.T. Lukman & Co.",
          send_to: response.assignedBy?.email,
          send_from: user?.data?.email,
          reply_to: "noreply@gmail.com",
          template: "taskResponse",
          context: {
            recipient: response.assignedBy?.firstName,
            position: response.assignedBy?.position,
            comment: formData.comment,
            completed: formData.completed,
            url: "dashboard/tasks",
          },
        };

        console.log("Email data:", emailData);

        // Send email if emailData is provided
        try {
          const emailResult = await dispatch(
            sendAutomatedCustomEmail(emailData)
          );
          console.log("Email dispatch result:", emailResult);
          if (emailResult.payload && emailResult.payload.success) {
            toast.success("Email sent successfully!");
          } else {
            console.error("Email sending failed:", emailResult);
            toast.error("Failed to send email. Please try again.");
          }
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          toast.error("Error sending email. Please try again.");
        }

        handleCancel(); // Close the modal on successful upload
      } else {
        console.error("Unexpected API response:", response);
        toast.error("Unexpected response from server. Please try again.");
      }
    } catch (err) {
      console.error("Error uploading document:", err);
      toast.error("Failed to upload document. Please try again.");
    }
  };

  if (dataError) {
    console.error("Data fetch error:", dataError);
    toast.error(`Error: ${dataError}`);
    return null;
  }

  console.log("DATA", data);
  return (
    <>
      <Button
        onClick={showModal}
        className="bg-blue-500 hover:bg-blue-600 text-white">
        Send Task Response
      </Button>
      <Modal
        title="Task Report Form"
        open={open}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleSubmit}>
            Submit
          </Button>,
        ]}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center items-center space-y-4">
          {/* Form fields remain the same */}
        </form>
      </Modal>
    </>
  );
};

export default TaskResponseForm;
