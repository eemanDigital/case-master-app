// import { useEffect, useState } from "react";
// import PropTypes from "prop-types";
// import { Link } from "react-router-dom";
// import {
//   Card,
//   Typography,
//   Space,
//   Pagination,
//   Button,
//   Modal,
//   Tooltip,
// } from "antd";
// import {
//   DownloadOutlined,
//   DeleteOutlined,
//   PlusOutlined,
// } from "@ant-design/icons";
// import { formatDate } from "../utils/formatDate";
// import UpdateCaseReportForm from "../pages/UpdateCaseReportForm";
// import SearchBar from "../components/SearchBar";
// import { useAdminHook } from "../hooks/useAdminHook";
// import useTextShorten from "../hooks/useTextShorten";
// import { useDispatch, useSelector } from "react-redux";
// import { useDataGetterHook } from "../hooks/useDataGetterHook";
// import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
// import { toast } from "react-toastify";
// import AddEventToCalender from "./AddEventToCalender";
// import { useDownloadPdfHandler } from "../hooks/useDownloadPdfHandler";
// import SendCaseReport from "./SendCaseReport";
// import { ShowStaff } from "./protect/Protect";
// import ArchiveIcon from "./ArchiveIcon";

// const { Title, Text } = Typography;
// const downloadURL = import.meta.env.VITE_BASE_URL;

// const CaseReportList = ({
//   title,
//   showFilter,
//   reports,
//   hideButtons,
//   titleStyle,
//   nameStyle,
// }) => {
//   const { isStaff, isSuperAdmin } = useAdminHook();
//   const { fetchData } = useDataGetterHook();
//   const { user } = useSelector((state) => state.auth);
//   const clientId = user?.data?._id; // get client id

//   const {
//     isError: deleteError,
//     isSuccess: deleteSuccess,
//     message: deleteMsg,
//   } = useSelector((state) => state.delete); // get delete state
//   const { shortenText } = useTextShorten();
//   const dispatch = useDispatch();
//   const {
//     loading: loadingPdf,
//     error: pdfError,
//     handleDownloadPdf,
//   } = useDownloadPdfHandler();

//   const [searchResults, setSearchResults] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(5);

//   // prepare event title for calendar
//   const createEventTitle = (report) => {
//     return `Case: ${report.caseReported.firstParty.name[0].name} vs ${report.caseReported.secondParty.name[0].name}`;
//   };

//   // prepare event description for calendar
//   const createEventDescription = (report) => {
//     return `Adjourned For: ${report.adjournedFor}`;
//   };

//   useEffect(() => {
//     if (deleteSuccess) {
//       // if delete is successful
//       toast.success(deleteMsg);
//       dispatch(RESET()); // reset the delete state
//     }
//     if (deleteError) {
//       // if delete fails
//       toast.error(deleteMsg);
//       dispatch(RESET());
//     }
//   }, [deleteSuccess, deleteError, deleteMsg, dispatch]);

//   // Set search results to reports when reports are loaded
//   useEffect(() => {
//     if (reports) {
//       setSearchResults(reports);
//     }
//   }, [reports]);

//   // Handle search change
//   const handleSearchChange = (e) => {
//     const searchTerm = e.target.value.trim().toLowerCase();
//     if (!searchTerm) {
//       setSearchResults(reports);
//       return;
//     }
//     // Filter reports by search term
//     const results = reports?.filter((d) => {
//       const firstPartyMatch = d.caseReported?.firstParty?.name?.some(
//         (nameObj) => nameObj?.name?.toLowerCase().includes(searchTerm)
//       );
//       const secondPartyMatch = d?.caseReported?.secondParty?.name?.some(
//         (nameObj) => nameObj?.name.toLowerCase().includes(searchTerm)
//       );
//       const adjournedFor = d?.adjournedFor?.toLowerCase().includes(searchTerm);
//       const update = d?.update?.toLowerCase().includes(searchTerm);
//       return firstPartyMatch || secondPartyMatch || update || adjournedFor;
//     });
//     setSearchResults(results || []);
//   };

