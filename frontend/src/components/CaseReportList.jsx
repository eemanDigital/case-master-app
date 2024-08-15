import { useEffect, useState } from "react";
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
      toast.success(deleteMsg);
      dispatch(RESET());
    }
    if (deleteError) {
      toast.error(deleteMsg);
      dispatch(RESET());
    }
  }, [deleteSuccess, deleteError, deleteMsg, dispatch]);

  useEffect(() => {
    if (reports) {
      setSearchResults(reports);
    }
  }, [reports]);

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    if (!searchTerm) {
      setSearchResults(reports);
      return;
    }
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

  const deleteReport = async (id) => {
    try {
      await dispatch(deleteData(`reports/${id}`));
      fetchData("reports", "reports");
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  const filterCaseByClient = (caseIds) => {
    return (
      reports?.filter((report) =>
        caseIds?.includes(report?.caseReported?._id)
      ) || []
    );
  };

  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = searchResults.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  return (
    <section className="w-full font-poppins mt-8 bg-gray-50 p-6 rounded-lg shadow-md">
      <Title
        level={2}
        className={`${titleStyle || "text-2xl text-gray-800 font-bold mb-6"} ${
          hideButtons ? "text-center" : ""
        }`}>
        {title}
      </Title>
      <div className="flex justify-between items-center mb-6">
        {!hideButtons && isStaff && (
          <Link to="add-report">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-blue-500 hover:bg-blue-600">
              Add New Report
            </Button>
          </Link>
        )}
        {showFilter && (
          <SearchBar onSearch={handleSearchChange} className="w-64" />
        )}
      </div>
      <Space direction="vertical" size="large" className="w-full">
        {(isStaff ? currentReports : filterCaseByClient(caseIDs))?.map(
          (report) => (
            <Card
              key={report._id}
              className="w-full bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
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
                  <Text strong className="text-gray-600">
                    Reported on:{" "}
                    <span className="text-blue-500">
                      {formatDate(report?.date)}
                    </span>
                  </Text>
                )}
                <Text className="text-gray-700 text-justify">
                  {shortenText(report?.update, 300, report._id)}
                </Text>
                <Space
                  direction="horizontal"
                  size="large"
                  className="w-full justify-between">
                  <Text strong>
                    Adjourned For:{" "}
                    <span className="text-rose-600">
                      {report?.adjournedFor}
                    </span>
                  </Text>
                  <Text strong>
                    Adjourned Date:{" "}
                    <span className="text-blue-500">
                      {formatDate(report?.adjournedDate)}
                    </span>
                  </Text>
                  <Text strong>
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

export default CaseReportList;
