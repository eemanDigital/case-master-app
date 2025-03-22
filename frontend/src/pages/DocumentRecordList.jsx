import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { useAdminHook } from "../hooks/useAdminHook";
import { Space, Table, Button, Modal, Tooltip } from "antd";
import { formatDate } from "../utils/formatDate";
import avatar from "../assets/avatar.png";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { deleteData } from "../redux/features/delete/deleteSlice";
import SearchBar from "../components/SearchBar";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import ButtonWithIcon from "../components/ButtonWithIcon";

const DocumentRecordList = () => {
  const {
    documentRecord,
    loading: loadingDocumentRecord,
    error: errorDocumentRecord,
    fetchData,
  } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { Column, ColumnGroup } = Table;
  const dispatch = useDispatch();
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  //   console.log(documentRecord?.data?.docRecords);

  // render all cases initially before filter
  useEffect(() => {
    if (documentRecord?.data) {
      setSearchResults(documentRecord?.data.docRecords);
    }
  }, [documentRecord?.data]); // Only depend on users.data to avoid unnecessary re-renders

  // handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(documentRecord?.data?.docRecords);
      return;
    }

    const results = documentRecord?.data?.docRecords?.filter((d) => {
      const refMatch = d.docRef?.toLowerCase().includes(searchTerm);
      const docNameMatch = d.documentName?.toLowerCase().includes(searchTerm);

      return refMatch || docNameMatch;
    });
    setSearchResults(results);
  };

  // fetch data
  useEffect(() => {
    fetchData("documentRecord", "documentRecord");
  }, []);

  if (loadingDocumentRecord?.documentRecord) {
    return <LoadingSpinner />;
  }

  console.log(searchResults);
  // handles search filter
  //   const handleSearchChange = (e) => {
  //     const searchTerm = e.target.value.trim().toLowerCase();

  //     if (!searchTerm) {
  //       setSearchResults(documentRecord?.data);
  //       return;
  //     }
  //     const results = documentRecord?.data.filter((d) => {
  //       const fullName =
  //         `${d.employee.firstName}${d.employee.lastName}`.toLowerCase();
  //       return fullName.includes(searchTerm);
  //     });
  //     setSearchResults(results);
  //   };

  // delete leave app
  const removeRecord = async (id) => {
    try {
      await dispatch(deleteData(`documentRecord/${id}`));
      await fetchData("documentRecord", "documentRecord");
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  // Filter out the leave applications based on the user's role
  //   const filteredLeaveApps = isAdminOrHr
  //     ? searchResults
  //     : searchResults?.filter((app) => app?.employee?._id === user?.data?._id);

  return (
    <>
      {errorDocumentRecord.documentRecord ? (
        <PageErrorAlert
          errorCondition={errorDocumentRecord.documentRecord}
          errorMessage={errorDocumentRecord.documentRecord}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center  mb-3">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Document Record
            </h1>
            <Link to="/dashboard/record-documents">
              <ButtonWithIcon
                onClick={() => {}}
                icon={<PlusOutlined />}
                text="Create Record"
              />
            </Link>

            <SearchBar onSearch={handleSearchChange} />
          </div>
          <div className=" overflow-x-auto mt-3">
            <Table dataSource={searchResults} scroll={{ x: 1000 }}>
              {/* <ColumnGroup title="Document Record"> */}
              {/* <Column
                  title="Photo"
                  dataIndex={["employee", "photo"]}
                  key="photo"
                  render={(photo, record) => (
                    <div className="flex items-center justify-center">
                      <img
                        className="w-12 h-12 object-cover rounded-full"
                        src={photo ? photo : avatar}
                      />
                    </div>
                  )}
                /> */}

              {/* <Column
                  title="Employee Name"
                  dataIndex={["", "firstName"]}
                  key="employee.name"
                  render={(text, record) => (
                    <Link
                      className="capitalize text-gray-700 hover:text-gray-400 cursor-pointer font-medium"
                      to={`${record?.id}/details`}
                      title="Click for details">
                      {`${record.employee.firstName} ${record.employee.lastName}`}
                    </Link>
                  )}
                /> */}
              {/* </ColumnGroup> */}

              <Column title="Ref" dataIndex="docRef" key="docRef" />
              <Column
                title="Document Name"
                dataIndex="documentName"
                key="documentName"
                render={(text, record) => (
                  <Link
                    to={`/dashboard/record-document-list/${record._id}/details`}
                    className="text-blue-600 hover:text-blue-800 hover:underline">
                    {text}
                  </Link>
                )}
              />
              <Column
                title="Document Type"
                dataIndex="documentType"
                key="documentType"
              />
              <Column title="Sender" dataIndex="sender" key="sender" />

              <Column
                title="Date Received"
                dataIndex="dateReceived"
                key="dateReceived"
                render={(date) => formatDate(date || null)}
              />
              <Column
                title="Recorded On"
                dataIndex="createdAt"
                key="createdAt"
                render={(date) => formatDate(date || null)}
              />
              {/* <Column
                title="End Date"
                dataIndex="endDate"
                key="endDate"
                render={(date) => formatDate(date || null)}
              /> */}

              {/* <Column
                title="status"
                dataIndex="status"
                key="status"
                render={(text, record) => (
                  <div
                    className={
                      record?.status === "approved"
                        ? "bg-green-500 p-1 text-center text-white rounded-md"
                        : record?.status === "pending"
                        ? "bg-yellow-500 p-1 text-center text-white rounded-md"
                        : "bg-red-500 p-1 text-center text-white rounded-md"
                    }>
                    {text}
                  </div>
                )}
              /> */}

              <Column
                title="Action"
                key="action"
                render={(text, record) => (
                  <Space size="middle">
                    {/* <Button type="link">
                      <Link to={`${record?.id}/details`}>Get Details</Link>
                    </Button> */}

                    <Tooltip title="Delete Record">
                      <Button
                        icon={<DeleteOutlined />}
                        className="mx-6 bg-red-200 text-red-500 hover:text-red-700"
                        onClick={() => {
                          Modal.confirm({
                            title:
                              "Are you sure you want to delete this record?",
                            onOk: () => removeRecord(record?._id),
                          });
                        }}
                        type="primary"></Button>
                    </Tooltip>
                  </Space>
                )}
              />
            </Table>
          </div>
        </>
      )}
    </>
  );
};

export default DocumentRecordList;
