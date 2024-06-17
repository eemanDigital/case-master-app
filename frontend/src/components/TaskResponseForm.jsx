import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import Input from "../components/Inputs";
import { Button, Modal, message } from "antd";
import useModal from "../hooks/useModal";
// import "antd/dist/antd.css"; // Ensure Ant Design styles are imported

const TaskResponseForm = ({ taskId }) => {
  const [formData, setFormData] = useState({
    comment: "",
    doc: null,
    completed: false,
  });

  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { dataFetcher, loading, data, error } = useDataFetch();

  function handleChange(e) {
    const { name, value, files, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "doc" ? files[0] : name === "completed" ? checked : value,
    }));
  }

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("comment", formData.comment);
    payload.append("doc", formData.doc);
    payload.append("completed", formData.completed);

    try {
      await dataFetcher(
        `tasks/${taskId}/response`,
        "post",
        payload,
        fileHeaders
      );
      message.success("Document uploaded successfully!");
      handleCancel(); // Close the modal on successful upload
    } catch (err) {
      console.log(err);
      message.error("Failed to upload document. Please try again.");
    }
  };

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
          <div className="w-full">
            {/* <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              Submit
            </button> */}
          </div>
        </form>
      </Modal>
    </>
  );
};

export default TaskResponseForm;
