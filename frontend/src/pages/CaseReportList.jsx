import { Link } from "react-router-dom";
import { Card, Typography, Space, Pagination, Button, Modal } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook"; // Ensure the correct path
import { formatDate } from "../utils/formatDate";
import { useEffect, useState } from "react";
import UpdateCaseReportForm from "./UpdateCaseReportForm";
import { handleDownload } from "../utils/downloadHandler";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import { useAuthContext } from "../hooks/useAuthContext";

const { Title } = Typography;
const downloadURL = import.meta.env.VITE_BASE_URL;

const CaseReportList = () => {
  const { reports, errorReports, loadingReports } = useDataGetterHook();
  const { isStaff } = useAdminHook();
  const { user } = useAuthContext();
  const caseIDs = user?.data?.user?.case?.map((caseItem) => caseItem?._id);

  // console.log("RE", reports);

  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Number of items per page
  const [showFullText, setShowFullText] = useState(false); // State to manage update display
  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = searchResults.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  // handle update text shortening
  const toggleShowFullText = () => {
    setShowFullText(!showFullText); // Toggle between showing full text or shortened
  };
  // shorten report update
  const shortenText = (text, maxLength) => {
    if (!showFullText && text.length > maxLength) {
      return (
        <span>
          {text.substring(0, maxLength)}...
          <button
            onClick={toggleShowFullText}
            style={{
              marginLeft: "5px",
              color: "blue",
              cursor: "pointer",
              background: "none",
              border: "none",
              textDecoration: "underline",
            }}>
            Read More
          </button>
        </span>
      );
    } else {
      return (
        <span>
          {text}
          <button
            onClick={toggleShowFullText}
            style={{
              marginLeft: "5px",
              color: "blue",
              cursor: "pointer",
              background: "none",
              border: "none",
              textDecoration: "underline",
            }}>
            Show Less
          </button>
        </span>
      );
    }
  };
  //////////////////////////////
  // Handle delete
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  const handleDeleteReport = async (id) => {
    try {
      // Assuming dataFetcher is a function that handles API requests
      await axios.delete(`http://localhost:3000/api/v1/reports/${id}`, {
        headers: fileHeaders,
      });
      // Optionally, refresh the reports data after deletion
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };
  /////////////////////////////////////////////

  // render all cases initially before filter
  useEffect(() => {
    if (reports?.data) {
      setSearchResults(reports?.data);
    }
  }, [reports]);
  // handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(reports?.data);
      return;
    }
    const results = reports?.data.filter((d) => {
      // Check in firstParty names
      const firstPartyMatch = d.caseReported?.firstParty?.name?.some(
        (nameObj) => nameObj?.name?.toLowerCase().includes(searchTerm)
      );
      // Check in secondParty names
      const secondPartyMatch = d?.caseReported?.secondParty?.name?.some(
        (nameObj) => nameObj?.name.toLowerCase().includes(searchTerm)
      );
      const adjournedFor = d?.adjournedFor?.toLowerCase().includes(searchTerm);
      // check by update no
      const update = d?.update?.toLowerCase().includes(searchTerm);

      return firstPartyMatch || secondPartyMatch || update || adjournedFor;
    });

    setSearchResults(results || cases?.data);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  if (loadingReports) return <p>Loading...</p>;
  if (errorReports) return <p>{errorReports}</p>;

  // filter case by client
  const filterCaseByClient = (caseIds) => {
    return (
      reports?.data?.filter((report) =>
        caseIds.includes(report?.caseReported?._id)
      ) || []
    );
  };

  return (
    <section className="w-full">
      <h1 className="text-2xl text-gray-600 text-center font-bold md:text-left">
        Case Reports
      </h1>
      <div className="flex justify-between items-center m-2">
        {isStaff && (
          <Link to="add-report">
            <Button>+ Add New Report</Button>
          </Link>
        )}
        <SearchBar onSearch={handleSearchChange} />
      </div>
      {/* isStaff ? currentReport : filterCaseByClient(caseID) */}
      <Space direction="vertical" size="large">
        {(isStaff ? currentReports : filterCaseByClient(caseIDs))?.map(
          (report) => (
            <Card
              style={{ width: "100%" }}
              key={report._id}
              title={
                <h1 className="text-2xl text-gray-700">
                  {report?.caseReported?.firstParty?.name[0]?.name} vs{" "}
                  {report?.caseReported?.secondParty?.name[0]?.name}
                </h1>
              }>
              <Space direction="vertical" size="small">
                <p className="   font-bold font-poppins">
                  Reported on:{" "}
                  <span className="text-rose-500 ">
                    {formatDate(report?.date)}
                  </span>
                </p>
                <p className="font-poppins text-justify">
                  {shortenText(report?.update, 300)}
                </p>
                <Space direction="horizontal" size="large">
                  <p className="font-bold">
                    Adjourned For:{" "}
                    <span className="text-rose-600 font-bold">
                      {report?.adjournedFor}
                    </span>
                  </p>
                  <p className="font-bold">
                    Adjourned Date:{" "}
                    <span className="text-blue-500">
                      {formatDate(report?.adjournedDate)}
                    </span>
                  </p>
                  <p className="font-bold">
                    Reported By: {report?.reportedBy?.fullName}
                  </p>
                </Space>
              </Space>
              {isStaff && (
                <div className="flex justify-between">
                  <UpdateCaseReportForm reportId={report._id} />

                  <button
                    className="bg-green-500 hover:bg-green-700 rounded-md text-white py-2 px-4 my-2 tracking-wider"
                    onClick={(event) =>
                      handleDownload(
                        event,
                        `${downloadURL}/reports/pdf/${report?._id}`,
                        "report.pdf"
                      )
                    }>
                    Download Report
                  </button>

                  <button
                    className="bg-red-500 hover:bg-red-700 rounded-md text-white py-2 px-4 my-2 tracking-wider"
                    onClick={() => {
                      Modal.confirm({
                        title: "Are you sure you want to delete this report?",
                        onOk: () => handleDeleteReport(report?._id),
                      });
                    }}
                    type="primary">
                    Delete
                  </button>
                </div>
              )}
            </Card>
          )
        )}
      </Space>

      <Pagination
        current={currentPage}
        total={reports?.data?.length}
        pageSize={itemsPerPage}
        onChange={paginate}
      />
    </section>
  );
};

export default CaseReportList;
