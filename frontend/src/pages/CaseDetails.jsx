import { useParams, Link, useNavigate } from "react-router-dom";
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
} from "antd";
import { FaDownload } from "react-icons/fa6";
import { RiDeleteBin2Line } from "react-icons/ri";
import CaseDocumentUpload from "../components/CaseDocumentUpload";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import useDeleteDocument from "../hooks/useDeleteDocument";
import { useAdminHook } from "../hooks/useAdminHook";
import useTextShorten from "../hooks/useTextShorten";
import LoadingSpinner from "../components/LoadingSpinner";

const { Text } = Typography;
const baseURL = import.meta.env.VITE_BASE_URL;

const CaseDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isStaff } = useAdminHook();
  const { shortenText } = useTextShorten();
  const navigate = useNavigate();
  const { handleDeleteDocument, documents } = useDeleteDocument(
    data?.data,
    "caseData"
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    dataFetcher(`cases/${id}`, "GET");
  }, [id]);

  // pagination handler for case history
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  // loading and error state
  if (loading) return <LoadingSpinner />;
  if (error) return <p>Error loading data</p>;

  const paginatedReports = data?.data?.reports?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Define columns for the document table
  const columns = [
    {
      title: "File Name",
      dataIndex: "fileName",
      key: "fileName",
      render: (text) => <span className="text-gray-800">{text}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<FaDownload />}
            onClick={(event) =>
              handleGeneralDownload(
                event,
                `${baseURL}/cases/${id}/documents/${record._id}/download`,
                record.fileName
              )
            }>
            Download
          </Button>
          {isStaff && (
            <Button
              type="link"
              danger
              icon={<RiDeleteBin2Line />}
              onClick={(event) =>
                Modal.confirm({
                  title: "Are you sure you want to delete this document?",
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between mb-6">
        <Link to="../..">
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </Link>
        {isStaff && <CaseDocumentUpload caseId={id} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Case details section */}
          <Card title="Case Details" className="shadow-md">
            <List
              itemLayout="horizontal"
              dataSource={[
                { label: "SUIT NO:", value: data?.data?.suitNo },
                {
                  label: "Filing Date:",
                  value:
                    data?.data?.filingDate &&
                    formatDate(data?.data?.filingDate),
                },
                { label: "Case Summary:", value: data?.data?.caseSummary },
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
                { label: "Court:", value: data?.data?.courtName },
                { label: "Court No:", value: data?.data?.courtNo },
                { label: "Court Location:", value: data?.data?.location },
                { label: "State:", value: data?.data?.state },
                { label: "Case Status:", value: data?.data?.caseStatus },
                { label: "Case Category:", value: data?.data?.category },
                {
                  label: "Case Priority/Ratings:",
                  value: data?.data?.casePriority,
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.label}</Text>}
                    description={
                      item.value || (
                        <span className="text-red-500">Not provided</span>
                      )
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Document table section */}
          <Card title="Attached Documents" className="shadow-md">
            <Table
              columns={columns}
              dataSource={documents}
              rowKey={(record) => record._id}
              pagination={false}
              className="w-full"
              scroll={{ x: true }}
            />
          </Card>
        </div>

        <div className="space-y-6">
          {/* Case history section */}
          <Card title="Case History" className="shadow-md">
            {Array.isArray(data?.data?.reports) &&
            data?.data?.reports.length > 0 ? (
              <>
                <List
                  itemLayout="vertical"
                  dataSource={paginatedReports}
                  renderItem={(u) => (
                    <List.Item key={u._id}>
                      <List.Item.Meta
                        title={<Text strong>{formatDate(u.date)}</Text>}
                        description={
                          <>
                            <p>
                              <Text strong>Update:</Text>{" "}
                              {shortenText(u.update, 150, u._id)}
                            </p>
                            <p>
                              <Text strong>Next Adjourned Date:</Text>{" "}
                              {u.adjournedDate ? (
                                formatDate(u.adjournedDate)
                              ) : (
                                <span className="text-red-500">
                                  Not provided
                                </span>
                              )}
                            </p>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={data?.data?.reports.length}
                  onChange={handlePageChange}
                  className="mt-4"
                />
              </>
            ) : (
              <Empty description="No case history available." />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
