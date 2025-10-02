import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  Card,
  Typography,
  Space,
  Pagination,
  Button,
  Modal,
  Tooltip,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { formatDate } from "../utils/formatDate";
import UpdateCaseReportForm from "../pages/UpdateCaseReportForm";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import useTextShorten from "../hooks/useTextShorten";
import { useDispatch, useSelector } from "react-redux";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";
import AddEventToCalender from "./AddEventToCalender";
import { useDownloadPdfHandler } from "../hooks/useDownloadPdfHandler";
import SendCaseReport from "./SendCaseReport";
import { ShowStaff } from "./protect/Protect";
import ArchiveIcon from "./ArchiveIcon";

const { Title, Text } = Typography;
const downloadURL = import.meta.env.VITE_BASE_URL;

const CaseReportList = ({
  title,
  showFilter,
  reports,
  hideButtons,
  titleStyle,
  nameStyle,
}) => {
  const { isStaff, isSuperAdmin } = useAdminHook();
  const { fetchData } = useDataGetterHook();
  const { user } = useSelector((state) => state.auth);
  const clientId = user?.data?._id; // get client id

  const {
    isError: deleteError,
    isSuccess: deleteSuccess,
    message: deleteMsg,
  } = useSelector((state) => state.delete); // get delete state
  const { shortenText } = useTextShorten();
  const dispatch = useDispatch();
  const {
    loading: loadingPdf,
    error: pdfError,
    handleDownloadPdf,
  } = useDownloadPdfHandler();

  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // prepare event title for calendar
  const createEventTitle = (report) => {
    return `Case: ${report.caseReported.firstParty.name[0].name} vs ${report.caseReported.secondParty.name[0].name}`;
  };

  // prepare event description for calendar
  const createEventDescription = (report) => {
    return `Adjourned For: ${report.adjournedFor}`;
  };

  useEffect(() => {
    if (deleteSuccess) {
      // if delete is successful
      toast.success(deleteMsg);
      dispatch(RESET()); // reset the delete state
    }
    if (deleteError) {
      // if delete fails
      toast.error(deleteMsg);
      dispatch(RESET());
    }
  }, [deleteSuccess, deleteError, deleteMsg, dispatch]);

  // Set search results to reports when reports are loaded
  useEffect(() => {
    if (reports) {
      setSearchResults(reports);
    }
  }, [reports]);

  // Handle search change
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    if (!searchTerm) {
      setSearchResults(reports);
      return;
    }
    // Filter reports by search term
    const results = reports?.filter((d) => {
      const firstPartyMatch = d.caseReported?.firstParty?.name?.some(
        (nameObj) => nameObj?.name?.toLowerCase().includes(searchTerm)
      );
      const secondPartyMatch = d?.caseReported?.secondParty?.name?.some(
        (nameObj) => nameObj?.name.toLowerCase().includes(searchTerm)
      );
      const adjournedFor = d?.adjournedFor?.toLowerCase().includes(searchTerm);
      const update = d?.update?.toLowerCase().includes(searchTerm);
      return firstPartyMatch || secondPartyMatch || update || adjournedFor;
    });
    setSearchResults(results || []);
  };

  // Delete report
  const deleteReport = async (id) => {
    try {
      await dispatch(deleteData(`reports/soft-delete/${id}`));
      fetchData("reports", "reports");
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  // Filter reports for client
  const filterReportForClient = (id) => {
    return reports?.filter(
      (reportItem) => reportItem?.caseReported?.client === id
    );
  };

  // Get current reports
  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = searchResults.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  if (pdfError) {
    return toast.error(pdfError || "Failed to download document"); //pdf error toast
  }

  return (
    <section className="w-full   rounded-lg  px-2 ">
      <Title
        level={2}
        className={`${
          titleStyle || "text-2xl text-gray-800 font-bold p-2 mb-6"
        } ${hideButtons ? "text-center" : ""}`}>
        <div className="flex justify-between items-center">
          {title}
          <ArchiveIcon
            toolTipName="View Deleted Reports"
            link="soft-deleted-items"
          />
        </div>
      </Title>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        {!hideButtons && isStaff && (
          <Link to="add-report">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-blue-500 hover:bg-blue-600 mb-4 md:mb-0">
              Add New Report
            </Button>
          </Link>
        )}

        {showFilter && (
          <SearchBar onSearch={handleSearchChange} className="w-full md:w-64" />
        )}
      </div>
      <Space direction="vertical" size="large" className="w-full">
        {(isStaff ? currentReports : filterReportForClient(clientId))?.map(
          (report) => (
            <Card
              key={report._id}
              className="w-full font-poppins  shadow-sm hover:shadow-md transition-shadow duration-300"
              title={
                <Link
                  to={`/dashboard/cases/${report.caseReported._id}/casedetails`}
                  className={`${
                    nameStyle || "text-lg font-semibold text-gray-700 truncate"
                  } sm:text-base md:text-lg lg:text-xl w-full`}>
                  {`${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`}
                  <span className=" p-2 text-[12px]  text-gray-500 font-bold">
                    (<span className=" ">Suit No:</span>{" "}
                    {report?.caseReported?.suitNo})
                  </span>
                </Link>
              }>
              <Space direction="vertical" size="small" className="w-full">
                {!hideButtons && (
                  <Text className="text-gray-600 font-poppins font-medium  ">
                    Reported on:{" "}
                    <span className="text-blue-500 ">
                      {formatDate(report?.date)}
                    </span>
                  </Text>
                )}
                <Text className="text-gray-700 text-justify font-poppins  ">
                  {shortenText(report?.update, 300, report._id)}
                </Text>
                <Space
                  direction="horizontal"
                  size="large"
                  className="w-full justify-between flex-wrap">
                  <Text className="font-poppins   font-medium">
                    Adjourned For:{" "}
                    <span className="text-rose-600 font-poppins ">
                      {report?.adjournedFor}
                    </span>
                  </Text>
                  <Text className="font-poppins font-medium ">
                    Adjourned Date:{" "}
                    <span className="text-blue-500 ">
                      {formatDate(report?.adjournedDate)}
                    </span>
                  </Text>
                  <Text className="font-poppins  font-medium">
                    Reported By:{" "}
                    <span className="text-gray-700">
                      {`${report?.reportedBy?.firstName} ${report?.reportedBy?.lastName}`}
                    </span>
                  </Text>
                </Space>
              </Space>
              {!hideButtons && (
                <div className="flex justify-end mt-4 space-x-2">
                  {(isSuperAdmin ||
                    report?.reportedBy?._id === user?.data?._id) && (
                    <UpdateCaseReportForm reportId={report._id} />
                  )}
                  <Tooltip title="Download Report">
                    <Button
                      loading={loadingPdf}
                      icon={<DownloadOutlined />}
                      className="bg-green-500 text-white hover:bg-green-600"
                      onClick={(event) =>
                        handleDownloadPdf(
                          event,
                          `${downloadURL}/reports/pdf/${report?._id}`,
                          "report.pdf"
                        )
                      }
                    />
                  </Tooltip>
                  {(isSuperAdmin ||
                    report?.reportedBy?._id === user?.data?._id) && (
                    <Tooltip title="Delete Report">
                      <Button
                        icon={<DeleteOutlined />}
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          Modal.confirm({
                            title:
                              "Are you sure you want to delete this report?",
                            onOk: () => deleteReport(report?._id),
                          });
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
              )}
              <div className="flex gap-4 sm:flex-row flex-col justify-between sm:items-center items-start mt-2">
                {!hideButtons && (
                  <AddEventToCalender
                    title={createEventTitle(report)}
                    description={createEventDescription(report)}
                    startDate={report.date}
                    endDate={report.adjournedDate}
                  />
                )}
                <ShowStaff>
                  <SendCaseReport report={report} />
                </ShowStaff>
              </div>
            </Card>
          )
        )}
      </Space>
      {!hideButtons && (
        <Pagination
          current={currentPage}
          total={reports?.length}
          pageSize={itemsPerPage}
          onChange={(page) => setCurrentPage(page)}
          className="mt-6 text-center"
        />
      )}
    </section>
  );
};

CaseReportList.propTypes = {
  title: PropTypes.string,
  showFilter: PropTypes.bool,
  reports: PropTypes.arrayOf(
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
      }).isRequired,
      date: PropTypes.string.isRequired,
      adjournedFor: PropTypes.string,
      adjournedDate: PropTypes.string,
      update: PropTypes.string,
      reportedBy: PropTypes.shape({
        fullName: PropTypes.string,
      }),
    })
  ).isRequired,
  hideButtons: PropTypes.bool,
  titleStyle: PropTypes.string,
  nameStyle: PropTypes.string,
};

CaseReportList.defaultProps = {
  reports: [],
  hideButtons: false,
  showFilter: false,
  title: "Case Reports",
  titleStyle: "",
  nameStyle: "",
};

export default CaseReportList;
