import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Card, Space, Typography, Spin, Empty } from "antd";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/formatDate";
import useTextShorten from "../hooks/useTextShorten";

const { Text } = Typography;

const LatestCaseReports = ({ reports, error, loading, fetchData }) => {
  const [todayReports, setTodayReports] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const { shortenText } = useTextShorten();

  const isToday = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

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

  useEffect(() => {
    if (hasFetched && Array.isArray(reports)) {
      const filteredReports = reports?.filter((report) =>
        isToday(report?.date)
      );
      setTodayReports(filteredReports);
    }
  }, [hasFetched, reports]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        Loading Today's Case Report...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Text type="danger">{error || "Unable to fetch reports"}</Text>
      </div>
    );
  }

  if (todayReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] rounded-md py-6">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text className="text-lg font-semibold text-gray-600 text-center">
              No Case Reports Available Today
            </Text>
          }
        />
        <Link to="case-reports" className="text-blue-500 underline mt-4">
          View all case reports
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-md h-[300px] overflow-y-auto custom-scrollbar bg-gradient-to-r from-gray-100 to-gray-200 p-4">
      {todayReports.map((report) => (
        <Card
          key={report._id}
          className="w-full font-poppins shadow-md hover:shadow-lg transition-shadow duration-300 mb-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg border border-gray-300"
          title={
            <h2 className="text-lg font-semibold text-gray-700 truncate sm:text-base md:text-lg lg:text-xl w-full">
              {`${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`}
            </h2>
          }>
          <Space direction="vertical" size="middle" className="w-full">
            <Text className="text-gray-700 text-justify">
              {shortenText(report?.update, 300, report._id)}
            </Text>
            <Space
              direction="horizontal"
              size="large"
              className="w-full justify-between flex-wrap">
              <Text strong>
                Adjourned For:{" "}
                <span className="text-rose-600">{report?.adjournedFor}</span>
              </Text>
              <Text strong>
                Adjourned Date:{" "}
                <span className="text-blue-500">
                  {formatDate(report?.adjournedDate)}
                </span>
              </Text>
              <Text strong>
                Reported By:{" "}
                <span className="text-gray-800">
                  {`${report?.reportedBy?.firstName} ${report?.reportedBy?.lastName}`}
                </span>
              </Text>
            </Space>
          </Space>
        </Card>
      ))}
      <Link
        className="text-blue-600 underline p-2 text-sm block hover:text-blue-800 font-semibold text-center"
        to="case-reports">
        See all Reports
      </Link>
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
