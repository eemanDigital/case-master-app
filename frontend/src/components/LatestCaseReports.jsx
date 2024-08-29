import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import CaseReportList from "./CaseReportList";
import LoadingSpinner from "./LoadingSpinner";
import { Link } from "react-router-dom";
import PageErrorAlert from "./PageErrorAlert";

const LatestCaseReports = ({ reports, error, loading, fetchData }) => {
  const [todayReports, setTodayReports] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  // Check if a date is today
  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  //  Fetch reports
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
  }, [fetchData]);

  //  Filter reports for today
  useEffect(() => {
    if (hasFetched && Array.isArray(reports)) {
      const filteredReports = reports?.filter((report) =>
        isToday(report?.date)
      );
      setTodayReports(filteredReports);
    }
  }, [hasFetched, reports]);

  if (loading)
    return (
      <div>
        <p>Loading...</p>
      </div>
    );

  if (error) {
    return <div>{error || "Unable to fetch report"}</div>;
  }

  // If there are no reports for today  display a message
  if (todayReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] rounded-md  py-6">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 15a4 4 0 01-4-4V7a4 4 0 014-4h18a4 4 0 014 4v4a4 4 0 01-4 4H3z"></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 21h8M12 17v4"></path>
        </svg>
        <p className="text-lg font-semibold text-gray-600 text-center">
          No Case Reports Available Today
        </p>
        <p className="text-sm text-gray-500 text-center mt-2">
          Please check back later for updates or{" "}
          <Link to="case-reports" className="text-blue-500 underline">
            view all case reports.
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md  h-[300px] overflow-y-scroll custom-scrollbar">
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
