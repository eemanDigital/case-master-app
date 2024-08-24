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
import MajorHeading from "../components/MajorHeading";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Text, Title } = Typography;
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
  useRedirectLogoutUser("users/login"); // redirect to login if user is not logged in

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

  //
  if (error) {
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans p-4">
      <div className="container mx-auto  py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between  mb-8">
          {/* navigate back btn */}
          <GoBackButton />
          {/* document upload form */}
          {isStaff && <CaseDocumentUpload caseId={id} />}
        </div>

        <Card className="mb-8 shadow-lg rounded-xl overflow-hidden ">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
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
              <div key={partyIndex} className="space-y-4 ">
                <MajorHeading title={party.title} />

                {party.names?.map((name, nameIndex) => (
                  <div
                    key={name?._id || nameIndex}
                    className="flex items-center text-[18px]  space-x-2">
                    <p className="text-gray-700 s">{nameIndex + 1}.</p>
                    <p className="text-gray-600  font-bold  font-poppins">
                      {name.name}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <MajorHeading midTitle="Case Details" />

              <List
                itemLayout="horizontal"
                dataSource={[
                  { label: "Suit No:", value: data?.data?.suitNo },
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
                  <List.Item className="py-3 px-4 hover:bg-gray-50 transition-colors">
                    <List.Item.Meta
                      title={
                        // <h1 className="text-[19px]  text-green-900 font-medium mb-2">
                        //   {item.label}
                        // </h1>
                        <MajorHeading subtitle={item.label} />
                      }
                      description={
                        item.value ? (
                          <p className="text-gray-800 font-poppins font-medium text-justify capitalize">
                            {item.value}
                          </p>
                        ) : (
                          <p type="danger">Not provided</p>
                        )
                      }
                    />
                  </List.Item>
                )}
              />

              <div className=" space-y-6">
                {[
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
                ].map((section, index) => (
                  <div key={index} className="mb-6">
                    <MajorHeading subtitle={section.title} />

                    {Array.isArray(section.data) && section.data.length > 0 ? (
                      <ol className="text-gray-700 space-y-2">
                        {section.data.map((item, idx) => (
                          <li
                            key={item?._id || idx}
                            className="flex items-start">
                            <span className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center mr-3 font-semibold text-sm">
                              {idx + 1}
                            </span>
                            <p className="text-gray-800 pt-0.5 font-medium font-poppins">
                              {section.title === "Account Officer(s)"
                                ? `${item.firstName} ${item.lastName}`
                                : item[section.keyProp] || (
                                    <Text type="danger" className="italic">
                                      Not provided
                                    </Text>
                                  )}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <Text type="danger" className="italic">
                        No {section.title.toLowerCase()} provided.
                      </Text>
                    )}
                  </div>
                ))}

                <div className="mb-4">
                  <MajorHeading subtitle="Client" />

                  <p className=" font-medium font-poppins">
                    {data?.data?.client?.firstName}{" "}
                    {data?.data?.client?.secondName || ""}
                  </p>
                </div>

                <div className="mb-4">
                  <MajorHeading subtitle="General Comment" />

                  <p className="font-medium font-poppins">
                    {data?.data?.generalComment
                      ? shortenText(data?.data?.generalComment)
                      : "Not Provided"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="shadow-lg rounded-xl overflow-hidden">
              <MajorHeading midTitle="Attached Documents" />
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

          <div className="space-y-8 ">
            <Card
              title={<Title level={3}>Case History</Title>}
              className="shadow-lg rounded-xl overflow-hidden ">
              {Array.isArray(data?.data?.reports) &&
              data?.data?.reports.length > 0 ? (
                <>
                  <List
                    itemLayout="vertical"
                    dataSource={paginatedReports}
                    renderItem={(u) => (
                      <List.Item
                        key={u._id}
                        className="hover:bg-gray-50 transition-colors font-poppins">
                        <List.Item.Meta
                          title={
                            <Text strong className="text-lg">
                              {formatDate(u.date)}
                            </Text>
                          }
                          description={
                            <div className="space-y-2">
                              <Text className="font-poppins text-justify">
                                <Text strong>Update:</Text>{" "}
                                {shortenText(u.update, 150, u._id)}
                              </Text>
                              <Text>
                                <Text strong className="font-poppins p-3">
                                  Next Adjourned Date:
                                </Text>
                                {u.adjournedDate ? (
                                  formatDate(u.adjournedDate)
                                ) : (
                                  <Text className="font-poppins" type="danger">
                                    Not provided
                                  </Text>
                                )}
                              </Text>
                            </div>
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
                    className="mt-6"
                  />
                </>
              ) : (
                <Empty
                  description="No case history available."
                  className="py-12"
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
