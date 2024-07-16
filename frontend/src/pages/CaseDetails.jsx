import { useParams, Link } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect, useState } from "react";
import { formatDate } from "../utils/formatDate";
import {
  Button,
  Divider,
  Typography,
  Row,
  Col,
  Card,
  List,
  Modal,
  Pagination,
  Empty,
} from "antd";
import { FaDownload } from "react-icons/fa6";
import { RiDeleteBin2Line } from "react-icons/ri";
import CaseDocumentUpload from "../components/CaseDocumentUpload";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import useDeleteDocument from "../hooks/useDeleteDocument";
import { useAdminHook } from "../hooks/useAdminHook";
import useTextShorten from "../hooks/useTextShorten";

const { Title, Text } = Typography;
const baseURL = import.meta.env.VITE_BASE_URL;

const CaseDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isStaff } = useAdminHook();
  const { shortenText } = useTextShorten();
  // const [showFullText, setShowFullText] = useState({}); // State to manage update display

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
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data</p>;

  const paginatedReports = data?.data?.reports?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <div className="flex justify-between">
        <Link to="../..">
          <Button type="link">Go Back to case lists</Button>
        </Link>

        {/* case file upload */}
        {isStaff && <CaseDocumentUpload caseId={id} />}
      </div>

      <section className="flex justify-between   flex-col md:flex-row gap-4 mx-4 my-2">
        <div className="w-[500px]">
          <div className="my-4">
            <Row justify="space-between">
              <Col>
                <h1>{data?.data?.firstParty.description}</h1>
                {data?.data?.firstParty?.name?.map((singleName, index) => (
                  <div key={singleName?._id || index}>
                    <Text strong>{index + 1}. </Text>
                    <Text>{singleName.name}</Text>
                  </div>
                ))}
              </Col>
              <Col>
                <h1>{data?.data?.secondParty.description}</h1>
                {data?.data?.secondParty?.name?.map((singleName, index) => (
                  <div key={singleName?._id || index}>
                    <Text strong>{index + 1}. </Text>
                    <Text>{singleName.name}</Text>
                  </div>
                ))}
              </Col>
              <Col>
                {data?.data?.otherParty.map((singleParty, index) => (
                  <Card
                    key={singleParty.description || index}
                    title={singleParty.description}>
                    {singleParty?.name?.map((n, idx) => (
                      <div key={n?._id || idx}>
                        <Text strong>{idx + 1}. </Text>
                        <Text>{n.name}</Text>
                      </div>
                    ))}
                  </Card>
                ))}
              </Col>
            </Row>
          </div>

          <Divider />

          <div className="mt-3">
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
              renderItem={(item, index) => (
                <List.Item key={index}>
                  <Text strong>{item.label}</Text> {item.value}
                </List.Item>
              )}
            />
            <Divider />
            {data?.data?.judge.map((j, index) => (
              <Text key={j?._id || index} strong>
                Judge:{" "}
                {j.name || (
                  <span className="text-red-500 font-semibold">
                    Not provided
                  </span>
                )}
              </Text>
            ))}
            <Title level={4}>Case Strength</Title>
            <List
              dataSource={data?.data?.caseStrengths || []}
              renderItem={(item, index) => (
                <List.Item key={item?._id || index}>
                  <Text>
                    {item?.name || (
                      <span className="text-red-500 font-semibold">
                        Not provided
                      </span>
                    )}
                  </Text>
                </List.Item>
              )}
            />
            <Title level={4}>Case Weaknesses</Title>
            <List
              dataSource={data?.data?.caseWeaknesses || []}
              renderItem={(item, index) => (
                <List.Item key={item?._id || index}>
                  <Text>
                    {item?.name || (
                      <span className="text-red-500 font-semibold">
                        Not provided
                      </span>
                    )}
                  </Text>
                </List.Item>
              )}
            />
            <Divider />
            {Array.isArray(data?.data?.stepToBeTaken) &&
            data?.data?.stepToBeTaken.length > 0 ? (
              data?.data?.stepToBeTaken.map((step, index) => (
                <Text key={step?._id || index} strong>
                  Steps to be taken:{" "}
                  {step.name || (
                    <span className="text-red-500 font-semibold">
                      Not provided
                    </span>
                  )}
                </Text>
              ))
            ) : (
              <Text strong>
                <span className="text-red-500 font-semibold">
                  No steps to be taken are provided.
                </span>
              </Text>
            )}
            <Title level={4}>Account Officer </Title>
            <List
              dataSource={data?.data?.accountOfficer || []}
              renderItem={(item, index) => (
                <List.Item key={item?._id || index}>
                  <Text>
                    {item.fullName || (
                      <span className="text-red-500 font-semibold">
                        No Account Officer
                      </span>
                    )}
                  </Text>
                </List.Item>
              )}
            />
            <Divider />
            <Title level={4}>Client</Title>
            <Text>{data?.data?.client?.fullName}</Text>
            <Divider />
            <Text strong>General Comment: </Text> {data?.data?.generalComment}
          </div>

          <Title level={2} className="text-gray-700 mt-4">
            Attached Documents
          </Title>
          <div>
            <List
              dataSource={documents}
              renderItem={(document, index) => (
                <List.Item
                  key={document?._id || index}
                  className="flex gap-4 items-center p-7 bg-gray-200 hover:bg-gray-100 rounded-md">
                  <Text className="flex-1">{document?.fileName}</Text>
                  <button
                    aria-label={`Download ${document?.fileName}`}
                    className="p-2 text-2xl text-gray-500 hover:text-gray-700"
                    onClick={(event) =>
                      handleGeneralDownload(
                        event,
                        `${baseURL}/cases/${id}/documents/${document._id}/download`,
                        document.fileName
                      )
                    }>
                    <FaDownload />
                  </button>

                  <button
                    aria-label={`Delete ${document?.fileName}`}
                    className="p-2 p-2 text-2xl text-red-500 hover:text-red-700"
                    onClick={(event) =>
                      Modal.confirm({
                        title: "Are you sure you want to delete this document?",
                        onOk: () =>
                          handleDeleteDocument(
                            event,
                            `cases/${id}/documents/${document._id}`,
                            document._id
                          ),
                      })
                    }>
                    <RiDeleteBin2Line />
                  </button>
                </List.Item>
              )}
            />
          </div>
        </div>

        <div>
          <Title level={4}>Case History</Title>
          {Array.isArray(data?.data?.reports) &&
          data?.data?.reports.length > 0 ? (
            <>
              {paginatedReports.map((u, index) => (
                <Card className="w-[500px]" key={u?._id || index}>
                  <p>
                    <Text strong>Date: </Text>
                    {formatDate(u?.date) || (
                      <span className="text-red-500 font-semibold">
                        Not provided
                      </span>
                    )}
                  </p>
                  <p>
                    <Text strong>Update: </Text>

                    {shortenText(u?.update, 150, u._id)}

                    {/* {u.update || (
                      <span className="text-red-500 font-semibold">
                        Not provided
                      </span>
                    )} */}
                  </p>
                  <p>
                    <Text strong>Next Adjourned Date: </Text>
                    {(u?.adjournedDate && formatDate(u?.adjournedDate)) || (
                      <span className="text-red-500 font-semibold">
                        Not provided
                      </span>
                    )}
                  </p>
                </Card>
              ))}
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
        </div>
      </section>
    </>
  );
};

export default CaseDetails;
