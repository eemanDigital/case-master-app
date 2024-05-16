import { formatDate } from "../utils/formatDate";
import { FaFileAlt } from "react-icons/fa";
import { FaDeleteLeft, FaDownload } from "react-icons/fa6";
import { download } from "../utils/download";

import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDataFetch } from "../hooks/useDataFetch";

import { useState } from "react";

const DocumentsList = () => {
  const { files } = useDataGetterHook();
  const { dataFetcher } = useDataFetch();
  const [documentList, setDocumentList] = useState();

  // delete handler

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  // async function deleteFile(id) {
  //   setDocumentList((prevDocuments) =>
  //     prevDocuments?.filter((item) => item._id !== id)
  //   );

  //   try {
  //     await dataFetcher(`documents/${id}`, "delete", fileHeaders);
  //   } catch (err) {
  //     console.error("Error deleting document:", err);
  //     // Revert local state to previous state
  //     setDocumentList(files.data);
  //   }
  // }

  const fileDoc =
    files.data &&
    files.data.map((doc) => {
      // console.log(doc._id);
      return (
        <div key={doc._id} className="pt-4">
          <h3 className=" font-bold">{doc.fileName}</h3>
          <FaDeleteLeft onClick={() => deleteFile(doc._id)} />
          <div className="inline-flex gap-1 items-center bg-gray-300 px-5 py-2 rounded-md  cursor-pointer hover:bg-gray-200">
            <FaFileAlt className="text-4xl text-gray-600" />

            <FaDownload
              onClick={() => download(doc._id, doc.fileName)}
              className="text-red-800 text-1xl"
            />
          </div>
          <small className="block ">Uploaded on: {formatDate(doc.date)}</small>
        </div>
      );
    });

  async function deleteFile(id) {
    // Optimistically update the UI by filtering out the deleted file // not functioning yet

    setDocumentList(files.data?.filter((item) => item._id !== id));
    try {
      // Make the API call to delete the file
      await dataFetcher(`documents/${id}`, "delete", fileHeaders);
    } catch (err) {
      console.error("Error deleting document:", err);
      // If an error occurs during deletion, revert the UI changes
      // You can choose to handle this differently, such as displaying an error message
      setTimeout(() => {
        setDocumentList(files.data); // Revert to the original data
      }, 0);
    }
  }

  return (
    <div className="flex justify-between items-center flex-wrap">
      {files.data?.length > 0 ? (
        fileDoc
      ) : (
        <h1 className=" font-bold text-3xl  text-red-600 mt-5">
          You have no Document left
        </h1>
      )}
    </div>
  );
};

export default DocumentsList;
