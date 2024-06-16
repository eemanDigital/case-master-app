import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import Input from "../components/Inputs";
import { Button, Modal, message } from "antd";

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
            <input
              type="file"
              id=""
              name="doc"
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
