import { useState, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";

import { Button, Modal } from "antd";
import { FaDownload, FaFileAlt } from "react-icons/fa";
import { download } from "../utils/download";

const TaskDocView = ({ taskId }) => {
  //   const { id } = useParams();
  const [open, setOpen] = useState(false);
  //   const [confirmLoading, setConfirmLoading] = useState(false);
  //   const [modalText, setModalText] = useState("Content of the modal");
  const showModal = () => {
    setOpen(true);
  };
  //   const handleOk = () => {
  //     setModalText("The modal will be closed after two seconds");
  //     setConfirmLoading(true);
  //     setTimeout(() => {
  //       setOpen(false);
  //       setConfirmLoading(false);
  //     }, 2000);
  //   };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };

  // destructor authenticate from useAuth
  const { dataFetcher, data, loading, error } = useDataFetch();

  //   console.log("DOCTASK", data?.data?.documents);

  const taskdoc = data?.data?.documents.map((doc) => {
    // console.log(doc);
    return (
      <div key={doc._id}>
        <h3 className=" font-bold">{doc.fileName}</h3>
        <div className="inline-flex gap-1 items-center bg-gray-300 px-5 py-2 rounded-md  cursor-pointer hover:bg-gray-200">
          <FaFileAlt className="text-4xl text-gray-600" />

          <FaDownload
            onClick={() => download(doc._id, doc.fileName)}
            className="text-red-800 text-1xl"
          />
        </div>
      </div>
    );
  });

  useEffect(() => {
    dataFetcher(`tasks/${taskId}`, "get"); // Submit the form data to the backend
  }, [taskId]);

  return (
    <>
      <Button onClick={showModal} className="bg-green-700 text-white">
        Download Attached Document
      </Button>
      <Modal
        title="Task Attached Documents"
        open={open}
        // onOk={handleOk}
        confirmLoading={loading}
        onCancel={handleCancel}>
        <section className="flex justify-center items-center gap-4  ">
          {data?.data?.documents.length > 0 ? (
            taskdoc
          ) : (
            <h2>No Attached Document</h2>
          )}
        </section>
      </Modal>
    </>
  );
};
export default TaskDocView;
