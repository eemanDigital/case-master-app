import { useState, useEffect } from "react";
import { formatDate } from "../utils/formatDate";
import { FaFileAlt, FaTrash, FaDownload } from "react-icons/fa";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDataFetch } from "../hooks/useDataFetch";
import { Table, Button, Popconfirm } from "antd";

import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import SearchBar from "./SearchBar";
import { toast } from "react-toastify";
import LoadingSpinner from "./LoadingSpinner";
const baseURL = import.meta.env.VITE_BASE_URL;

const DocumentsList = () => {
  // Custom hook to fetch documents data
  const {
    documents,
    fetchData,
    error: errorDoc,
    loading: loadingDoc,
  } = useDataGetterHook();

  // State to manage search results
  const [searchResults, setSearchResults] = useState([]);

  // Custom hook to handle data fetching
  const { dataFetcher } = useDataFetch();

  // State to manage the list of documents
  const [documentList, setDocumentList] = useState([]);

  // Fetch documents data on component mount
  useEffect(() => {
    fetchData("documents", "documents");
  }, []);

  // Update search results when documents data changes
  useEffect(() => {
    if (documents?.data) {
      setSearchResults(documents?.data);
    }
  }, [documents?.data]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    if (!searchTerm) {
      setSearchResults(documents?.data);
      return;
    }
    const results = documents?.data.filter((d) => {
      const fileNameMatch = d.fileName?.toLowerCase().includes(searchTerm);
      return fileNameMatch;
    });
    setSearchResults(results);
  };

  // Update document list when documents data changes
  useEffect(() => {
    if (documents.data) {
      setDocumentList(documents?.data);
    }
  }, [documents?.data]);

  // Handle document deletion
  const deleteFile = async (id) => {
    try {
      const response = await dataFetcher(`documents/${id}`, "delete", {
        "Content-Type": "multipart/form-data",
      });
      setDocumentList((prevDocs) => prevDocs.filter((doc) => doc._id !== id));
      if (response?.message === "success") {
        toast.success("Document deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error("Failed to delete document");
    }
  };

  // Define table columns
  const columns = [
    {
      title: "Document",
      dataIndex: "fileName",
      key: "fileName",
      render: (text, record) => (
        <div className="flex items-center space-x-2">
          <FaFileAlt className="text-gray-500" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: "Upload Date",
      dataIndex: "date",
      key: "date",
      render: (text) => <span>{formatDate(text)}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex justify-between space-x-2">
          <Button
            onClick={(event) =>
              handleGeneralDownload(
                event,
                `${baseURL}/documents/${record._id}/download`,
                record?.fileName
              )
            }
            icon={<FaDownload />}
            className="text-blue-600 hover:text-blue-800">
            Download
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this document?"
            onConfirm={() => deleteFile(record._id)}
            okText="Yes"
            cancelText="No">
            <Button
              icon={<FaTrash />}
              className="text-red-600 hover:text-red-800">
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full m-2">
      {/* Search bar component */}
      <SearchBar onSearch={handleSearchChange} />
      {/* Show loading spinner if documents are being fetched */}
      {loadingDoc.documents && <LoadingSpinner />}

      {/* Show error message if there is an error fetching documents */}
      {errorDoc.documents && (
        <div className="text-center py-2">
          <h3 className="text-xl font-semibold text-red-600">
            Failed to display documents
          </h3>
        </div>
      )}

      <h2 className="text-2xl font-bold m-1">Documents</h2>

      {/* Display documents table if there are documents, otherwise show a message */}
      {documentList.length > 0 ? (
        <Table
          dataSource={searchResults}
          columns={columns}
          rowKey="_id"
          className="w-full"
          responsive
          scroll={{ x: 400 }}
        />
      ) : (
        !loadingDoc && (
          <div className="text-center ">
            <h3 className="text-xl font-semibold text-gray-600">
              No documents available
            </h3>
          </div>
        )
      )}
    </div>
  );
};

export default DocumentsList;
