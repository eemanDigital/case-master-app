import { useState } from "react";
import { Button, Modal, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import useModal from "../hooks/useModal";
import { useDataFetch } from "../hooks/useDataFetch";

const UpdateProfilePicture = () => {
  const [formData, setFormData] = useState({ photo: null });
  const [preview, setPreview] = useState(null); // State for image preview
  const [uploading, setUploading] = useState(false); // State to track if uploading
  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const { dataFetcher, data, loading, error } = useDataFetch();

  // Handle file selection and image preview
  const handleFileChange = (e) => {
    const { files } = e.target;
    if (files[0]) {
      setFormData({ photo: files[0] });

      // Create a preview URL for the selected image
      const file = files[0];
      const previewURL = URL.createObjectURL(file);
      setPreview(previewURL);
    }
  };

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  // Handle file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      formData.photo !== null &&
      (formData.photo.type === "image/jpeg" ||
        formData.photo.type === "image/jpg" ||
        formData.photo.type === "image/png")
    ) {
      setUploading(true); // Set uploading state

      const payload = new FormData();
      payload.append("photo", formData.photo);

      try {
        const response = await dataFetcher(
          "users/updateUser",
          "patch",
          payload,
          fileHeaders
        );
        if (response?.data?.status === "success") {
          message.success("Profile picture updated successfully!");
          handleCancel(); // Close the modal on successful upload
        } else {
          message.error("Failed to update profile picture. Please try again.");
        }
      } catch (err) {
        message.error("Failed to update profile picture. Please try again.");
      } finally {
        setUploading(false); // Reset uploading state
      }
    } else {
      message.error("Invalid file type. Please upload a JPEG or PNG image.");
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

          <div className="mt-4">
            <img
              src={preview === null ? formData.photo : preview}
              alt="Preview"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className={`bg-blue-500 text-white hover:bg-blue-600 p-2 rounded-md ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default UpdateProfilePicture;
