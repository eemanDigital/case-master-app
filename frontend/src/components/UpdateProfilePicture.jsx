// import { useContext } from "react";
import Input from "./Inputs";
// import Select from "./Select";
import Button from "./Button";
// import { useAuth } from "../hooks/useAuth";
import { usePhoto } from "../hooks/usePhoto";
import { usePhotoContext } from "../hooks/usePhotoContext";
import { useState } from "react";

import "react-toastify/dist/ReactToastify.css";

const UpdateProfilePicture = () => {
  const { photoData, loadingFile, fileError, fetchPhoto } = usePhoto();
  const [click, setClick] = useState(false);
  const [photoValue, setPhotoValue] = useState({ photo: null });
  // const [getFile, setGetFile] = useState();

  const { photo } = usePhotoContext();
  const fileId = photo?.data?._id;
  // console.log(fileId);
  // handles file change
  function handlePhotoChange(e) {
    // const { name, value, files } = e.target;

    setPhotoValue((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.files[0], // Handle file or text input
    }));
  }
  console.log(photoValue);

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

      await fetchPhoto("photos", "post", photoValue, fileHeaders);

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
    await fetchPhoto(`photos/${fileId}`, "delete", fileHeaders);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center ">
      <div>
        <Input
          type="file"
          name="photo" // Use 'file' to match Multer configuration
          id=""
          // accept=".pdf,.docx,.jpg,.jpeg, .png"
          accept=".jpg,.jpeg, .png"
          onChange={handlePhotoChange}
          label="upload photo"
          htmlFor="photo"
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
