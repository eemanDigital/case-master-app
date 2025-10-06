import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Card, Typography, Empty, Tag, Modal, Badge } from "antd";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/formatDate";
import {
  DocumentTextIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const { Text } = Typography;

const LatestCaseReports = ({ reports, error, loading, fetchData }) => {
  const [todayReports, setTodayReports] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const getStatusColor = (adjournedFor) => {
    const status = adjournedFor?.toLowerCase();
    if (status?.includes("hearing")) return "blue";
    if (status?.includes("trial")) return "orange";
    if (status?.includes("judgment")) return "purple";
    if (status?.includes("settlement")) return "green";
    return "default";
  };

  const handleCardClick = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-0 rounded-2xl h-[400px] animate-pulse">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading today's reports...</div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-0 rounded-2xl h-[400px]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <DocumentTextIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-red-600">Failed to load reports</div>
            <Text type="secondary" className="mt-2">
              {error}
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                Today's Reports
              </span>
              <Badge
                count={todayReports.length}
                showZero
                color="blue"
                className="ml-2"
              />
            </div>
            <Link
              to="case-reports"
              className="flex items-center gap-1 text-gray-500 text-sm hover:text-blue-600 transition-colors">
              View All
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        }
        className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-200 rounded-2xl shadow-sm h-[400px] w-full flex flex-col"
        styles={{
          body: {
            padding: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}>
        {todayReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-6">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <div className="text-gray-600 font-medium mb-2">
                    No Case Reports Today
                  </div>
                  <div className="text-gray-500 text-sm">
                    No case reports have been filed for today
                  </div>
                </div>
              }
            />
            <Link
              to="case-reports"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              View All Reports
            </Link>
          </div>
        ) : (
          <>
            {/* Scrollable Reports List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[320px]">
              {todayReports.map((report, index) => (
                <div
                  key={report._id}
                  onClick={() => handleCardClick(report)}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all duration-200 group">
                  {/* Case Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <Text className="text-sm font-semibold text-gray-900 truncate">
                          {`${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`}
                        </Text>
                      </div>
                      <Tag
                        color={getStatusColor(report?.adjournedFor)}
                        className="text-xs">
                        {report?.adjournedFor}
                      </Tag>
                    </div>
                    <EyeIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                  </div>

                  {/* Report Preview */}
                  <div className="mb-3">
                    <Text className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                      {report?.update?.replace(/<[^>]+>/g, "")}
                    </Text>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-500">
                      <CalendarIcon className="w-3 h-3 text-blue-500" />
                      <span>
                        Adjourned: {formatDate(report?.adjournedDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500">
                      <UserIcon className="w-3 h-3 text-green-500" />
                      <span>
                        By:{" "}
                        {`${report?.reportedBy?.firstName} ${report?.reportedBy?.lastName}`}
                      </span>
                    </div>
                  </div>

                  {/* Separator */}
                  {index < todayReports.length - 1 && (
                    <div className="border-t border-gray-100 mt-4 pt-4">
                      <div className="w-3 h-3 bg-gray-200 rounded-full mx-auto -mt-6 relative z-10"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
              <Text className="text-gray-500 text-sm text-center block">
                {todayReports.length} report
                {todayReports.length !== 1 ? "s" : ""} today • Click any report
                to view details
              </Text>
            </div>
          </>
        )}
      </Card>

      {/* Full Report Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              Case Report Details
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl"
        styles={{
          body: {
            padding: 0,
            maxHeight: "70vh",
            overflow: "hidden",
          },
        }}>
        {selectedReport && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Case Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Link
                    to={`cases/${selectedReport.caseReported._id}/casedetails`}
                    className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors block mb-2">
                    {`${selectedReport?.caseReported?.firstParty?.name[0]?.name} vs ${selectedReport?.caseReported?.secondParty?.name[0]?.name}`}
                  </Link>
                  <Tag
                    color={getStatusColor(selectedReport?.adjournedFor)}
                    className="text-sm">
                    {selectedReport?.adjournedFor}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <Card className="border-0 shadow-sm">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                    Case Update
                  </h3>

                  {/* ✅ Render HTML properly */}
                  <div
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: selectedReport?.update,
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Case Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-orange-500" />
                  Case Schedule
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Adjourned Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(selectedReport?.adjournedDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Next Action:</span>
                    <Tag color={getStatusColor(selectedReport?.adjournedFor)}>
                      {selectedReport?.adjournedFor}
                    </Tag>
                  </div>
                </div>
              </Card>

              <Card className="border-0 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-green-500" />
                  Reporting Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Reported By:</span>
                    <span className="font-medium text-gray-900">
                      {`${selectedReport?.reportedBy?.firstName} ${selectedReport?.reportedBy?.lastName}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Report Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(selectedReport?.date)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                Close
              </button>
              <Link to={`cases/${selectedReport.caseReported._id}/casedetails`}>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  View Case Details
                </button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
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
