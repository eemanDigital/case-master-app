import { useState } from "react";
import MonthCauseList from "../pages/MonthCauseList";
import NextWeekCauseList from "../pages/NextWeekCauseList";
import YearCauseList from "../pages/YearCauseList";
import CurrentCauseList from "../pages/CurrentCauseList";

export const CauseList = () => {
  const [selectedReport, setSelectedReport] = useState("currentWeek");

  const renderReport = () => {
    switch (selectedReport) {
      case "currentWeek":
        return <CurrentCauseList />;
      case "nextWeek":
        return <NextWeekCauseList />;
      case "month":
        return <MonthCauseList />;
      case "year":
        return <YearCauseList />;
      default:
        return <CurrentCauseList />;
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Cause List</h1>
      <div className="my-4">
        <button
          className={`px-4 py-2 m-2 ${
            selectedReport === "currentWeek"
              ? "bg-blue-500 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => setSelectedReport("currentWeek")}>
          Current Week
        </button>
        <button
          className={`px-4 py-2 m-2 ${
            selectedReport === "nextWeek"
              ? "bg-blue-500 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => setSelectedReport("nextWeek")}>
          Next Week
        </button>
        <button
          className={`px-4 py-2 m-2 ${
            selectedReport === "month"
              ? "bg-blue-500 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => setSelectedReport("month")}>
          Month
        </button>
        <button
          className={`px-4 py-2 m-2 ${
            selectedReport === "year"
              ? "bg-blue-500 text-white"
              : "bg-white text-black"
          }`}
          onClick={() => setSelectedReport("year")}>
          Year
        </button>
      </div>
      {renderReport()}
    </>
  );
};
