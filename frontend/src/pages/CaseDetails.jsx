import { useParams, useNavigate } from "react-router-dom";
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
import PageErrorAlert from "../components/PageErrorAlert";

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

  // fetch case data
  useEffect(() => {
    dataFetcher(`cases/${id}`, "GET");
  }, [id]);

  // pagination handler for case history
  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  // loading and error state
  if (loading) {
    <LoadingSpinner />;
  }

  // Paginate the reports
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
    <>
      {error ? (
        <PageErrorAlert errorCondition={error} errorMessage={error} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between mb-6">
            <Button onClick={() => navigate(-1)}>Go Back</Button>

            {isStaff && <CaseDocumentUpload caseId={id} />}
          </div>
          <div className="m-4 bg-white  text-gray-800 p-6 rounded-lg shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h1 className="text-xl font-bold mb-4">
                  {data?.data?.firstParty.description}
                </h1>
                {data?.data?.firstParty?.name?.map((singleName, index) => (
                  <div key={singleName?._id || index} className="mb-2">
                    <span className="font-semibold text-[20px]">
                      {index + 1}.{" "}
                    </span>
                    <span>{singleName.name}</span>
                  </div>
                ))}
              </div>
              <div>
                <h1 className="text-xl font-bold mb-4">
                  {data?.data?.secondParty.description}
                </h1>
                {data?.data?.secondParty?.name?.map((singleName, index) => (
                  <div key={singleName?._id || index} className="mb-2">
                    <span className="font-semibold">{index + 1}. </span>
                    <span>{singleName.name}</span>
                  </div>
                ))}
              </div>
              <div>
                {data?.data?.otherParty.map((singleParty, index) => (
                  <div key={singleParty.description || index} className="mb-6">
                    <h1 className="text-xl font-bold mb-4">
                      {singleParty.description}
                    </h1>
                    {singleParty?.name?.map((n, idx) => (
                      <div key={n?._id || idx} className="mb-2">
                        <span className="font-semibold">{idx + 1}. </span>
                        <span>{n.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Case details section */}
              <Card title="Case Details" className="shadow-md p-4">
                <List
                  itemLayout="vertical"
                  dataSource={[
                    { label: "SUIT NO:", value: data?.data?.suitNo },
                    {
                      label: "Filing Date:",
                      value:
                        data?.data?.filingDate &&
                        formatDate(data?.data?.filingDate),
                    },
                    {
                      label: "Case Summary:",
                      value: shortenText(
                        data?.data?.caseSummary,
                        150,
                        "caseSummary"
                      ),
                    },
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
                    {
                      label: "Nature of Case:",
                      value: data?.data?.natureOfCase,
                    },
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
                    <List.Item className="border-b border-gray-200 py-2">
                      <List.Item.Meta
                        title={
                          <Text className="text-gray-800  font-poppins font-medium">
                            {item.label}
                          </Text>
                        }
                        description={
                          item.value ? (
                            <span className="text-gray-800  font-poppins  capitalize">
                              {item.value}
                            </span>
                          ) : (
                            <span className="text-red-500">Not provided</span>
                          )
                        }
                      />
                    </List.Item>
                  )}
                />

                <div className="p-6 rounded-lg ">
                  <div className="mb-4">
                    {data?.data?.judge.map((j, index) => (
                      <p
                        key={j?._id || index}
                        className="font-semibold text-[20px] ">
                        Judge:{" "}
                        {j.name || (
                          <span className="text-red-500 font-semibold text-[20px]">
                            Not provided
                          </span>
                        )}
                      </p>
                    ))}
                  </div>

                  <div className="mb-4">
                    <h1 className="text-xl  mb-2">Case Strength</h1>
                    <ul className="list-disc list-inside">
                      {data?.data?.caseStrengths?.map((item, index) => (
                        <li key={item?._id || index} className="mb-1">
                          {item?.name || (
                            <span className="text-red-500 font-semibold text-[20px]">
                              Not provided
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h1 className="text-xl  mb-2">Case Weaknesses</h1>
                    <ul className="list-disc list-inside">
                      {data?.data?.caseWeaknesses?.map((item, index) => (
                        <li key={item?._id || index} className="mb-1">
                          {item?.name || (
                            <span className="text-red-500 font-semibold text-[20px]">
                              Not provided
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h1 className="text-xl  mb-2">Steps to be Taken</h1>
                    {Array.isArray(data?.data?.stepToBeTaken) &&
                    data?.data?.stepToBeTaken.length > 0 ? (
                      data?.data?.stepToBeTaken.map((step, index) => (
                        <p
                          key={step?._id || index}
                          className="font-semibold text-[20px]">
                          {step.name || (
                            <span className="text-red-500 font-semibold text-[20px]">
                              Not provided
                            </span>
                          )}
                        </p>
                      ))
                    ) : (
                      <p className="font-semibold text-[20px]">
                        <span className="text-red-500 font-semibold text-[20px]">
                          No steps to be taken are provided.
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <h1 className="text-xl  mb-2">Account Officer(s)</h1>
                    <ul className="list-disc list-inside">
                      {data?.data?.accountOfficer?.map((item, index) => (
                        <li key={item?._id || index} className="mb-1">
                          {`${item.firstName} ${item.lastName}` || (
                            <span className="text-red-500 font-semibold text-[20px]">
                              No Account Officer
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h1 className="text-xl  mb-2">Client</h1>
                    <p>
                      {data?.data?.client?.firstName}{" "}
                      {data?.data?.client?.secondName || ""}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h1 className="text-xl  mb-2">General Comment</h1>
                    <p>{shortenText(data?.data?.generalComment)}</p>
                  </div>
                </div>
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
      )}
    </>
  );
};

export default CaseDetails;
