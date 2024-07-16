import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Modal, message, Spin, Alert } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import useModal from "../hooks/useModal";

const UpdateProfilePicture = () => {
  const [formData, setFormData] = useState({ photo: null });
  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const { dataFetcher, data, loading, error } = useDataFetch();

  console.log(data, "DATA");
  console.log(error, "ERROR");

  const handleFileChange = (e) => {
    const { files } = e.target;
    setFormData({ photo: files[0] });
  };

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("photo", formData.photo);

    await dataFetcher("users/updateUser", "patch", payload, fileHeaders);

    if (data?.data?.status === "success") {
      message.success("Profile picture updated successfully!");
      handleCancel(); // Close the modal on successful upload
    }
    if (error) {
      message.error("Failed to update profile picture. Please try again.");
    }
  };

  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Upload Profile Picture
      </Button>
      <Modal
        title="Upload Profile Picture"
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        footer={null} // Remove default footer buttons
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="photo"
              className="block text-sm font-medium text-gray-700"></label>
            <div className="flex items-center mt-1">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                <UploadOutlined className="mr-2" />
                <span>Select File</span>
                <input
                  required
                  type="file"
                  name="photo"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {formData.photo && (
                <p className="ml-4 text-sm text-gray-500">
                  {formData.photo.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white hover:bg-blue-600 p-2 rounded-md">
              {!loading ? "uploading file..." : "Upload Photo"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default UpdateProfilePicture;
