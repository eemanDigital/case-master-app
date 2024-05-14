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
    documents: {
      docName: " ", // Initial empty space for document name
      file: null,
    },
  });

  function handleFileChange(e) {
    const { name, value, files } = e.target;
    const updatedDocuments = {
      ...docData.documents,
      [name]: name === "file" ? files[0] : value,
    };
    setDocData((prevData) => ({ ...prevData, documents: updatedDocuments }));
  }

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("documents.docName", docData.documents.docName);
      formData.append("documents.file", docData.documents.file);

      await dataFetcher(`cases/${id}`, "patch", formData, fileHeaders);

      // Optimistic UI Update
      setDocData({ documents: { docName: "", file: null } });

      // Optional: Add new doc to UI (implement depending on your UI framework)
    } catch (err) {
      console.error("Error creating document:", err);
      // Display error message to user (optional)
    }
  }

  const handleDelete = async (id) => {
    try {
      await dataFetcher(`cases/${id}`, "delete", fileHeaders);

      // Optimistic UI Update (assuming files state is up-to-date)
      const updatedFiles = files.data.filter((doc) => doc._id !== id);

      // Update the state directly to reflect the change in UI
      // This might depend on your state management solution
      // (consider using a reducer or context for complex updates)
      // setFiles(updatedFiles); // Assuming you have a setFiles function
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
            value={docData.documents.docName}
          />
          <Input
            type="file"
            name="file"
            id="" // Consider adding an id for better accessibility
            accept=".pdf,.docx,.jpg,.jpeg, .png"
            onChange={handleFileChange}
            label="upload file"
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
        {files?.data?.map((doc) => (
          <div key={doc._id}>
            <button onClick={() => handleDelete(doc._id)}>
              <h1>{doc?.fileName}</h1>
              <p>{doc?.file}</p>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CaseDocument;
