// import { useContext } from "react";
import Input from "../components/Inputs";
import Button from "../components/Button";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useState } from "react";

import "react-toastify/dist/ReactToastify.css";

const Document = () => {
  // const { fileData, loadingFile, fileError, fetchFile } = useFile();
  const { data, loading, error, dataFetcher } = useDataFetch();
  const [click, setClick] = useState(false);
  const [docData, setDocData] = useState({ fileName: "", file: null });

  const { files, loadingFiles, errorFiles } = useDataGetterHook();


  // console.log("FILESS", files);
  // const fileId = files?.data?._id;

  function handleFileChange(e) {
    const { name, value, files } = e.target;
    setDocData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value,
    }));
  }
  console.log(docData);

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  // async function handleSubmit(e) {
  //   e.preventDefault();

  //   // set custom headers for file upload
  //   // if (file === null) {
  //   //   return;
  //   // }

  //   try {
  //     // Call fetchData with endpoint, method, payload, and any additional arguments
  //     await dataFetcher("documents", "post", docData, fileHeaders);

  //     // await fetchFile("documents", "get");
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await dataFetcher("documents", "post", docData, fileHeaders);

      // Optimistic UI Update
      setDocData({ ...files, data: [...files.data, docData] }); // Add new doc to UI

      // Clear form data or reset state for new uploads
    } catch (err) {
      console.error("Error creating document:", err);
      // Display error message to user (optional)
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  const handleDelete = async (id) => {
    try {
      await dataFetcher(`documents/${id}`, "delete", fileHeaders);

      // Optimistic UI Update
      const updatedFiles = files.data.filter((doc) => doc._id !== id);
      setDocData({ ...files, data: updatedFiles });
    } catch (err) {
      console.error("Error deleting document:", err);
      // Revert UI changes and display error message (optional)
    }
  };

  // const handleDelete = async (id) => {
  //   await dataFetcher(`documents/${id}`, "delete", fileHeaders);

  //   // await fetchFile("documents", "get");
  // };
  return (
    <section>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center ">
        <div>
          <Input
            type="text"
            name="fileName"
            onChange={handleFileChange}
            label="Document's Name"
          />

          <Input
            type="file"
            name="file" // Use 'file' to match Multer configuration
            id=""
            accept=".pdf,.docx,.jpg,.jpeg, .png"
            onChange={handleFileChange}
            label="upload file"
            htmlFor="file"
          />
        </div>
        <div>
          <Button onClick={handleClick} type="submit">
            upload file
          </Button>
        </div>
        {/* <div>
          <span>Delete Current Image</span>
          <button
            className="bg-red-700 font-bold text-white p-4"
            // onClick={handleDelete}
            type="submit">
            X
          </button>
        </div> */}
      </form>

      <div>
        <h1>Documents</h1>
        {files?.data?.map((doc) => {
          console.log(doc._id);
          return (
            <div key={doc._id}>
              <button onClick={() => handleDelete(doc?._id)}>
                <h1>{doc?.fileName}</h1>
                <p>{doc?.file}</p>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Document;
