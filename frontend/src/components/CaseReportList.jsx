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
import { handleDownload } from "../utils/downloadHandler";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import useTextShorten from "../hooks/useTextShorten";
import { useDispatch, useSelector } from "react-redux";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";

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
  const { isStaff } = useAdminHook();
  const { fetchData } = useDataGetterHook();
  const { user } = useSelector((state) => state.auth);
  const {
    isError: deleteError,
    isSuccess: deleteSuccess,
    message: deleteMsg,
  } = useSelector((state) => state.delete);
  const { shortenText } = useTextShorten();
  const dispatch = useDispatch();

  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const caseIDs = user?.data?.clientCase?.map((caseItem) => caseItem?._id);

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
      await dispatch(deleteData(`reports/${id}`));
      fetchData("reports", "reports");
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  // Filter reports by client
  const filterCaseByClient = (caseIds) => {
    return (
      reports?.filter((report) =>
        caseIds?.includes(report?.caseReported?._id)
      ) || []
    );
  };

  // Get current reports
  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = searchResults.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  return (
    <section className="w-full  bg-gray-50 rounded-lg shadow-md sm:px-6 px-2 ">
      <Title
        level={2}
        className={`${
          titleStyle || "text-2xl text-gray-800 font-bold p-5 mb-6"
        } ${hideButtons ? "text-center" : ""}`}>
        {title}
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
        {(isStaff ? currentReports : filterCaseByClient(caseIDs))?.map(
          (report) => (
            <Card
              key={report._id}
              className="w-full font-poppins  shadow-sm hover:shadow-md transition-shadow duration-300"
              title={
                <Title
                  level={4}
                  className={
                    nameStyle || "text-lg text-gray-700 font-semibold"
                  }>
                  {report?.caseReported?.firstParty?.name[0]?.name} vs{" "}
                  {report?.caseReported?.secondParty?.name[0]?.name}
                </Title>
              }>
              <Space direction="vertical" size="small" className="w-full">
                {!hideButtons && (
                  <Text strong className="text-gray-600 font-poppins  ">
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
                  <Text strong className="font-poppins ">
                    Adjourned For:{" "}
                    <span className="text-rose-600 font-poppins ">
                      {report?.adjournedFor}
                    </span>
                  </Text>
                  <Text strong className="font-poppins ">
                    Adjourned Date:{" "}
                    <span className="text-blue-500 ">
                      {formatDate(report?.adjournedDate)}
                    </span>
                  </Text>
                  <Text strong className="font-poppins ">
                    Reported By:{" "}
                    <span className="text-gray-700">
                      {report?.reportedBy?.fullName}
                    </span>
                  </Text>
                </Space>
              </Space>
              {!hideButtons && (
                <div className="flex justify-end mt-4 space-x-2">
                  {isStaff && <UpdateCaseReportForm reportId={report._id} />}
                  <Tooltip title="Download Report">
                    <Button
                      icon={<DownloadOutlined />}
                      className="bg-green-500 text-white hover:bg-green-600"
                      onClick={(event) =>
                        handleDownload(
                          event,
                          `${downloadURL}/reports/pdf/${report?._id}`,
                          "report.pdf"
                        )
                      }
                    />
                  </Tooltip>
                  {isStaff && (
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
