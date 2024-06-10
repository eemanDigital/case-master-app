import { Table, Card } from "antd";
import { formatDate } from "../utils/formatDate";
const SingleCauseList = ({
  causeListData,
  loadingCauseList,
  errorCauseList,
  result,
}) => {
  //   console.log(causeListData);
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
      title: "Assigned To",
      dataIndex: "reportedBy",
      key: "reportedBy",
    },
    // Add more columns as needed
  ];

  const data =
    causeListData &&
    causeListData.map((report, index) => ({
      key: index,
      case: `${report.caseReported.firstParty.name[0].name} vs ${report.caseReported.secondParty.name[0].name}`,
      adjournedFor: report.adjournedFor,
      adjournedDate: formatDate(report.adjournedDate),
      //   reportedBy: report.reportedBy.fullName, to be use for lawyer in court
      // Add more fields as needed
    }));

  return (
    <>
      <Card>
        <h1 className="text-3xl font-bold text-center text-blue-500 leading-tight  tracking-wide">
          Number of Cases: {result}
        </h1>
      </Card>
      <Table columns={columns} dataSource={data} loading={loadingCauseList} />
    </>
  );
};
export default SingleCauseList;
