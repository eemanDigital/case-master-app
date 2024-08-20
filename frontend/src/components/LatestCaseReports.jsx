import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import CaseReportList from "./CaseReportList";
import LoadingSpinner from "./LoadingSpinner";
import { Link } from "react-router-dom";
import PageErrorAlert from "./PageErrorAlert";

const LatestCaseReports = ({ reports, error, loading, fetchData }) => {
  // const { reports, loading, error, fetchData } = useDataGetterHook();
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

  return (
    <>
      {error.reports ? (
        <PageErrorAlert
          errorCondition={error.reports}
          errorMessage={error.reports}
        />
      ) : (
        <div className="bg-white  rounded-md shadow-md   h-[362px] m-2  overflow-auto">
          <Link
            className="text-blue-600 underline p-2 text-[12px] block hover:text-blue-800 hover:font-bold"
            to="case-reports">
            See all Reports
          </Link>
          <h1 className=" text-center font-medium">Today&apos;s Case Report</h1>
          {todayReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 text-lg font-medium bg-gray-100 rounded-md p-4">
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
              titleStyle="text-[20px]  text-center font-medium"
              nameStyle=" w-80  text-red-600"
              cardStyle=""
            />
          )}
        </div>
      )}
    </>
  );
};

LatestCaseReports.propTypes = {
  reports: PropTypes.array.isRequired,
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  fetchData: PropTypes.func.isRequired,
};

export default LatestCaseReports;
