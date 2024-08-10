import { useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import Input from "../components/Inputs";
import { Button, Modal } from "antd";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { FaCheck, FaTimes } from "react-icons/fa";

const TaskResponseForm = ({ taskId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sendingEmail, emailSent, msg } = useSelector((state) => state.email);
  const [formData, setFormData] = useState({
    comment: "",
    doc: null,
    completed: false,
  });

  const { open, showModal, handleCancel } = useModal();

  const { dataFetcher, loading, error: dataError } = useDataFetch();

  function handleChange(e) {
    const { name, value, files, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "doc"
          ? files.length > 0
            ? files[0]
            : null
          : name === "completed"
          ? checked
          : value,
    }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("comment", formData.comment);
    if (formData.doc) {
      payload.append("doc", formData.doc);
    }
    payload.append("completed", formData.completed);

    try {
      const response = await dataFetcher(
        `tasks/${taskId}/response`,
        "post",
        payload
      );
      if (response?.message === "success") {
        toast.success("Task response submitted successfully!");
      }

      const emailData = {
        subject: "Task Response Submitted - A.T. Lukman & Co.",
        send_to: response?.data?.assignedBy?.email,
        send_from: user?.data?.email,
        reply_to: "noreply@atlukman.com",
        template: "taskResponse",
        url: "dashboard/tasks",

        context: {
          recipient: response?.data?.assignedBy?.firstName,
          position: response?.data?.assignedBy?.position,
          comment: formData?.comment,
          completed: formData?.completed ? <FaCheck /> : <FaTimes />,
        },
      };

      try {
        if (response?.message === "success") {
          await dispatch(sendAutomatedCustomEmail(emailData));
        }
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        toast.warning(
          "Task response submitted, but failed to send email notification."
        );
      }

      handleCancel(); // Close the modal on successful submission
    } catch (err) {
      console.error(err);
      toast.error(
        err.message || "Failed to submit task response. Please try again."
      );
    }
  };

  useEffect(() => {
    if (emailSent) {
      toast.success(msg);
    }
  }, [emailSent, msg]);

  if (dataError) {
    toast.error(dataError);
    return null;
  }

  return (
    <>
      <Button
        onClick={showModal}
        className="bg-blue-500 hover:bg-blue-600 text-white"
        disabled={sendingEmail}>
        {sendingEmail ? "Sending..." : "Send Task Response"}
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
            onClick={handleSubmit}
            disabled={sendingEmail}>
            {sendingEmail ? "Sending..." : "Submit"}
          </Button>,
        ]}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center items-center space-y-4">
          <div className="flex flex-col items-start w-full">
            <label htmlFor="doc" className="mb-1 font-semibold">
              Upload Document (optional)
            </label>
            <input
              type="file"
              name="doc"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
            {formData.doc && (
              <p className="mt-1 text-sm text-gray-500">
                File selected: {formData.doc.name}
              </p>
            )}
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
