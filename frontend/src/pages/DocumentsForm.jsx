import { useState } from "react";
import { Modal } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import DocumentsList from "../components/DocumentsList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { toast } from "react-toastify";
import ButtonWithIcon from "../components/ButtonWithIcon";
import { FaUpload } from "react-icons/fa";
import GoBackButton from "../components/GoBackButton";

const DocumentForm = () => {
  const [formData, setFormData] = useState({
    fileName: "",
    file: null,
  }); // form data state

  const [isModalVisible, setIsModalVisible] = useState(false);
  const { fetchData } = useDataGetterHook();
  const { dataFetcher } = useDataFetch();

  // handle file change
  const handleFileChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value,
    }));
  };

  // file headers for file upload
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("fileName", formData.fileName);
    payload.append("file", formData.file);

    try {
      const response = await dataFetcher(
        `documents`,
        "post",
        payload,
        fileHeaders
      );
      await fetchData("documents", "documents");
      if (response?.message === "success") {
        toast.success("Document uploaded successfully!");
      }
      setIsModalVisible(false);
    } catch (err) {
      console.log(err);
      toast.error("Failed to upload document. Please try again.");
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div className=" container mx-auto xl:px-5 md:px-4 sm:px-0  ">
      <GoBackButton />
      <ButtonWithIcon
        icon={<FaUpload />}
        onClick={showModal}
        text="Upload Document"
      />

      <Modal
        title="Upload Document"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}>
        <div className="max-w-md mx-auto bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="fileName"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  File Name
                </label>
                <input
                  required
                  type="text"
                  id="fileName"
                  placeholder="Enter file name"
                  name="fileName"
                  value={formData.fileName}
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>
              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true">
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload a file</span>
                        <input
                          id="file"
                          name="file"
                          type="file"
                          accept=".pdf,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOCX, JPG, JPEG, PNG up to 10MB
                    </p>
                  </div>
                </div>
                {formData.file && (
                  <p className="mt-2 text-sm text-gray-500">
                    {formData.file.name}
                  </p>
                )}
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white blue-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
      <DocumentsList />
    </div>
  );
};

export default DocumentForm;
