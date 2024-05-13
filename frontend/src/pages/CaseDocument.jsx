import { useState } from "react";
import { useParams } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import Input from "../components/Inputs";
import Button from "../components/Button";

const CaseDocument = () => {
  const { id } = useParams();
  const { dataFetcher } = useDataFetch();
  const { files, loadingFiles, errorFiles } = useDataGetterHook();

  const [docData, setDocData] = useState({
    docName: "",
    file: null,
  });

  // const [click, setClick] = useState(false);

  function handleFileChange(e) {
    const { name, value, files } = e.target;
    setDocData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value,
    }));
  }

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await dataFetcher(`cases/${id}`, "patch", docData, fileHeaders);
      // Optimistic UI Update
      setDocData({ docName: "", file: null });
      // Add new doc to UI
      // Clear form data or reset state for new uploads
    } catch (err) {
      console.error("Error creating document:", err);
      // Display error message to user (optional)
    }
  }

  // function handleClick() {
  //   setClick((prev) => !prev);
  // }

  const handleDelete = async (id) => {
    try {
      await dataFetcher(`cases/${id}`, "delete", fileHeaders);
      // Optimistic UI Update
      files.data.filter((doc) => doc._id !== id);
      // Set state directly to update UI
    } catch (err) {
      console.error("Error deleting document:", err);
      // Revert UI changes and display error message (optional)
    }
  };

  console.log(docData);

  return (
    <section>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center ">
        <div>
          <Input
            type="text"
            name="docName"
            onChange={handleFileChange}
            label="Document's Name"
            value={docData.docName}
          />
          <Input
            type="file"
            name={docData.file}
            // Use 'file' to match Multer configuration
            id=""
            accept=".pdf,.docx,.jpg,.jpeg, .png"
            onChange={handleFileChange}
            label="upload file"
            htmlFor="file"
          />
        </div>
        <div>
          <Button type="submit">upload file</Button>
        </div>
        {/* <div>
          <span>Delete Current Image</span>
          <button
            className="bg-red-700 font-bold text-white p-4"
            // onClick={handleDelete}
            type="submit"
          >
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

export default CaseDocument;
