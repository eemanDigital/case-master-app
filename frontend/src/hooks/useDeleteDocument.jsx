import { useState, useEffect } from "react";
import axios from "axios";
import { notification } from "antd";

const baseURL = import.meta.env.VITE_BASE_URL;

const useDeleteDocument = (docData, storageName) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (docData) {
      // Handle both direct documents array and nested documents
      const docs = Array.isArray(docData) ? docData : docData?.documents || [];

      localStorage.setItem(storageName, JSON.stringify(docs));
      setDocuments(docs);
    }
  }, [docData, storageName]);

  // Retrieve token from browser cookies
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const fileHeaders = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  };

  const handleDeleteDocument = async (event, url, documentId) => {
    event.preventDefault();
    // Optimistically update the state
    const updatedDocuments = documents.filter((doc) => doc._id !== documentId);
    setDocuments(updatedDocuments);

    try {
      await axios.delete(`${baseURL}/${url}`, fileHeaders);
      notification.success({
        message: "Delete Successful",
        description: "The document was deleted successfully.",
      });
    } catch (err) {
      // Revert the state if the API call fails
      setDocuments((prevDocs) => [
        ...prevDocs,
        documents.find((doc) => doc._id === documentId),
      ]);
      notification.error({
        message: "Delete Failed",
        description: "There was an error deleting the document.",
      });
      console.error(err);
    }
  };

  return { handleDeleteDocument, documents, setDocuments };
};

export default useDeleteDocument;

// hooks/useDeleteDocument.js
// import { useState, useEffect } from "react";
// import axios from "axios";
// import { notification } from "antd";

// const baseURL = import.meta.env.VITE_BASE_URL;

// const useDeleteDocument = (docData, storageName) => {
//   const [documents, setDocuments] = useState([]);

//   useEffect(() => {
//     if (docData) {
//       const docs = Array.isArray(docData) ? docData : docData?.documents || [];
//       localStorage.setItem(storageName, JSON.stringify(docs));
//       setDocuments(docs);
//     }
//   }, [docData, storageName]);

//   const token = document.cookie
//     .split("; ")
//     .find((row) => row.startsWith("jwt="))
//     ?.split("=")[1];

//   const handleDeleteDocument = async (documentId) => {
//     try {
//       // Optimistically update the state
//       const updatedDocuments = documents.filter(
//         (doc) => doc._id !== documentId
//       );
//       setDocuments(updatedDocuments);

//       await axios.delete(
//         `${baseURL}/tasks/${storageName}/documents/${documentId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       notification.success({
//         message: "Delete Successful",
//         description: "The document was deleted successfully.",
//       });

//       return true;
//     } catch (err) {
//       // Revert the state if the API call fails
//       setDocuments(documents);
//       notification.error({
//         message: "Delete Failed",
//         description:
//           err.response?.data?.message ||
//           "There was an error deleting the document.",
//       });
//       console.error(err);
//       return false;
//     }
//   };

//   return { handleDeleteDocument, documents, setDocuments };
// };

// export default useDeleteDocument;
