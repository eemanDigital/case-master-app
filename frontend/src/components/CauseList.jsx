import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SingleCauseList from "./SingleCauseList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import SwitchButton from "./SwitchButton";
import { useDownloadPdfHandler } from "../hooks/useDownloadPdfHandler";

const downloadURL = import.meta.env.VITE_BASE_URL;

export const CauseList = () => {
  const [selectedReport, setSelectedReport] = useState("currentWeek");
  const { causeList, loading, error, fetchData } = useDataGetterHook();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    handleDownloadPdf,
    loading: loadingPdf,
    error: pdfError,
  } = useDownloadPdfHandler();
  // Update selectedReport based on searchParams
  useEffect(() => {
    const reportType = searchParams.get("type");
    if (reportType) {
      setSelectedReport(reportType);
    }
  }, [searchParams]);

  // fetch data
  useEffect(() => {
    fetchData("reports/upcoming", "causeList");
  }, []);

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
            loadingPdf={loadingPdf}
            pdfError={pdfError}
            onDownloadCauseList={(event) =>
              handleDownloadPdf(
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
            loadingPdf={loadingPdf}
            pdfError={pdfError}
            onDownloadCauseList={(event) =>
              handleDownloadPdf(
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
            causeListData={causeList?.data?.reportsThisMonth}
            loadingCauseList={loading.causeList}
            errorCauseList={error.causeList}
            result={causeList.data?.monthResults}
            showDownloadBtn={true}
            addResultNumber={true}
            loadingPdf={loadingPdf}
            pdfError={pdfError}
            onDownloadCauseList={(event) =>
              handleDownloadPdf(
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
          text="Current Week"
          onClick={() => setSearchParams({ type: "currentWeek" })}
        />
        <SwitchButton
          currentState={selectedReport}
          updatedState={setSelectedReport}
          stateText="nextWeek"
          text="Next Week"
          onClick={() => setSearchParams({ type: "nextWeek" })}
        />
        <SwitchButton
          currentState={selectedReport}
          updatedState={setSelectedReport}
          stateText="month"
          text="Month"
          onClick={() => setSearchParams({ type: "month" })}
        />
        <SwitchButton
          currentState={selectedReport}
          updatedState={setSelectedReport}
          stateText="year"
          text="Year"
          onClick={() => setSearchParams({ type: "year" })}
        />
      </div>

      {renderReport()}
    </>
  );
};
