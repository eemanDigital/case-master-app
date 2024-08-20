import { useState } from "react";
import { Button, Modal } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import useModal from "../hooks/useModal";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDispatch } from "react-redux";
import { getUser } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";
import avatar from "../assets/avatar.png";

const ProfilePictureUpload = () => {
  const [formData, setFormData] = useState({ photo: null });
  const [preview, setPreview] = useState(null); // State for image preview
  const dispatch = useDispatch();
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

    // check empty form upload
    if (formData.photo === null) {
      return toast.error("Please upload a photo");
    }

    // check image type
    if (
      formData.photo.type === "image/jpeg" ||
      formData.photo.type === "image/jpg" ||
      formData.photo.type === "image/png"
    ) {
      const payload = new FormData();
      payload.append("photo", formData.photo);
      await dataFetcher("users/updateUser", "patch", payload, fileHeaders);
      dispatch(getUser());
    } else {
      return toast.error("Image type is not acceptable");
    }

    if (data?.data?.message === "success") {
      return toast.success("Image Uploaded Successfully");
    }

    if (error) {
      return toast.error(error);
    }
  };

  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Upload Profile Picture
      </Button>
      <Modal
        width={450}
        // style={{ height: "400px" }}
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
            <div className="flex flex-col sm:flex-row items-center mt-1">
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
                <p className="ml-4 text-sm text-gray-500 mt-2 sm:mt-0">
                  {formData.photo.name}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 ">
            <img
              src={preview === null ? avatar : preview}
              alt="Preview"
              className="w-44 h-44 object-cover rounded-full"
            />
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className={`bg-blue-500 text-white hover:bg-blue-600 p-2 rounded-md ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}>
              {loading ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ProfilePictureUpload;
