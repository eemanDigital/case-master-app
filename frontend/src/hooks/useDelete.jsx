import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_BASE_URL;

const useDelete = (docData, storageName) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (docData) {
      localStorage.setItem(storageName, JSON.stringify(docData));
      setDocuments(docData);
    }
  }, [docData, storageName]);

  const handleDeleteDocument = async (event, url, documentId) => {
    event.preventDefault();
    const updatedDocuments = documents.filter((doc) => doc._id !== documentId);
    setDocuments(updatedDocuments);

    try {
      await axios.delete(`${baseURL}/${url}`);
      toast.success("Delete Successful");
    } catch (err) {
      setDocuments((prevDocs) => [
        ...prevDocs,
        documents.find((doc) => doc._id === documentId),
      ]);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "There was an error deleting the document.";
      toast.error(errorMessage);
      console.error(err);
    }
  };

  return { handleDeleteDocument, documents, setDocuments };
};

export default useDelete;
