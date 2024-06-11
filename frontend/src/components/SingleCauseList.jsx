import { useState } from "react";
import { Table, Card } from "antd";
import { formatDate } from "../utils/formatDate";
import LawyersInCourtForm from "../pages/LawyersInCourtForm";
const SingleCauseList = ({
  causeListData,
  loadingCauseList,
  errorCauseList,
  result,
}) => {
  const [selectedReportId, setSelectedReportId] = useState(null);

  const onRowClick = (record, rowIndex) => {
    return {
      onClick: () => {
        setSelectedReportId(causeListData[rowIndex]._id);
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
      render: (lawyersInCourt) => (
        <ul>
          {lawyersInCourt &&
            lawyersInCourt.map((lawyer, index) => (
              <li className="text-blue-600 font-semibold" key={index}>
                {lawyer.fullName}
                <span>,Esq</span>.
              </li>
            ))}
        </ul>
      ),
    },
  ];

  const data =
    causeListData &&
    causeListData.map((report, index) => ({
      key: index,
      case: `${report.caseReported.firstParty.name[0].name} vs ${report.caseReported.secondParty.name[0].name}`,
      adjournedFor: report.adjournedFor,
      adjournedDate: formatDate(report.adjournedDate),
      lawyersInCourt: report.lawyersInCourt,
    }));

  return (
    <>
      <Card>
        <h1 className="text-3xl font-bold text-center text-blue-500 leading-tight  tracking-wide">
          Number of Cases: {result}
        </h1>
      </Card>
      <div>
        {selectedReportId && <LawyersInCourtForm reportId={selectedReportId} />}
        <Table
          onRow={onRowClick}
          columns={columns}
          dataSource={data}
          loading={loadingCauseList}
        />
      </div>
    </>
  );
};
export default SingleCauseList;
