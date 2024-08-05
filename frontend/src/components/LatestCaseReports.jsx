import { useEffect, useState } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import CaseReportList from "./CaseReportList";
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

  if (loading.reports) return <div>Loading...</div>; // Handle loading state
  if (error.reports) return <div>Error: {error.reports}</div>; // Handle error state

  return (
    <div>
      <Link
        className="text-blue-600 underline p-2 text-[12px] block hover:text-blue-800 hover:font-bold "
        to="case-reports">
        See all Reports
      </Link>

      <CaseReportList
        showFilter={false}
        title="Today's Reports on Cases"
        reports={todayReports}
        hideButtons={true}
        titleStyle="text[20px] text-center font-medium"
        nameStyle="text-1xl text-red-600"
      />
    </div>
  );
};

export default LatestCaseReports;
