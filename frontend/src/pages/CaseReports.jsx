import { Link } from "react-router-dom";
import Button from "../components/Button";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";

const CaseReports = () => {
  const { reports, errorReports, loadingReports } = useDataGetterHook();
  // console.log(reports?.data);
  return (
    <section>
      <h1 className="text-center text-5xl font-bold">Case Reports</h1>

      <div className="flex flex-col gap-8">
        {reports?.data?.map((report) => (
          <div key={report._id}>
            <h1 className="text-2xl font-bold">
              {report?.caseReported?.firstParty?.name[0]?.name} vs{" "}
              {report?.caseReported?.secondParty?.name[0]?.name}
            </h1>

            <div className="flex flex-col gap-2 ">
              <small className="text-red-600">
                Reported on: {formatDate(report?.date)}
              </small>
              <p> {report?.update}</p>
            </div>
            <div className="flex justify-between">
              <small className="text-green-700 font-bold">
                {" "}
                Adjourned Date: {formatDate(report?.adjournedDate)}{" "}
              </small>
              <small className=" font-bold">
                {" "}
                Reported By: {report?.reportedBy?.fullName}{" "}
              </small>
            </div>
          </div>
        ))}
      </div>

      <Link to="add-report">
        <Button>+ Add Report</Button>
      </Link>
    </section>
  );
};

export default CaseReports;
// {
//     name: "Add Report",
//     path: "add-report",
//     icon: <MdEditNote />,
//   },
