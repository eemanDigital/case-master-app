import { useEffect, useState } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import CaseReportList from "./CaseReportList";
import LoadingSpinner from "./LoadingSpinner";
import { Link } from "react-router-dom";

const LatestCaseReports = () => {
  const { reports, loading, error, fetchData } = useDataGetterHook();
  const [todayReports, setTodayReports] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  // Helper function to check if a date is today
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Fetch data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        await fetchData("reports", "reports");
        setHasFetched(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        setHasFetched(true);
      }
    };

    fetchReports();
  }, [fetchData]); // Only depends on fetchData

  useEffect(() => {
    if (hasFetched && Array.isArray(reports?.data)) {
      const filteredReports = reports.data.filter((report) =>
        isToday(report?.date)
      );
      setTodayReports(filteredReports);
    }
  }, [hasFetched, reports]); // Runs when fetch is complete and reports are updated

  if (loading.reports) return <LoadingSpinner />; // Handle loading state
  if (error.reports) return <div>Error: {error.reports}</div>; // Handle error state

  return (
    <div className="bg-white w-full rounded-md shadow-md md:ml-14 ml-0 h-[290px] mt-0 overflow-auto">
      <Link
        className="text-blue-600 underline p-2 text-[12px] block hover:text-blue-800 hover:font-bold "
        to="case-reports">
        See all Reports
      </Link>
      {todayReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-gray-500 text-lg font-medium py-8 bg-gray-100 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mb-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6M9 8h.01M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
            />
          </svg>
          <p>No reports available today.</p>
        </div>
      ) : (
        <CaseReportList
          showFilter={false}
          reports={todayReports}
          hideButtons={true}
          titleStyle="text-[20px] text-center font-medium"
          nameStyle="text-xl text-red-600"
        />
      )}
    </div>
  );
};

export default LatestCaseReports;
