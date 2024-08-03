import { useState } from "react";
import { Table, Card, Button } from "antd";
import { formatDate } from "../utils/formatDate";
import LawyersInCourtForm from "../pages/LawyersInCourtForm";
import { useAdminHook } from "../hooks/useAdminHook";
import { toast } from "react-toastify";

const SingleCauseList = ({
  causeListData,
  loadingCauseList,
  errorCauseList,
  addResultNumber,
  result,
  onDownloadCauseList,
  title,
  showDownloadBtn,
  h1Style,
}) => {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const { isSuperOrAdmin } = useAdminHook();

  // toast error if error
  if (errorCauseList) return toast.error(errorCauseList);

  const onRowClick = (record, rowIndex) => {
    return {
      onClick: () => {
        setSelectedReportId(causeListData[rowIndex]?._id);
      },
    };
  };

  const columns = [
    {
      title: "Case",
      dataIndex: "case",
      key: "case",
    },
    {
      title: "Adjourned For",
      dataIndex: "adjournedFor",
      key: "adjournedFor",
    },
    {
      title: "Adjourned Date",
      dataIndex: "adjournedDate",
      key: "adjournedDate",
    },

    {
      title: "Lawyers In Court",
      dataIndex: "lawyersInCourt",
      key: "lawyersInCourt",
      render: (lawyersInCourt) =>
        lawyersInCourt.length > 0 ? (
          <ul>
            {lawyersInCourt.map((lawyer, index) => (
              <li className="text-blue-700 capitalize" key={index}>
                {lawyer.firstName} {lawyer.lastName}
                <span>,Esq</span>.
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-red-600">Not Yet Assigned</p>
        ),
    },
  ];

  // causelist data from case report
  const data =
    causeListData &&
    causeListData?.map((report, index) => ({
      key: index,
      case: `${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`,
      adjournedFor: report?.adjournedFor,
      adjournedDate: formatDate(report?.adjournedDate),
      lawyersInCourt: report?.lawyersInCourt,
    }));

  return (
    <>
      {addResultNumber && (
        <Card>
          {title || (
            <h1
              className={
                h1Style ||
                `text-3xl font-bold text-center text-gray-500 leading-tight  tracking-wide`
              }>
              Number of Cases: {result}
            </h1>
          )}
        </Card>
      )}
      <div>
        {selectedReportId && isSuperOrAdmin && (
          <LawyersInCourtForm reportId={selectedReportId} />
        )}
        <Table
          onRow={onRowClick}
          columns={columns}
          dataSource={data}
          loading={loadingCauseList}
        />
        {showDownloadBtn && (
          <Button onClick={onDownloadCauseList}>Download</Button>
        )}
      </div>
    </>
  );
};
export default SingleCauseList;