//   // Delete report
//   const deleteReport = async (id) => {
//     try {
//       await dispatch(deleteData(`reports/soft-delete/${id}`));
//       fetchData("reports", "reports");
//     } catch (error) {
//       toast.error("Failed to delete report");
//     }
//   };

//   // Filter reports for client
//   const filterReportForClient = (id) => {
//     return reports?.filter(
//       (reportItem) => reportItem?.caseReported?.client === id
//     );
//   };

//   // Get current reports
//   const indexOfLastReport = currentPage * itemsPerPage;
//   const indexOfFirstReport = indexOfLastReport - itemsPerPage;
//   const currentReports = searchResults.slice(
//     indexOfFirstReport,
//     indexOfLastReport
//   );

//   if (pdfError) {
//     return toast.error(pdfError || "Failed to download document"); //pdf error toast
//   }

//   return (
//     <section className="w-full   rounded-lg  px-2 ">
//       <Title
//         level={2}
//         className={`${
//           titleStyle || "text-2xl text-gray-800 font-bold p-2 mb-6"
//         } ${hideButtons ? "text-center" : ""}`}>
//         <div className="flex justify-between items-center">
//           {title}
//           <ArchiveIcon
//             toolTipName="View Deleted Reports"
//             link="soft-deleted-items"
//           />
//         </div>
//       </Title>
//       <div className="flex flex-col md:flex-row justify-between items-center mb-6">
//         {!hideButtons && isStaff && (
//           <Link to="add-report">
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               className="bg-blue-500 hover:bg-blue-600 mb-4 md:mb-0">
//               Add New Report
//             </Button>
//           </Link>
//         )}

