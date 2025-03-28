import PropTypes from "prop-types";
import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Modal, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

import useModal from "../hooks/useModal";
import { toast } from "react-toastify";

const CaseDocumentUpload = ({ caseId }) => {
  const [formData, setFormData] = useState({
    fileName: "",
    file: null,
  });

  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal(); // modal hook
  const {
    dataFetcher,
    data: docData,
    loading,
    error: docError,
  } = useDataFetch();

  const handleFileChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value, // Handle file or text input
    }));
  };

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("fileName", formData.fileName);
    payload.append("file", formData.file);

    await dataFetcher(
      `cases/${caseId}/documents`,
      "post",
      payload,
      fileHeaders
    );
    // success toast
    if (!docError) {
      toast.success("Document uploaded successfully!");
      handleCancel(); // Close the modal on successful upload
      window.location.reload();
    }

    // error toast
    if (docError) {
      toast.error(docError || "Failed to upload document. Please try again.");
    }
  };

  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white w-28 ">
        Upload File
      </Button>
      <Modal
        title="Upload File"
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        footer={null} // Remove default footer buttons
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="fileName"
              className="block text-sm font-medium text-gray-700">
              File Name
            </label>
            <input
              required
              type="text"
              placeholder="Enter file name"
              value={formData.fileName}
              name="fileName"
              onChange={handleFileChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label
              htmlFor="file"
              className="block text-sm font-medium text-gray-700">
              Upload Document
            </label>
            <div className="flex items-center mt-1">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                <UploadOutlined className="mr-2" />
                <span>Select File</span>
                <input
                  required
                  type="file"
                  name="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {formData.file && (
                <p className="ml-4 text-sm text-gray-500">
                  {formData.file.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white hover:bg-blue-600 p-2 rounded-md ">
              {loading ? "uploading file..." : "Upload Document"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

CaseDocumentUpload.PropTypes = {
  caseId: PropTypes.string.isRequired,
};
export default CaseDocumentUpload;
