import PropTypes from "prop-types";
import { useState } from "react";
import {
  Table,
  Card,
  Button,
  Typography,
  Space,
  Alert,
  Tooltip,
  Tag,
  Avatar,
  Badge,
} from "antd";
import {
  DownloadOutlined,
  UserAddOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  DocumentArrowDownIcon,
  UserPlusIcon,
  UsersIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "../utils/formatDate";
import LawyersInCourtForm from "../pages/LawyersInCourtForm";
import { useAdminHook } from "../hooks/useAdminHook";
import PageErrorAlert from "./PageErrorAlert";

const { Title, Text } = Typography;

const SingleCauseList = ({
  causeListData,
  loadingCauseList,
  errorCauseList,
  addResultNumber,
  result,
  onDownloadCauseList,
  title,
  showDownloadBtn,
  hideButton,
  h1Style,
  loadingPdf,
  pdfError,
  cardWidth,
}) => {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const { isSuperOrAdmin } = useAdminHook();

  const getStatusColor = (adjournedFor) => {
    const status = adjournedFor?.toLowerCase();
    if (status?.includes("hearing")) return "red";
    if (status?.includes("judgment")) return "purple";
    if (status?.includes("trial")) return "orange";
    if (status?.includes("settlement")) return "green";
    return "blue";
  };

  if (pdfError) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-0 rounded-2xl">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentArrowDownIcon className="w-6 h-6 text-red-600" />
          </div>
          <Title level={4} className="text-red-700 mb-2">
            Download Failed
          </Title>
          <Text className="text-red-600 mb-4 block">
            {pdfError || "Failed to download document"}
          </Text>
          <Button
            type="primary"
            danger
            onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (errorCauseList) {
    return (
      <PageErrorAlert
        errorCondition={errorCauseList}
        errorMessage={errorCauseList}
      />
    );
  }

  const onRowClick = (record) => {
    if (isSuperOrAdmin) {
      setSelectedReportId(record.key);
    }
  };

  const columns = [
    {
      title: (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-600" />
          <span>Case</span>
        </div>
      ),
      dataIndex: "case",
      key: "case",
      render: (text) => (
        <Text strong className="text-gray-900 text-sm">
          {text}
        </Text>
      ),
      width: "25%",
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-orange-600" />
          <span>Adjourned For</span>
        </div>
      ),
      dataIndex: "adjournedFor",
      key: "adjournedFor",
      render: (text) => (
        <Tag color={getStatusColor(text)} className="text-xs font-medium">
          {text}
        </Tag>
      ),
      width: "20%",
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-green-600" />
          <span>Adjourned Date</span>
        </div>
      ),
      dataIndex: "adjournedDate",
      key: "adjournedDate",
      render: (text) => (
        <Text className="text-gray-700 text-sm font-medium">{text}</Text>
      ),
      width: "15%",
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-purple-600" />
          <span>Lawyers In Court</span>
        </div>
      ),
      dataIndex: "lawyersInCourt",
      key: "lawyersInCourt",
      render: (lawyersInCourt, record) => (
        <div className="space-y-2">
          {lawyersInCourt.length > 0 ? (
            <div className="space-y-1">
              {lawyersInCourt.slice(0, 2).map((lawyer, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Avatar
                    size="small"
                    className="bg-blue-500 text-white text-xs"
                    icon={<UsersIcon className="w-3 h-3" />}
                  />
                  <Text className="text-gray-700 text-xs capitalize">
                    {lawyer.firstName} {lawyer.lastName}
                    <Text type="secondary" className="ml-1">
                      Esq.
                    </Text>
                  </Text>
                </div>
              ))}
              {lawyersInCourt.length > 2 && (
                <Badge
                  count={`+${lawyersInCourt.length - 2} more`}
                  style={{ backgroundColor: "#6B7280" }}
                  className="text-xs"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Text type="warning" className="text-xs font-medium">
                ⚠️ Not Yet Assigned
              </Text>
            </div>
          )}
        </div>
      ),
      width: "30%",
    },
    !hideButton && {
      title: "Action",
      key: "action",
      render: (_, record) =>
        isSuperOrAdmin && (
          <div className="flex justify-center">
            {selectedReportId === record.key ? (
              <LawyersInCourtForm reportId={record.key} />
            ) : (
              <Tooltip title="Assign Lawyer To Court">
                <Button
                  type="primary"
                  size="small"
                  icon={<UserAddOutlined />}
                  className="bg-blue-600 hover:bg-blue-700 border-0 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReportId(record.key);
                  }}>
                  Assign
                </Button>
              </Tooltip>
            )}
          </div>
        ),
      width: "10%",
    },
  ].filter(Boolean);

  // Transform causeListData into a structure compatible with the Table component
  const data = causeListData?.map((report) => ({
    key: report._id,
    case: `${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`,
    adjournedFor: report?.adjournedFor,
    adjournedDate: formatDate(report?.adjournedDate),
    lawyersInCourt: report?.lawyersInCourt || [],
  }));

  return (
    <Card
      className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-200 rounded-2xl shadow-sm"
      styles={{
        body: { padding: "24px" },
      }}>
      <Space direction="vertical" size="large" className="w-full">
        {/* Header Section */}
        {addResultNumber && (
          <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileTextOutlined className="text-blue-600 text-lg" />
              </div>
              <Title level={2} className="m-0 text-gray-900" style={h1Style}>
                {title || `Cause List Summary`}
              </Title>
            </div>
            {result && (
              <div className="flex items-center justify-center gap-2">
                <Badge
                  count={result}
                  showZero
                  color="blue"
                  style={{ fontSize: "16px", padding: "0 12px" }}
                />
                <Text className="text-gray-600 text-lg">
                  case{result !== 1 ? "s" : ""} scheduled
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Table Section */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <Table
            onRow={(record) => ({
              onClick: () => onRowClick(record),
              className:
                "cursor-pointer hover:bg-blue-50/30 transition-colors duration-200",
            })}
            columns={columns}
            dataSource={data}
            loading={loadingCauseList}
            pagination={
              !hideButton && {
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} cases`,
              }
            }
            scroll={{ x: 800 }}
            size="middle"
            className="custom-table"
            styles={{
              header: {
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              },
            }}
          />
        </div>

        {/* Download Button */}
        {showDownloadBtn && (
          <div className="flex justify-center pt-4 border-t border-gray-200">
            <Button
              type="primary"
              size="large"
              loading={loadingPdf}
              icon={<DownloadOutlined />}
              onClick={onDownloadCauseList}
              className="bg-blue-600 hover:bg-blue-700 border-0 shadow-sm px-6 py-4 h-auto flex items-center gap-2 font-semibold">
              <DocumentArrowDownIcon className="w-5 h-5" />
              Download Cause List
            </Button>
          </div>
        )}
      </Space>
    </Card>
  );
};

// Prop type validation
SingleCauseList.propTypes = {
  causeListData: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      caseReported: PropTypes.shape({
        firstParty: PropTypes.shape({
          name: PropTypes.arrayOf(
            PropTypes.shape({
              name: PropTypes.string.isRequired,
            })
          ).isRequired,
        }).isRequired,
        secondParty: PropTypes.shape({
          name: PropTypes.arrayOf(
            PropTypes.shape({
              name: PropTypes.string.isRequired,
            })
          ).isRequired,
        }).isRequired,
        thirdParty: PropTypes.shape({
          name: PropTypes.arrayOf(
            PropTypes.shape({
              name: PropTypes.string,
            })
          ),
        }),
      }).isRequired,
      adjournedFor: PropTypes.string,
      adjournedDate: PropTypes.string,
      lawyersInCourt: PropTypes.arrayOf(
        PropTypes.shape({
          firstName: PropTypes.string.isRequired,
          lastName: PropTypes.string.isRequired,
        })
      ),
    })
  ),
  loadingCauseList: PropTypes.bool.isRequired,
  errorCauseList: PropTypes.string,
  addResultNumber: PropTypes.bool,
  result: PropTypes.number,
  onDownloadCauseList: PropTypes.func.isRequired,
  title: PropTypes.string,
  showDownloadBtn: PropTypes.bool,
  hideButton: PropTypes.bool,
  h1Style: PropTypes.object,
  loadingPdf: PropTypes.bool,
  pdfError: PropTypes.string,
  cardWidth: PropTypes.string,
};

SingleCauseList.defaultProps = {
  causeListData: [],
  addResultNumber: false,
  showDownloadBtn: false,
  hideButton: false,
  loadingPdf: false,
};

export default SingleCauseList;
