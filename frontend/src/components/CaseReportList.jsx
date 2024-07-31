import { Link } from "react-router-dom";
import { Card, Typography, Space, Pagination, Button, Modal } from "antd";
import { formatDate } from "../utils/formatDate";
import { useEffect, useState } from "react";
import UpdateCaseReportForm from "../pages/UpdateCaseReportForm";
import { handleDownload } from "../utils/downloadHandler";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import useTextShorten from "../hooks/useTextShorten";
import { useSelector } from "react-redux";

// const { Title } = Typography;
const downloadURL = import.meta.env.VITE_BASE_URL;

const CaseReportList = ({ title, showFilter, reports }) => {
  const { isStaff } = useAdminHook();
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const { shortenText } = useTextShorten();
  const caseIDs = user?.data?.clientCase?.map((caseItem) => caseItem?._id);

  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Number of items per page
  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = searchResults.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  // Handle delete
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
  const handleDeleteReport = async (id) => {
    try {
      await axios.delete(
        `http://localhost:3000/api/v1/reports/${id}`,
        fileHeaders
      );
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  // render all cases initially before filter
  useEffect(() => {
    if (reports) {
      setSearchResults(reports);
    }
  }, [reports]);

  // handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(reports);
      return;
    }
    const results = reports?.filter((d) => {
      const firstPartyMatch = d.caseReported?.firstParty?.name?.some(
        (nameObj) => nameObj?.name?.toLowerCase().includes(searchTerm)
      );
      const secondPartyMatch = d?.caseReported?.secondParty?.name?.some(
        (nameObj) => nameObj?.name.toLowerCase().includes(searchTerm)
      );
      const adjournedFor = d?.adjournedFor?.toLowerCase().includes(searchTerm);
      const update = d?.update?.toLowerCase().includes(searchTerm);

      return firstPartyMatch || secondPartyMatch || update || adjournedFor;
    });

    setSearchResults(results || cases?.data);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // filter case by client
  const filterCaseByClient = (caseIds) => {
    return (
      reports?.filter((report) =>
        caseIds?.includes(report?.caseReported?._id)
      ) || []
    );
  };

  return (
    <section className="w-full mt-7">
      <h1 className="text-2xl text-gray-600 text-center font-bold md:text-left">
        {title}
      </h1>
      <div className="flex justify-between items-center m-2">
        {isStaff && (
          <Link to="add-report">
            <Button>+ Add New Report</Button>
          </Link>
        )}
        {showFilter && <SearchBar onSearch={handleSearchChange} />}
      </div>
      <Space direction="vertical" size="large" className="w-full">
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
                <p className="font-bold font-poppins">
                  Reported on:{" "}
                  <span className="text-rose-500">
                    {formatDate(report?.date)}
                  </span>
                </p>
                <p className="font-poppins text-justify">
                  {shortenText(report?.update, 300, report._id)}
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
              <div className="flex justify-between">
                {isStaff && <UpdateCaseReportForm reportId={report._id} />}
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
                {isStaff && (
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
                )}
              </div>
            </Card>
          )
        )}
      </Space>
      <Pagination
        current={currentPage}
        total={reports?.length}
        pageSize={itemsPerPage}
        onChange={paginate}
      />
    </section>
  );
};

export default CaseReportList;
