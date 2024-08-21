import { useDataGetterHook } from "../hooks/useDataGetterHook";
import CaseReportList from "./CaseReportList";
import SingleCauseList from "./SingleCauseList";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import LoadingSpinner from "./LoadingSpinner";
import PageErrorAlert from "./PageErrorAlert";

const ClientCaseDetails = () => {
  const { causeList, reports, loading, error, fetchData } = useDataGetterHook();
  const { user } = useSelector((state) => state.auth);

  const clientCase = user?.data?.clientCase;
  const clientCaseIds = clientCase?.map((item) => item?.id); //get caseIDs
  const causeListData = causeList?.data?.reportsThisMonth || []; //cause list data for the month

  // fetch data
  useEffect(() => {
    fetchData("reports/upcoming", "causeList");
    fetchData("reports", "reports");
  }, []);

  // filter out clients cases
  const filteredCauseList = causeListData.filter((items) =>
    clientCaseIds.includes(items?.caseReported?.id)
  );

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
    <div className="flex justify-between   p-4 my-4 mx-2 gap-4 rounded-md">
      <div className=" flex justify-evenly items-center md:items-center md:flex-row flex-col gap-3">
        <div className="w-[480px] h-[340px]  p-4 shadow-inner bg-gray-300 overflow-scroll hide-scrollbar">
          <CaseReportList
            showFilter={false}
            title="Latest Case Report"
            reports={firstReportsArray}
          />
        </div>

        <div className=" w-[50%] pt-5">
          <h1 className="  text-2xl text-center font-medium  text-gray-700">
            Case Schedule
          </h1>
          <SingleCauseList
            causeListData={filteredCauseList}
            loadingCauseList={loading.causeList}
            errorCauseList={error.causeList}
            addResultNumber={false}
            showDownloadBtn={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientCaseDetails;
