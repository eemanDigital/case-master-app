import { Link } from "react-router-dom";
import { Card, Typography, Space, Pagination, Button, Modal } from "antd";
// import Button from "../components/Button";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import { useState } from "react";
import UpdateCaseReportForm from "./UpdateCaseReportForm";
import { handleDownload } from "../utils/downloadHandler";

const { Title, Text } = Typography;
const downloadURL = import.meta.env.VITE_BASE_URL;

const CaseReportList = () => {
  const { reports, errorReports, loadingReports } = useDataGetterHook();
  const { dataFetcher } = useDataFetch();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); //number of items per page

  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = reports?.data?.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  //   handle delete
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  const handleDeleteReport = async (id) => {
    await dataFetcher(`reports/${id}`, "delete", fileHeaders);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  return (
    <section>
      <Title level={1} className="text-center">
        Case Reports
      </Title>

      <Card>
        <Link to="add-report">
          <Button>+ Add Report New Report</Button>
        </Link>
      </Card>
      <Space direction="vertical" size="large">
        {currentReports?.map((report) => (
          <Card
            key={report._id}
            title={
              <Title level={2}>
                {report?.caseReported?.firstParty?.name[0]?.name} vs{" "}
                {report?.caseReported?.secondParty?.name[0]?.name}
              </Title>
            }>
            <Space direction="vertical" size="small">
              <p>Reported on: {formatDate(report?.date)}</p>
              <p>{report?.update}</p>
              <Space direction="horizontal" size="large">
                <p type="success">Adjourned For: {report?.adjournedFor}</p>
                <p>Adjourned Date: {formatDate(report?.adjournedDate)}</p>
                <p>Reported By: {report?.reportedBy?.fullName}</p>
              </Space>
            </Space>
            <div className="flex justify-between">
              <UpdateCaseReportForm reportId={report._id} />

              <button
                className="bg-green-500 hover:bg-green-700 text-white  py-2 px-4 my-2 tracking-wider "
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
                className="bg-red-500 hover:bg-red-700 text-white  py-2 px-4 my-2 tracking-wider "
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
          </Card>
        ))}
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
