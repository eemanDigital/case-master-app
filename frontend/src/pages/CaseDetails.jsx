import { useParams } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect, useState } from "react";
import { formatDate } from "../utils/formatDate";
import {
  Button,
  Typography,
  Card,
  List,
  Modal,
  Pagination,
  Empty,
  Table,
  Space,
  Tag,
  Avatar,
  Divider,
  Tabs,
  Row,
  Col,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  UserOutlined,
  FileTextOutlined,
  HistoryOutlined,
  TeamOutlined,
  CalendarOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import {
  DocumentArrowDownIcon,
  TrashIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClockIcon,
  ScaleIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import CaseDocumentUpload from "../components/CaseDocumentUpload";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import useDeleteDocument from "../hooks/useDeleteDocument";
import { useAdminHook } from "../hooks/useAdminHook";
import useTextShorten from "../hooks/useTextShorten";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import MajorHeading from "../components/MajorHeading";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const baseURL = import.meta.env.VITE_BASE_URL;

const CaseDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isStaff } = useAdminHook();
  const { shortenText } = useTextShorten();
  const { handleDeleteDocument, documents } = useDeleteDocument(
    data?.data,
    "caseData"
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [activeTab, setActiveTab] = useState("details");

  useRedirectLogoutUser("/users/login");

  // fetch case data
  useEffect(() => {
    dataFetcher(`cases/${id}`, "GET");
  }, [id, dataFetcher]);

  // pagination handler for case history
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  // loading and error state
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;
  }

  // Paginate the reports
  const paginatedReports = data?.data?.reports?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Define columns for the document table
  const columns = [
    {
      title: (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-600" />
          <span>File Name</span>
        </div>
      ),
      dataIndex: "fileName",
      key: "fileName",
      render: (text) => (
        <Text className="text-gray-800 font-medium">{text}</Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={(event) =>
              handleGeneralDownload(
                event,
                `${baseURL}/cases/${id}/documents/${record._id}/download`,
                record.fileName
              )
            }
            className="bg-blue-600 hover:bg-blue-700 border-0">
            Download
          </Button>
          {isStaff && (
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(event) =>
                Modal.confirm({
                  title: "Delete Document",
                  content:
                    "Are you sure you want to delete this document? This action cannot be undone.",
                  okText: "Delete",
                  okType: "danger",
                  cancelText: "Cancel",
                  onOk: () =>
                    handleDeleteDocument(
                      event,
                      `cases/${id}/documents/${record._id}`,
                      record._id
                    ),
                })
              }>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "processing";
      case "pending":
        return "warning";
      case "decided":
        return "success";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  // Data sections from original component
  const caseDetailsList = [
    { label: "Suit No:", value: data?.data?.suitNo },
    {
      label: "Filing Date:",
      value: data?.data?.filingDate && formatDate(data?.data?.filingDate),
    },
    // {
    //   label: "Case Summary:",
    //   value: shortenText(data?.data?.caseSummary, 150, "caseSummary"),
    // },
    {
      label: "Mode Of Commencement:",
      value: data?.data?.modeOfCommencement,
    },
    {
      label: "Filed By the Office:",
      value: data?.data?.isFiledByTheOffice ? "Yes" : "No",
    },
    {
      label: "Office Case File No:",
      value: data?.data?.caseOfficeFileNo,
    },
    { label: "Nature of Case:", value: data?.data?.natureOfCase },
    {
      label: "Court:",
      value: `${data?.data?.courtName}, ${data?.data?.courtNo} `,
    },
    {
      label: "Court Location:",
      value: `${data?.data?.location}, ${data?.data?.state}`,
    },
    { label: "Case Status:", value: data?.data?.caseStatus },
    { label: "Case Category:", value: data?.data?.category },
    {
      label: "Case Priority/Ratings:",
      value: data?.data?.casePriority,
    },
  ];

  const analysisSections = [
    { title: "Judge", data: data?.data?.judge, keyProp: "name" },
    {
      title: "Case Strength",
      data: data?.data?.caseStrengths,
      keyProp: "name",
    },
    {
      title: "Case Weaknesses",
      data: data?.data?.caseWeaknesses,
      keyProp: "name",
    },
    {
      title: "Steps to be Taken",
      data: data?.data?.stepToBeTaken,
      keyProp: "name",
    },
    {
      title: "Account Officer(s)",
      data: data?.data?.accountOfficer,
      keyProp: "firstName",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <GoBackButton />
            <div>
              <Title level={2} className="m-0 text-gray-900">
                Case Details
              </Title>
              <Text className="text-gray-500">
                {data?.data?.suitNo || "Case Management"}
              </Text>
            </div>
          </div>
          {isStaff && <CaseDocumentUpload caseId={id} />}
        </div>

        {/* Parties Section */}
        <Card className="mb-6 border-0 rounded-2xl shadow-sm bg-gradient-to-br from-white to-blue-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: data?.data?.firstParty.description,
                names: data?.data?.firstParty?.name,
              },
              {
                title: data?.data?.secondParty.description,
                names: data?.data?.secondParty?.name,
              },
              ...(data?.data?.otherParty || []).map((party) => ({
                title: party.description,
                names: party.name,
              })),
            ].map((party, partyIndex) => (
              <div
                key={partyIndex}
                className="text-center p-4 bg-white rounded-xl border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserGroupIcon className="w-6 h-6 text-blue-600" />
                </div>
                <Title level={4} className="text-gray-900 mb-3">
                  {party.title}
                </Title>
                <div className="space-y-2">
                  {party.names?.map((name, nameIndex) => (
                    <div
                      key={name?._id || nameIndex}
                      className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                        {nameIndex + 1}
                      </div>
                      <Text className="text-gray-800 font-semibold">
                        {name.name}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="bg-white rounded-2xl shadow-sm border border-gray-200"
          items={[
            {
              key: "details",
              label: (
                <div className="flex items-center gap-2">
                  <FileTextOutlined />
                  <span>Case Details</span>
                </div>
              ),
              children: (
                <div className="space-y-6">
                  {/* Basic Case Information */}
                  <Card className="border-0 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <ScaleIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <Title level={3} className="m-0 text-gray-900">
                        Case Information
                      </Title>
                    </div>

                    <Row gutter={[16, 16]}>
                      {caseDetailsList.map((item, index) => (
                        <Col xs={24} md={12} key={index}>
                          <div className="flex justify-between  items-center p-3 bg-gray-50 rounded-lg">
                            <Text className="font-medium text-gray-700">
                              {item.label}
                            </Text>
                            <Text className="font-semibold text-gray-900 ">
                              {item.value || (
                                <Text type="secondary" italic>
                                  Not provided
                                </Text>
                              )}
                            </Text>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    {/* Case Summary */}
                    {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileTextOutlined className="text-blue-600" />
                        <Text className="font-medium text-gray-700">
                          Case Summary:
                        </Text>
                      </div>
                      <Text
                        className="text-gray-800 leading-relaxed whitespace-pre-line block"
                        style={{ wordBreak: "break-word" }}>
                        {data?.data?.caseSummary
                          ? shortenText(
                              data?.data?.caseSummary,
                              150,
                              "caseSummary"
                            )
                          : "No summary provided"}
                      </Text>
                    </div> */}

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FileTextOutlined className="text-blue-600" />
                        <Text className="font-medium text-gray-700">
                          Case Summary:
                        </Text>
                      </div>
                      <Text
                        className="text-gray-800 leading-relaxed whitespace-pre-line block"
                        style={{ wordBreak: "break-word" }}>
                        {data?.data?.caseSummary
                          ? shortenText(
                              data?.data?.caseSummary,
                              150,
                              "caseSummary"
                            )
                          : "No summary provided"}
                      </Text>
                    </div>
                  </Card>

                  {/* Case Analysis Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Strengths & Weaknesses */}
                    <div className="space-y-6">
                      {/* Case Strengths */}
                      <Card className="border-0 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircleOutlined className="text-green-600" />
                          </div>
                          <Title level={4} className="m-0 text-gray-900">
                            Case Strengths
                          </Title>
                        </div>
                        {data?.data?.caseStrengths?.length > 0 ? (
                          <div className="space-y-2">
                            {data.data.caseStrengths.map((strength, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mt-0.5">
                                  {index + 1}
                                </div>
                                <Text className="text-gray-800 font-medium">
                                  {strength.name}
                                </Text>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Text type="secondary" italic>
                            No strengths identified
                          </Text>
                        )}
                      </Card>

                      {/* Case Weaknesses */}
                      <Card className="border-0 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                          </div>
                          <Title level={4} className="m-0 text-gray-900">
                            Case Weaknesses
                          </Title>
                        </div>
                        {data?.data?.caseWeaknesses?.length > 0 ? (
                          <div className="space-y-2">
                            {data.data.caseWeaknesses.map((weakness, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mt-0.5">
                                  {index + 1}
                                </div>
                                <Text className="text-gray-800 font-medium">
                                  {weakness.name}
                                </Text>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Text type="secondary" italic>
                            No weaknesses identified
                          </Text>
                        )}
                      </Card>
                    </div>

                    {/* Right Column - Judge, Steps, Team */}
                    <div className="space-y-6">
                      {/* Judge Information */}
                      <Card className="border-0 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <UserOutlined className="text-purple-600" />
                          </div>
                          <Title level={4} className="m-0 text-gray-900">
                            Judge Information
                          </Title>
                        </div>
                        {data?.data?.judge?.length > 0 ? (
                          <div className="space-y-3">
                            {data.data.judge.map((judge, index) => (
                              <div
                                key={index}
                                className="p-3 bg-purple-50 rounded-lg">
                                <Text className="font-semibold text-gray-900 block">
                                  {judge.name}
                                </Text>
                                {judge.notes && (
                                  <Text className="text-gray-600 text-sm mt-1 block">
                                    {judge.notes}
                                  </Text>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Text type="secondary" italic>
                            No judge assigned
                          </Text>
                        )}
                      </Card>

                      {/* Steps to be Taken */}
                      <Card className="border-0 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <LightBulbIcon className="w-5 h-5 text-orange-600" />
                          </div>
                          <Title level={4} className="m-0 text-gray-900">
                            Steps to be Taken
                          </Title>
                        </div>
                        {data?.data?.stepToBeTaken?.length > 0 ? (
                          <div className="space-y-2">
                            {data.data.stepToBeTaken.map((step, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mt-0.5">
                                  {index + 1}
                                </div>
                                <Text className="text-gray-800 font-medium">
                                  {step.name}
                                </Text>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Text type="secondary" italic>
                            No steps defined
                          </Text>
                        )}
                      </Card>

                      {/* Legal Team */}
                      <Card className="border-0 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <TeamOutlined className="text-blue-600" />
                          </div>
                          <Title level={4} className="m-0 text-gray-900">
                            Legal Team
                          </Title>
                        </div>
                        <div className="space-y-3">
                          {data?.data?.accountOfficer?.map((officer, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                              <Avatar
                                src={officer?.photo}
                                icon={<UserOutlined />}
                                className="bg-blue-500"
                              />
                              <div className="flex-1">
                                <Text className="font-semibold text-gray-900 block">
                                  {officer.firstName} {officer.lastName}
                                </Text>
                                <Text className="text-gray-500 text-sm">
                                  {officer.email}
                                </Text>
                              </div>
                            </div>
                          ))}
                          {(!data?.data?.accountOfficer ||
                            data?.data?.accountOfficer.length === 0) && (
                            <Text type="secondary" italic>
                              No legal team assigned
                            </Text>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Client and General Comment */}
                  <Card className="border-0 rounded-2xl shadow-sm">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <div className="flex items-center gap-3 mb-3">
                          <UserOutlined className="text-blue-600" />
                          <Title level={4} className="m-0 text-gray-900">
                            Client Information
                          </Title>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Text className="font-semibold text-gray-900">
                            {data?.data?.client?.firstName}{" "}
                            {data?.data?.client?.secondName || ""}
                          </Text>
                          {data?.data?.client?.email && (
                            <Text className="text-gray-500 text-sm block mt-1">
                              {data.data.client.email}
                            </Text>
                          )}
                        </div>
                      </Col>
                      <Col xs={24} md={12}>
                        <div className="flex items-center gap-3 mb-3">
                          <FileTextOutlined className="text-green-600" />
                          <Title level={4} className="m-0 text-gray-900">
                            General Comment
                          </Title>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Text className="text-gray-800">
                            {data?.data?.generalComment ||
                              "No comments provided"}
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </div>
              ),
            },
            {
              key: "documents",
              label: (
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Documents ({documents.length})</span>
                </div>
              ),
              children: (
                <Card className="border-0 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <Title level={3} className="m-0 text-gray-900">
                      Case Documents
                    </Title>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={documents}
                    rowKey={(record) => record._id}
                    pagination={false}
                    className="w-full custom-table"
                    scroll={{ x: true }}
                  />
                </Card>
              ),
            },
            {
              key: "history",
              label: (
                <div className="flex items-center gap-2">
                  <HistoryOutlined />
                  <span>Case History</span>
                </div>
              ),
              children: (
                <Card className="border-0 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <HistoryOutlined className="text-purple-600" />
                    </div>
                    <Title level={3} className="m-0 text-gray-900">
                      Case History & Reports
                    </Title>
                  </div>

                  {Array.isArray(data?.data?.reports) &&
                  data?.data?.reports.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {paginatedReports.map((report) => (
                          <div
                            key={report._id}
                            className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                              <CalendarOutlined className="text-blue-600" />
                              <Text strong className="text-lg text-gray-900">
                                {formatDate(report.date)}
                              </Text>
                            </div>
                            <div className="space-y-2">
                              <Text className="text-gray-700 leading-relaxed">
                                {shortenText(report.update, 200, report._id)}
                              </Text>
                              {report.adjournedDate && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <ClockIcon className="w-4 h-4" />
                                  <Text>
                                    Next adjourned date:{" "}
                                    {formatDate(report.adjournedDate)}
                                  </Text>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <Pagination
                          current={currentPage}
                          pageSize={pageSize}
                          total={data?.data?.reports.length}
                          onChange={handlePageChange}
                          showSizeChanger
                          showTotal={(total, range) =>
                            `${range[0]}-${range[1]} of ${total} reports`
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <Empty
                      description="No case history available"
                      className="py-12"
                    />
                  )}
                </Card>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default CaseDetails;