//         {showFilter && (
//           <SearchBar onSearch={handleSearchChange} className="w-full md:w-64" />
//         )}
//       </div>
//       <Space direction="vertical" size="large" className="w-full">
//         {(isStaff ? currentReports : filterReportForClient(clientId))?.map(
//           (report) => (
//             <Card
//               key={report._id}
//               className="w-full font-poppins  shadow-sm hover:shadow-md transition-shadow duration-300"
//               title={
//                 <Link
//                   to={`/dashboard/cases/${report.caseReported._id}/casedetails`}
//                   className={`${
//                     nameStyle || "text-lg font-semibold text-gray-700 truncate"
//                   } sm:text-base md:text-lg lg:text-xl w-full`}>
//                   {`${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`}
//                   <span className=" p-2 text-[12px]  text-gray-500 font-bold">
//                     (<span className=" ">Suit No:</span>{" "}
//                     {report?.caseReported?.suitNo})
//                   </span>
//                 </Link>
//               }>
//               <Space direction="vertical" size="small" className="w-full">
//                 {!hideButtons && (
//                   <Text className="text-gray-600 font-poppins font-medium  ">
//                     Reported on:{" "}
//                     <span className="text-blue-500 ">
//                       {formatDate(report?.date)}
//                     </span>
//                   </Text>
//                 )}
//                 <Text className="text-gray-700 text-justify font-poppins  ">
//                   {shortenText(report?.update, 300, report._id)}
//                 </Text>
//                 <Space
//                   direction="horizontal"
//                   size="large"
//                   className="w-full justify-between flex-wrap">
//                   <Text className="font-poppins   font-medium">
//                     Adjourned For:{" "}
//                     <span className="text-rose-600 font-poppins ">
//                       {report?.adjournedFor}
//                     </span>
//                   </Text>
//                   <Text className="font-poppins font-medium ">
//                     Adjourned Date:{" "}
//                     <span className="text-blue-500 ">
//                       {formatDate(report?.adjournedDate)}
//                     </span>
//                   </Text>
//                   <Text className="font-poppins  font-medium">
//                     Reported By:{" "}
//                     <span className="text-gray-700">
//                       {`${report?.reportedBy?.firstName} ${report?.reportedBy?.lastName}`}
//                     </span>
//                   </Text>
//                 </Space>
//               </Space>
//               {!hideButtons && (
//                 <div className="flex justify-end mt-4 space-x-2">
//                   {(isSuperAdmin ||
//                     report?.reportedBy?._id === user?.data?._id) && (
//                     <UpdateCaseReportForm reportId={report._id} />
//                   )}
//                   <Tooltip title="Download Report">
//                     <Button
//                       loading={loadingPdf}
//                       icon={<DownloadOutlined />}
//                       className="bg-green-500 text-white hover:bg-green-600"
//                       onClick={(event) =>
//                         handleDownloadPdf(
//                           event,
//                           `${downloadURL}/reports/pdf/${report?._id}`,
//                           "report.pdf"
//                         )
//                       }
//                     />
//                   </Tooltip>
//                   {(isSuperAdmin ||
//                     report?.reportedBy?._id === user?.data?._id) && (
//                     <Tooltip title="Delete Report">
//                       <Button
//                         icon={<DeleteOutlined />}
//                         className="bg-red-500 text-white hover:bg-red-600"
//                         onClick={() => {
//                           Modal.confirm({
//                             title:
//                               "Are you sure you want to delete this report?",
//                             onOk: () => deleteReport(report?._id),
//                           });
//                         }}
//                       />
//                     </Tooltip>
//                   )}
//                 </div>
//               )}
//               <div className="flex gap-4 sm:flex-row flex-col justify-between sm:items-center items-start mt-2">
//                 {!hideButtons && (
//                   <AddEventToCalender
//                     title={createEventTitle(report)}
//                     description={createEventDescription(report)}
//                     startDate={report.date}
//                     endDate={report.adjournedDate}
//                   />
//                 )}
//                 <ShowStaff>
//                   <SendCaseReport report={report} />
//                 </ShowStaff>
//               </div>
//             </Card>
//           )
//         )}
//       </Space>
//       {!hideButtons && (
//         <Pagination
//           current={currentPage}
//           total={reports?.length}
//           pageSize={itemsPerPage}
//           onChange={(page) => setCurrentPage(page)}
//           className="mt-6 text-center"
//         />
//       )}
//     </section>
//   );
// };

// CaseReportList.propTypes = {
//   title: PropTypes.string,
//   showFilter: PropTypes.bool,
//   reports: PropTypes.arrayOf(
//     PropTypes.shape({
//       _id: PropTypes.string.isRequired,
//       caseReported: PropTypes.shape({
//         firstParty: PropTypes.shape({
//           name: PropTypes.arrayOf(
//             PropTypes.shape({
//               name: PropTypes.string.isRequired,
//             })
//           ).isRequired,
//         }).isRequired,
//         secondParty: PropTypes.shape({
//           name: PropTypes.arrayOf(
//             PropTypes.shape({
//               name: PropTypes.string.isRequired,
//             })
//           ).isRequired,
//         }).isRequired,
//       }).isRequired,
//       date: PropTypes.string.isRequired,
//       adjournedFor: PropTypes.string,
//       adjournedDate: PropTypes.string,
//       update: PropTypes.string,
//       reportedBy: PropTypes.shape({
//         fullName: PropTypes.string,
//       }),
//     })
//   ).isRequired,
//   hideButtons: PropTypes.bool,
//   titleStyle: PropTypes.string,
//   nameStyle: PropTypes.string,
// };

// CaseReportList.defaultProps = {
//   reports: [],
//   hideButtons: false,
//   showFilter: false,
//   title: "Case Reports",
//   titleStyle: "",
//   nameStyle: "",
// };

// export default CaseReportList;
// Updated CaseReportList component
// Updated CaseReportList component using your data fetcher
import { useEffect } from "react";
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
  Spin,
  Alert,
  Tag,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { formatDate } from "../utils/formatDate";
