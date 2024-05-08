// import { useContext } from "react";
import Input from "./Inputs";
import Select from "./Select";
import Button from "./Button";
import { useAuth } from "../hooks/useAuth";
import { useFile } from "../hooks/useFile";
import { useFileContext } from "../hooks/useFileContext";
import { useState, useEffect } from "react";

import "react-toastify/dist/ReactToastify.css";

const UpdateProfilePicture = () => {
  const { fileData, loadingFile, fileError, fetchFile } = useFile();
  const [click, setClick] = useState(false);
  const [fileValue, setFileValue] = useState({ file: null });
  // const [getFile, setGetFile] = useState();

  const { file } = useFileContext();
  const fileId = file?.data?._id;
  // console.log(fileId);
  // handles file change
  function handleFileChange(e) {
    // const { name, value, files } = e.target;

    setFileValue((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.files[0], // Handle file or text input
    }));
  }
  console.log(fileValue);

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // set custom headers for file upload
    // if (file === null) {
    //   return;
    // }

    try {
      // Call fetchData with endpoint, method, payload, and any additional arguments

      await fetchFile("uploads", "post", fileValue, fileHeaders);

      // await fetchFile(
      //   `uploads/update/${fileId}`,
      //   "PATCH",
      //   fileValue,
      //   fileHeaders
      // );
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  const handleDelete = async () => {
    await fetchFile(`uploads/${fileId}`, "delete", fileHeaders);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center ">
      <div>
        <Input
          type="file"
          name="file" // Use 'file' to match Multer configuration
          id=""
          accept=".pdf,.docx,.jpg,.jpeg, .png"
          onChange={handleFileChange}
          label="upload photo"
          htmlFor="file"
        />
      </div>
      <div>
        <Button onClick={handleClick} type="submit">
          upload
        </Button>
      </div>
      <div>
        <span>Delete Current Image</span>
        <button
          className="bg-red-700 font-bold text-white p-4"
          onClick={handleDelete}
          type="submit">
          X
        </button>
      </div>
    </form>
  );
};

export default UpdateProfilePicture;
