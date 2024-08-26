import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import CaseReportList from "./CaseReportList";
import LoadingSpinner from "./LoadingSpinner";
import { Link } from "react-router-dom";
import PageErrorAlert from "./PageErrorAlert";

const LatestCaseReports = ({ reports, error, loading, fetchData }) => {
  const [todayReports, setTodayReports] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  // const title = (
  //   <h2 className="bg-gradient-to-r from-blue-600 to-blue-800 text-white text-lg sm:text-xl md:text-2xl font-semibold py-3 px-4 text-center">
  //     Today's Case Report
  //   </h2>
  // );
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
    if (hasFetched && Array.isArray(reports)) {
      const filteredReports = reports?.filter((report) =>
        isToday(report?.date)
      );
      setTodayReports(filteredReports);
    }
  }, [hasFetched, reports]); // Runs when fetch is complete and reports are updated

  if (loading.reports) return <LoadingSpinner />; // Handle loading state

  if (error.reports) {
    return (
      <PageErrorAlert
        errorCondition={error.reports}
        errorMessage={error.reports}
      />
    );
  }

  if (todayReports.length === 0) {
    return null; // Return nothing if no reports are available today
  }

  return (
    <div className="bg-white rounded-md shadow-md h-[408px]  overflow-auto">
      <Link
        className="text-blue-600 underline p-2 text-[12px] block hover:text-blue-800 hover:font-bold"
        to="case-reports">
        See all Reports
      </Link>
      <CaseReportList
        showFilter={false}
        reports={todayReports}
        hideButtons={true}
        titleStyle="text-[20px] text-center font-medium"
        nameStyle="w-80 text-red-600"
        title=""
      />
    </div>
  );
};

LatestCaseReports.propTypes = {
  reports: PropTypes.array.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
};

export default LatestCaseReports;
