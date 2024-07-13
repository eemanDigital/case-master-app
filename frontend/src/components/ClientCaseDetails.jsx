import { Spin, Alert } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAuthContext } from "../hooks/useAuthContext";
// import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import CaseReportList from "./CaseReportList";
import SingleCauseList from "./SingleCauseList";

const ClientCaseDetails = () => {
  const { causeList, reports, loading, error } = useDataGetterHook();
  const { user } = useAuthContext();

  const clientCase = user?.data?.user?.case;
  const clientCaseIds = clientCase.map((item) => item.id); //get caseIDs
  const causeListData = causeList?.data?.reportsThisMonth || []; //cause list data for the month

  // filter out clients cases
  const filteredCauseList = causeListData.filter((items) =>
    clientCaseIds.includes(items?.caseReported.id)
  );

  // Ensure reports are loaded
  if (loading.reports || loading.causeList) {
    return (
      <Spin
        tip="Loading..."
        style={{ marginTop: "20px", textAlign: "center" }}
      />
    );
  }

  if (error.reports || error.causeList) {
    return (
      <Alert
        message="Error"
        description={error.reports || error.causeList}
        type="error"
        showIcon
        style={{ marginTop: "20px" }}
      />
    );
  }

  // Extract the first report for each unique case
  const firstReports = reports?.data?.reduce((acc, report) => {
    const caseId = report?.caseReported?._id;
    if (!acc[caseId]) {
      acc[caseId] = report;
    }
    return acc;
  }, {});

  const firstReportsArray = Object.values(firstReports || {});

  //   console.log(firstReportsArray, "RE");

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
