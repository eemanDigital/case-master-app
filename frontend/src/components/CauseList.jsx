import { useState } from "react";
import SingleCauseList from "./SingleCauseList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import SwitchButton from "./SwitchButton";
import { handleDownload } from "../utils/downloadHandler";

export const CauseList = () => {
  const [selectedReport, setSelectedReport] = useState("currentWeek");
  const { causeList, loading, error } = useDataGetterHook();

  const downloadURL = import.meta.env.VITE_BASE_URL;

  const renderReport = () => {
    switch (selectedReport) {
      case "currentWeek":
        return (
          <SingleCauseList
            causeListData={causeList.data?.reportsThisWeek}
            loadingCauseList={loading.causeList}
            errorCauseList={error.causeList}
            result={causeList.data?.weekResults}
            showDownloadBtn={true}
            addResultNumber={true}
            onDownloadCauseList={(event) =>
              handleDownload(
                event,
                `${downloadURL}/reports/pdf/causeList/week`,
                "causeList.pdf"
              )
            }
          />
        );
      case "nextWeek":
        return (
          <SingleCauseList
            causeListData={causeList.data?.reportsNextWeek}
            loadingCauseList={loading.causeList}
            errorCauseList={error.causeList}
            result={causeList.data?.nextWeekResults}
            showDownloadBtn={true}
            addResultNumber={true}
            onDownloadCauseList={(event) =>
              handleDownload(
                event,
                `${downloadURL}/reports/pdf/causeList/next-week`,
                "causeList.pdf"
              )
            }
          />
        );
      case "month":
        return (
          <SingleCauseList
            causeListData={causeList?.data.reportsThisMonth}
            loadingCauseList={loading.causeList}
            errorCauseList={error.causeList}
            result={causeList.data?.monthResults}
            showDownloadBtn={true}
            addResultNumber={true}
            onDownloadCauseList={(event) =>
              handleDownload(
                event,
                `${downloadURL}/reports/pdf/causeList/month`,
                "causeList.pdf"
              )
            }
          />
        );
      case "year":
        return (
          <SingleCauseList
            causeListData={causeList.data?.reportsThisYear}
            loadingCauseList={loading.causeList}
            errorCauseList={error.causeList}
            addResultNumber={true}
            result={causeList.data?.yearResults}
          />
        );
      default:
        return (
          <SingleCauseList
            causeListData={causeList.data?.reportsThisWeek}
            loadingCauseList={loading.causeList}
            errorCauseList={error.causeList}
          />
        );
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Cause List</h1>
      <div className="my-4">
        <SwitchButton
          currentState={selectedReport}
          updatedState={setSelectedReport}
          stateText="currentWeek"
          text="   Current Week"
        />
        <SwitchButton
          currentState={selectedReport}
          updatedState={setSelectedReport}
          stateText="nextWeek"
          text="    Next Week"
        />
        <SwitchButton
          currentState={selectedReport}
          updatedState={setSelectedReport}
          stateText="month"
          text="Month"
        />
        <SwitchButton
          currentState={selectedReport}
          updatedState={setSelectedReport}
          stateText="year"
          text="Year"
        />
      </div>

      {renderReport()}
    </>
  );
};
