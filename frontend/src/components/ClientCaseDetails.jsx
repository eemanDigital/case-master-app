import { useDataGetterHook } from "../hooks/useDataGetterHook";
import CaseReportList from "./CaseReportList";
import SingleCauseList from "./SingleCauseList";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import PageErrorAlert from "./PageErrorAlert";
import CurrentDayCauseList from "./CurrentDayCauseList";

const ClientCaseDetails = () => {
  const { causeList, reports, loading, error, fetchData } = useDataGetterHook();
  const { user } = useSelector((state) => state.auth);
  const clientId = user?.data?._id; // get client id
  const causeListData = causeList?.data?.reportsThisMonth || []; //cause list data for the month

  // fetch data
  useEffect(() => {
    fetchData("reports/upcoming", "causeList");
    fetchData("reports", "reports");
  }, []);

  // filter out clients cases
  // Filter reports for client
  const filteredCauseListForClient = (id) => {
    return causeListData?.filter(
      (causeListItem) => causeListItem?.caseReported?.client === id
    );
  };

  // Ensure reports are loaded
  if (loading.reports || loading.causeList) {
    <LoadingSpinner />;
  }

  // toast error if found
  if (error.reports || error.causeList) {
    return <PageErrorAlert error={error.reports || error.causeList} />;
  }

  // Extract the first report for each unique case
  const firstReports = reports?.data?.reduce((acc, report) => {
    const caseId = report?.caseReported?._id;
    if (!acc[caseId]) {
      acc[caseId] = report;
    }
    return acc;
  }, {});

  // Convert the object to an array
  const firstReportsArray = Object.values(firstReports || {});

  return (
    <div className="flex flex-col md:flex-row justify-between overflow-y-auto custom-scrollbar mt-4 gap-4 rounded-md">
      <div className="w-full h-96 overflow-y-auto custom-scrollbar p-4 bg-white shadow-md rounded-md">
        <CaseReportList
          showFilter={false}
          title="Latest Case Reports"
          shortenForClient={true}
          nameStyle="w-[50px] text-gray-800 break-words font-semibold"
          reports={firstReportsArray}
        />
      </div>

      <CurrentDayCauseList
        causeListData={filteredCauseListForClient(clientId)}
        loadingCauseList={loading.causeList}
        errorCauseList={error.causeList}
        addResultNumber={false}
        showDownloadBtn={false}
        hideButton={true}
        // cardWidth="50%"
        title="Your Case Schedule"
      />
    </div>
  );
};

export default ClientCaseDetails;
