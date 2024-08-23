import PropTypes from "prop-types";
import { RiDeleteBin2Line } from "react-icons/ri";
import { FaDownload } from "react-icons/fa";
import { Modal, Button } from "antd"; // Assuming you're using Ant Design

const TaskAttachmentsCard = ({
  documents,
  task,
  baseURL,
  handleDeleteDocument,
  handleGeneralDownload,
}) => {
  return (
    <div className="rounded-lg mb-8 mt-3">
      <h2 className="text-xl font-semibold mb-4">Task Attachments</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((document) => (
          <div
            key={document._id}
            className="relative shadow-md bg-gray-200 p-2 rounded-md flex flex-col items-center">
            <button
              className="absolute top-1 right-1 text-red-700 hover:text-red-500"
              onClick={(event) =>
                Modal.confirm({
                  title: "Are you sure you want to delete this document?",
                  onOk: () =>
                    handleDeleteDocument(
                      event,
                      `tasks/${task._id}/documents/${document._id}`,
                      document._id
                    ),
                })
              }>
              <RiDeleteBin2Line className="text-sm" />
            </button>
            <p className="text-xs font-medium truncate w-full mb-2 text-gray-800">
              {document?.fileName}
            </p>
            <Button
              className="mt-auto bg-blue-500 text-white"
              icon={<FaDownload />}
              onClick={(event) =>
                handleGeneralDownload(
                  event,
                  `${baseURL}/tasks/${task._id}/documents/${document._id}/download`,
                  document.fileName
                )
              }>
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

TaskAttachmentsCard.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      fileName: PropTypes.string.isRequired,
    })
  ).isRequired,
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
  baseURL: PropTypes.string.isRequired,
  handleDeleteDocument: PropTypes.func.isRequired,
  handleGeneralDownload: PropTypes.func.isRequired,
};

export default TaskAttachmentsCard;