import UpdateCaseReportForm from "../pages/UpdateCaseReportForm";
import AdvancedSearchBar from "../components/AdvancedSearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import useTextShorten from "../hooks/useTextShorten";
import { useDispatch, useSelector } from "react-redux";
import { useAdvancedSearch } from "../hooks/useAdvancedSearch";
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
  hideButtons,
  titleStyle,
  nameStyle,
  endpoint = "reports", // Make endpoint configurable
}) => {
  const { isStaff, isSuperAdmin } = useAdminHook();
  const { user } = useSelector((state) => state.auth);
  const clientId = user?.data?._id;

  const {
    isError: deleteError,
    isSuccess: deleteSuccess,
    message: deleteMsg,
  } = useSelector((state) => state.delete);

  const { shortenText } = useTextShorten();
  const dispatch = useDispatch();
  const {
    loading: loadingPdf,
    error: pdfError,
    handleDownloadPdf,
  } = useDownloadPdfHandler();

  // Use advanced search hook with your data fetcher
  const {
    data: reports,
    pagination,
    filters,
    loading,
    error,
    updateFilters,
    updatePagination,
    resetSearch,
  } = useAdvancedSearch(endpoint, {
    sort: "-date",
    limit: 10,
  });

  // prepare event title for calendar
  const createEventTitle = (report) => {
    return `Case: ${
      report.caseReported?.firstParty?.name?.[0]?.name || "N/A"
    } vs ${report.caseReported?.secondParty?.name?.[0]?.name || "N/A"}`;
  };

  // prepare event description for calendar
  const createEventDescription = (report) => {
    return `Adjourned For: ${report.adjournedFor || "Not specified"}`;
  };

  useEffect(() => {
    if (deleteSuccess) {
      toast.success(deleteMsg);
      dispatch(RESET());
      // Refresh data after delete
      updateFilters({ ...filters });
    }
    if (deleteError) {
      toast.error(deleteMsg);
      dispatch(RESET());
    }
  }, [deleteSuccess, deleteError, deleteMsg, dispatch]);

  // Delete report
  const deleteReport = async (id) => {
    try {
      await dispatch(deleteData(`reports/soft-delete/${id}`));
      // Data will refresh automatically due to the hook
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  // Handle pagination change
  const handlePageChange = (page, pageSize) => {
    updatePagination({
      current: page,
      limit: pageSize,
    });
  };

  // Handle search and filter changes
  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
  };

  // Filter reports for client (client-side filtering for client view)
  const filterReportForClient = (reports, id) => {
    if (!reports || !Array.isArray(reports)) return [];
    return reports.filter(
      (reportItem) => reportItem?.caseReported?.client === id
    );
  };

  // Get current reports (already paginated by API for staff, client-side filtered for clients)
  const currentReports = isStaff
    ? reports
    : filterReportForClient(reports, clientId);

  if (pdfError) {
    toast.error(pdfError || "Failed to download document");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex justify-between items-center">
          <Title level={2} className="text-2xl font-bold text-gray-900">
            {title}
          </Title>
          <ArchiveIcon
            toolTipName="View Deleted Reports"
            link="soft-deleted-items"
          />
        </div>

        {/* Actions and Search */}
        {/* <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"> */}
        {/* {!hideButtons && isStaff && (
            <Link to="add-report">
              <Button type="primary" icon={<PlusOutlined />} size="large">
                Add New Report
              </Button>
            </Link>
          )} */}

        {/* Actions and Search - Fixed layout */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Add Report Button */}
            {!hideButtons && isStaff && (
              <div className="lg:flex-shrink-0">
                <Link to="add-report">
                  <Button type="primary" icon={<PlusOutlined />} size="large">
                    Add New Report
                  </Button>
                </Link>
              </div>
            )}

            {/* Search Bar - Takes remaining space */}
            <div className="flex-1 min-w-0">
              {" "}
              {/* Important: prevents overflow */}
              <AdvancedSearchBar
                onFiltersChange={handleFiltersChange}
                filters={filters}
                loading={loading}
                searchPlaceholder="Search reports or filter by case..."
                showCaseSearch={true}
              />
            </div>
          </div>
        </div>
        {/* </div> */}
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && (
          <div className="text-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        )}

        {error && (
          <Alert
            message="Error Loading Reports"
            description={error}
            type="error"
            showIcon
            className="mb-6"
          />
        )}

        {/* Reports Grid */}
        <div className="space-y-6">
          {currentReports?.map((report) => (
            <Card
              key={report._id}
              className="shadow-sm hover:shadow-md transition-all duration-300 border-0">
              {/* Case Title */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <Link
                  to={`/dashboard/cases/${report.caseReported?._id}/casedetails`}
                  className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {`${
                    report?.caseReported?.firstParty?.name?.[0]?.name || "N/A"
                  } vs ${
                    report?.caseReported?.secondParty?.name?.[0]?.name || "N/A"
                  }`}
                </Link>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span>Suit No: {report?.caseReported?.suitNo || "N/A"}</span>
                  <span>Reported on: {formatDate(report?.date)}</span>
                </div>
              </div>

              {/* Report Content */}
              <div className="prose prose-sm max-w-none mb-4">
                <p className="text-gray-700 leading-relaxed">
                  {shortenText(report?.update, 400, report._id)}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">
                    Adjourned For:
                  </span>
                  <p className="text-rose-600 mt-1">
                    {report?.adjournedFor || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Adjourned Date:
                  </span>
                  <p className="text-blue-500 mt-1">
                    {report?.adjournedDate
                      ? formatDate(report.adjournedDate)
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Reported By:
                  </span>
                  <p className="text-gray-700 mt-1">
                    {report?.reportedBy
                      ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}`
                      : "Unknown"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {!hideButtons && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <AddEventToCalender
                      title={createEventTitle(report)}
                      description={createEventDescription(report)}
                      startDate={report.date}
                      endDate={report.adjournedDate}
                    />
                    <ShowStaff>
                      <SendCaseReport report={report} />
                    </ShowStaff>
                  </div>

                  <div className="flex gap-2">
                    {(isSuperAdmin ||
                      report?.reportedBy?._id === user?.data?._id) && (
                      <UpdateCaseReportForm reportId={report._id} />
                    )}
                    <Tooltip title="Download Report">
                      <Button
                        loading={loadingPdf}
                        icon={<DownloadOutlined />}
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
                          danger
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
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {!hideButtons && currentReports.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              current={pagination.current}
              total={pagination.totalRecords}
              pageSize={pagination.limit}
              onChange={handlePageChange}
              showSizeChanger
              showTotal={(total, range) =>
                `Showing ${range[0]}-${range[1]} of ${total} items`
              }
              pageSizeOptions={["5", "10", "20", "50"]}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && currentReports.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <Title level={3} className="text-gray-600 mb-2">
              {Object.keys(filters).length > 0
                ? "No reports match your search"
                : "No reports found"}
            </Title>
            <Text className="text-gray-500 mb-4">
              {Object.keys(filters).length > 0
                ? "Try adjusting your filters or search terms"
                : "Get started by creating your first case report"}
            </Text>
            {Object.keys(filters).length > 0 ? (
              <Button type="primary" onClick={resetSearch}>
                Clear all filters
              </Button>
            ) : (
              !hideButtons &&
              isStaff && (
                <Link to="add-report">
                  <Button type="primary" icon={<PlusOutlined />}>
                    Create Report
                  </Button>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

CaseReportList.propTypes = {
  title: PropTypes.string,
  showFilter: PropTypes.bool,
  hideButtons: PropTypes.bool,
  titleStyle: PropTypes.string,
  nameStyle: PropTypes.string,
  endpoint: PropTypes.string,
};

CaseReportList.defaultProps = {
  hideButtons: false,
  showFilter: false,
  title: "Case Reports",
  titleStyle: "",
  nameStyle: "",
  endpoint: "reports",
};

export default CaseReportList;
