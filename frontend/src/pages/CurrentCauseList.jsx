import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Table } from "antd";

const CurrentCauseList = () => {
  const { causeList, loadingCauseList, errorCauseList } = useDataGetterHook();

  //   console.log(causeList.data?.reportsThisWeek);
  const columns = [
    {
      title: "First Party",
      dataIndex: "firstParty",
      key: "firstParty",
    },
    {
      title: "Second Party",
      dataIndex: "secondParty",
      key: "secondParty",
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
      title: "Reported By",
      dataIndex: "reportedBy",
      key: "reportedBy",
    },
    // Add more columns as needed
  ];

  const data = causeList.data?.reportsThisWeek.map((report, index) => ({
    key: index,
    firstParty: report.caseReported.firstParty.name[0].name,
    secondParty: report.caseReported.secondParty.name[0].name,
    adjournedFor: report.adjournedFor,
    adjournedDate: report.adjournedDate,
    reportedBy: report.reportedBy.fullName,
    // Add more fields as needed
  }));

  return (
    <Table columns={columns} dataSource={data} loading={loadingCauseList} />
  );
};
export default CurrentCauseList;
