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

  function handleChange(e) {
    const { name, value, files, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "doc" ? files[0] : name === "completed" ? checked : value,
    }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("comment", formData.comment);
    payload.append("doc", formData.doc);
    payload.append("completed", formData.completed);

    try {
      await dataFetcher(`tasks/${taskId}/response`, "post", payload);
      if (data?.message === "success") {
        toast.success("Document uploaded successfully!");

        // Prepare email data
        const emailData = {
          subject: "Task Response Submitted - A.T. Lukman & Co.",
          send_to: data?.assignedBy?.email,
          send_from: user?.data?.email,
          reply_to: "noreply@gmail.com",
          template: "taskResponse",
          context: {
            recipient: data?.assignedBy.firstName,
            position: data?.assignedBy.position,
            comment: formData.comment,
            completed: formData.completed,
            url: "dashboard/tasks",
          },
        };
        // Send email if emailData is provided
        await dispatch(sendAutomatedCustomEmail(emailData));
        toast.success("Email sent successfully!");

        handleCancel(); // Close the modal on successful upload
      } else {
        throw new Error("Failed to upload document.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload document. Please try again.");
    }
  };

  if (dataError) {
    toast.error(dataError);
    return null;
  }

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
          <div className="flex flex-col items-start w-full">
            <label htmlFor="doc" className="mb-1 font-semibold">
              Upload Document
            </label>
            <input
              type="file"
              name="doc"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex items-center w-full">
            <label htmlFor="completed" className="mr-2 font-semibold">
              Task Completed
            </label>
            <input
              type="checkbox"
              onChange={handleChange}
              checked={formData.completed}
              name="completed"
              className="w-5 h-5"
            />
          </div>
          <div className="w-full">
            <Input
              className="w-full p-2 border rounded"
              textarea
              placeholder="Your comment here..."
              value={formData.comment}
              name="comment"
              onChange={handleChange}
            />
          </div>
        </form>
      </Modal>
    </>
  );
};

export default TaskResponseForm;
