import { useParams, Link } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import { formatDate } from "../utils/formatDate";
import { Button, Divider, Typography, Row, Col, Card, List, Modal } from "antd";
import { FaDownload } from "react-icons/fa6";
import { RiDeleteBin2Line } from "react-icons/ri";
import CaseDocumentUpload from "../components/CaseDocumentUpload";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import useDeleteDocument from "../hooks/useDeleteDocument";

const { Title, Text } = Typography;
const baseURL = import.meta.env.VITE_BASE_URL;

const CaseDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { handleDeleteDocument, documents } = useDeleteDocument(
    data?.data,
    "caseData"
  );

  useEffect(() => {
    dataFetcher(`cases/${id}`, "GET");
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data</p>;

  // deleteDoc
  // Retrieve token from browser cookies
  // const token = document.cookie
  //   .split("; ")
  //   .find((row) => row.startsWith("jwt="))
  //   ?.split("=")[1];

  // const fileHeaders = {
  //   headers: {
  //     "Content-Type": "multipart/form-data",
  //     Authorization: `Bearer ${token}`,
  //   },
  // };

  // const handleDeleteDocument = async (event, url, documentId) => {
  //   event.preventDefault();
  //   // Optimistically update the state
  //   const updatedDocuments = documents.filter((doc) => doc._id !== documentId);
  //   setDocuments(updatedDocuments);

  //   try {
  //     await axios.delete(`${baseURL}/${url}`, fileHeaders);
  //   } catch (err) {
  //     // Revert the state if the API call fails
  //     setDocuments((prevDocs) => [
  //       ...prevDocs,
  //       documents.find((doc) => doc._id === documentId),
  //     ]);
  //     console.log(err);
  //   }
  // };

  return (
    <section className="p-6">
      <div className="flex justify-between">
        <Link to="../..">
          <Button type="link">Go Back to case lists</Button>
        </Link>

        {/* case file upload */}
        <CaseDocumentUpload caseId={id} />
      </div>

      <div className="my-4">
        <Row justify="space-between">
          <Col>
            <Card title={data?.data?.firstParty.description}>
              {data?.data?.firstParty?.name?.map((singleName, index) => (
                <div key={singleName._id}>
                  <Text strong>{index + 1}. </Text>
                  <Text>{singleName.name}</Text>
                </div>
              ))}
            </Card>
          </Col>
          <Col>
            <Card title={data?.data?.secondParty.description}>
              {data?.data?.secondParty?.name?.map((singleName, index) => (
                <div key={singleName._id}>
                  <Text strong>{index + 1}. </Text>
                  <Text>{singleName.name}</Text>
                </div>
              ))}
            </Card>
          </Col>
          <Col>
            {data?.data?.otherParty.map((singleParty) => (
              <Card
                key={singleParty.description}
                title={singleParty.description}>
                {singleParty?.name?.map((n, index) => (
                  <div key={n._id}>
                    <Text strong>{index + 1}. </Text>
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
                data?.data?.filingDate && formatDate(data?.data?.filingDate),
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
              <Text strong>{item.label}</Text> {item.value}
            </List.Item>
          )}
        />
        <Divider />
        {data?.data?.judge.map((j) => (
          <Text key={j._id} strong>
            Judge:{" "}
            {j.name || (
              <span className="text-red-500 font-semibold">Not provided</span>
            )}
          </Text>
        ))}
        <Divider />
        <Title level={4}>Case Reports</Title>
        {Array.isArray(data?.data?.reports)
          ? data?.data?.reports.map((u) => (
              <Card key={u._id}>
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
                  {u.update || (
                    <span className="text-red-500 font-semibold">
                      Not provided
                    </span>
                  )}
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
            ))
          : null}
        <Divider />
        <Title level={4}>Case Strength</Title>
        <List
          dataSource={data?.data?.caseStrengths || []}
          renderItem={(item) => (
            <List.Item>
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
          renderItem={(item) => (
            <List.Item>
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
        {data?.data?.stepToBeTaken.map((step) => (
          <Text key={step._id} strong>
            Steps to be taken:{" "}
            {step.name || (
              <span className="text-red-500 font-semibold">Not provided</span>
            )}
          </Text>
        ))}
        <Divider />
        <Title level={4}>Client</Title>
        <List
          dataSource={data?.data?.client || []}
          renderItem={(item) => (
            <List.Item>
              <Text>
                {item.name || (
                  <span className="text-red-500 font-semibold">
                    Not provided
                  </span>
                )}
              </Text>
            </List.Item>
          )}
        />
        <Divider />
        <Text strong>General Comment: </Text> {data?.data?.generalComment}
      </div>

      <Title level={2} className="text-gray-700 mt-4">
        Attached Documents
      </Title>
      <div>
        <List
          dataSource={documents}
          renderItem={(document) => (
            <List.Item>
              <div className="flex gap-2 items-center">
                <Text>{document?.fileName}</Text>
                <FaDownload
                  className="text-green-500 hover:text-green-700 cursor-pointer"
                  onClick={(event) =>
                    handleGeneralDownload(
                      event,
                      `${baseURL}/cases/${id}/documents/${document._id}/download`,
                      document.fileName
                    )
                  }
                />

                <RiDeleteBin2Line
                  className="text-red-500"
                  onClick={(event) =>
                    Modal.confirm({
                      title: "Are you sure you want to delete this document",
                      onOk: () =>
                        handleDeleteDocument(
                          event,
                          `cases/${id}/documents/${document._id}`,
                          document._id
                        ),
                    })
                  }
                />
              </div>
            </List.Item>
          )}
        />
      </div>
    </section>
  );
};

export default CaseDetails;
