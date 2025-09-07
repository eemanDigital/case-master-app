import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Card, Typography, Space, Pagination } from "antd";

import { formatDate } from "../utils/formatDate";

import useTextShorten from "../hooks/useTextShorten";

import { useDataGetterHook } from "../hooks/useDataGetterHook";

import { useCallback } from "react";

const { Title, Text } = Typography;

const SoftDeletedReportsArchive = () => {
  const { deletedReports, loading, error, fetchData } = useDataGetterHook();

  //  fetch reports
  const fetchReports = useCallback(() => {
    fetchData("reports/soft-deleted-reports", "deletedReports");
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const { shortenText } = useTextShorten();

  console.log("deletedReports", deletedReports);
  // prepare event title for calendar
  // const createEventTitle = (report) => {
  //   return `Case: ${deletedReports.data?.caseReported.firstParty.name[0].name} vs ${deletedReports.data?.caseReported.secondParty.name[0].name}`;
  // };

  // useEffect(() => {
  //   if (deleteSuccess) {
  //     // if delete is successful
  //     toast.success(deleteMsg);
  //     dispatch(RESET()); // reset the delete state
  //   }
  //   if (deleteError) {
  //     // if delete fails
  //     toast.error(deleteMsg);
  //     dispatch(RESET());
  //   }
  // }, [deleteSuccess, deleteError, deleteMsg, dispatch]);

  // // Delete report
  // const deleteReport = async (id) => {
  //   try {
  //     await dispatch(deleteData(`soft_delete/reports/${id}`));
  //     fetchData("reports", "reports");
  //   } catch (error) {
  //     toast.error("Failed to delete report");
  //   }
  // };

  return (
    <section className="w-full   rounded-lg sm:px-6 px-2 ">
      <Title level={2}>Deleted Reports</Title>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        {/* {!hideButtons && isStaff && (
          <Link to="add-report">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-blue-500 hover:bg-blue-600 mb-4 md:mb-0">
              Add New Report
            </Button>
          </Link>
        )} */}

        {/* <ArchiveIcon
          toolTipName="View Deleted Reports"
          link="soft-deleted-items"
        /> */}

        {/* {showFilter && (
          <SearchBar onSearch={handleSearchChange} className="w-full md:w-64" />
        )} */}
      </div>
      <Space direction="vertical" size="large" className="w-full">
        {deletedReports?.data?.map((report) => (
          <Card
            key={report._id}
            className="w-full font-poppins  shadow-sm hover:shadow-md transition-shadow duration-300"
            title={
              <Link
                to={`/dashboard/cases/${report.caseReported._id}/casedetails`}
                className={`${
                  "REPLACE" || "text-lg font-semibold text-gray-700 truncate"
                } sm:text-base md:text-lg lg:text-xl w-full`}>
                {`${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`}
              </Link>
            }>
            <Space direction="vertical" size="small" className="w-full">
              {
                <Text className="text-gray-600 font-poppins font-medium  ">
                  Reported on:{" "}
                  <span className="text-blue-500 ">
                    {formatDate(report?.date)}
                  </span>
                </Text>
              }
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
          </Card>
        ))}
      </Space>
      {
        <Pagination
          current={currentPage}
          total={deletedReports.data?.length}
          pageSize={itemsPerPage}
          onChange={(page) => setCurrentPage(page)}
          className="mt-6 text-center"
        />
      }
    </section>
  );
};

SoftDeletedReportsArchive.propTypes = {
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

SoftDeletedReportsArchive.defaultProps = {
  reports: [],
  hideButtons: false,
  showFilter: false,
  title: "Case Reports",
  titleStyle: "",
  nameStyle: "",
};

export default SoftDeletedReportsArchive;
