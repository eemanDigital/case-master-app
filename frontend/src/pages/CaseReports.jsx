// import { Link } from "react-router-dom";
// import Button from "../components/Button";
// import { useDataGetterHook } from "../hooks/useDataGetterHook";
// import { formatDate } from "../utils/formatDate";

// const CaseReports = () => {
//   const { reports, errorReports, loadingReports } = useDataGetterHook();
//   // console.log(reports?.data);
//   return (
//     <section>
//       <h1 className="text-center text-5xl font-bold">Case Reports</h1>

//       <div className="flex flex-col gap-8">
//         {reports?.data?.map((report) => (
//           <div key={report._id}>
//             <h1 className="text-2xl font-bold">
//               {report?.caseReported?.firstParty?.name[0]?.name} vs{" "}
//               {report?.caseReported?.secondParty?.name[0]?.name}
//             </h1>

//             <div className="flex flex-col gap-2 ">
//               <small className="text-red-600">
//                 Reported on: {formatDate(report?.date)}
//               </small>
//               <p> {report?.update}</p>
//             </div>
//             <div className="flex justify-between">
//               <small className="text-green-700 font-bold">
//                 {" "}
//                 Adjourned Date: {formatDate(report?.adjournedDate)}{" "}
//               </small>
//               <small className=" font-bold">
//                 {" "}
//                 Reported By: {report?.reportedBy?.fullName}{" "}
//               </small>
//             </div>
//           </div>
//         ))}
//       </div>

//       <Link to="add-report">
//         <Button>+ Add Report</Button>
//       </Link>
//     </section>
//   );
// };

// export default CaseReports;
import { Link } from "react-router-dom";
import { Card, Typography, Space, Pagination } from "antd";
import Button from "../components/Button";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import { useState } from "react";

const { Title, Text } = Typography;

const CaseReports = () => {
  const { reports, errorReports, loadingReports } = useDataGetterHook();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Change this to your desired items per page

  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = reports?.data?.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  return (
    <section>
      <Title level={1} className="text-center">
        Case Reports
      </Title>

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
              <Text type="danger">Reported on: {formatDate(report?.date)}</Text>
              <Text>{report?.update}</Text>
              <Space direction="horizontal" size="large">
                <Text type="success">
                  Adjourned Date: {formatDate(report?.adjournedDate)}
                </Text>
                <Text>Reported By: {report?.reportedBy?.fullName}</Text>
              </Space>
            </Space>
          </Card>
        ))}
      </Space>

      <Pagination
        current={currentPage}
        total={reports?.data?.length}
        pageSize={itemsPerPage}
        onChange={paginate}
      />
      <Link to="add-report">
        <Button>+ Add Report</Button>
      </Link>
    </section>
  );
};

export default CaseReports;
