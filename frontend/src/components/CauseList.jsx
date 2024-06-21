import { useState } from "react";
// import MonthCauseList from "../pages/MonthCauseList";
// import NextWeekCauseList from "../pages/NextWeekCauseList";
// import YearCauseList from "../pages/YearCauseList";
// import CurrentCauseList from "../pages/CurrentCauseList";
import SingleCauseList from "./SingleCauseList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import SwitchButton from "./SwitchButton";

export const CauseList = () => {
  const [selectedReport, setSelectedReport] = useState("currentWeek");
  const { causeList, loadingCauseList, errorCauseList } = useDataGetterHook();

  //   causeList?.data.reportsNextMonth
  //   causeList.data?.reportsThisWeek
  //   causeList.data?.reportsNextWeek
  //   causeList.data?.reportsYear

  //   "weekResults": 1,
  //         "nextWeekResults": 2,
  //         "monthResults": 4,
  //         "yearResults": 5

  const renderReport = () => {
    switch (selectedReport) {
      case "currentWeek":
        return (
          <SingleCauseList
            causeListData={causeList.data?.reportsThisWeek}
            loadingCauseList={loadingCauseList}
            result={causeList.data?.weekResults}
          />
        );
      case "nextWeek":
        return (
          <SingleCauseList
            causeListData={causeList.data?.reportsNextWeek}
            loadingCauseList={loadingCauseList}
            errorCauseList={errorCauseList}
            result={causeList.data?.nextWeekResults}
          />
        );
      case "month":
        return (
          <SingleCauseList
            causeListData={causeList?.data.reportsThisMonth}
            errorCauseList={errorCauseList}
            loadingCauseList={loadingCauseList}
            result={causeList.data?.monthResults}
          />
        );
      case "year":
        return (
          <SingleCauseList
            causeListData={causeList.data?.reportsThisYear}
            errorCauseList={errorCauseList}
            loadingCauseList={loadingCauseList}
            result={causeList.data?.yearResults}
          />
        );
      default:
        return (
          <SingleCauseList
            causeListData={causeList.data?.reportsThisWeek}
            errorCauseList={errorCauseList}
            loadingCauseList={loadingCauseList}
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
