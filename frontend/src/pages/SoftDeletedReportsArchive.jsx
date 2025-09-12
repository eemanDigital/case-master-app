import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  Card,
  Typography,
  Space,
  Pagination,
  Tooltip,
  Button,
  Modal,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";

import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
import { formatDate } from "../utils/formatDate";
import useTextShorten from "../hooks/useTextShorten";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useCallback } from "react";
import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import useRestoreItem from "../hooks/useRestoreItem";

const { Title, Text } = Typography;
const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

const SoftDeletedReportsArchive = () => {
  const { deletedReports, loading, error, fetchData } = useDataGetterHook();
  const { isSuperAdmin } = useAdminHook();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const restoreItem = useRestoreItem(baseURL, fetchData);

  //  fetch reports
  const fetchReports = useCallback(() => {
    fetchData("reports/soft-deleted-reports", "deletedReports");
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  const {
    isError: deleteError,
    isSuccess: deleteSuccess,
    message: deleteMsg,
  } = useSelector((state) => state.delete); // get delete state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const { shortenText } = useTextShorten();

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

  // // Delete report
  const deleteReport = async (id) => {
    try {
      await dispatch(deleteData(`reports/${id}`));
      fetchData("reports", "reports");
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  console.log(deletedReports, "deletedReports");

  return (
    <section className="w-full   rounded-lg sm:px-6 px-2 ">
      <Title level={2}>Deleted Reports</Title>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6"></div>
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

                <div className="flex flex-col space-y-1 md:space-y-0 md:flex-row md:space-x-4 bg-gray-100 p-2 rounded  ">
                  <Text className="font-poppins  font-medium">
                    Deleted By:{" "}
                    <span className="text-gray-700">
                      {`${report?.deletedBy?.firstName} ${report?.reportedBy?.lastName}`}
                    </span>
                  </Text>

                  <Text className="font-poppins  font-medium">
                    Role:{" "}
                    <span className="text-green-500">
                      {report?.deletedBy?.role || "N/A"}
                    </span>
                  </Text>

                  <Text className="font-poppins  font-medium">
                    Deleted On:{" "}
                    <span className="text-red-500">
                      {formatDate(report?.deletedAt)}
                    </span>
                  </Text>
                </div>
              </Space>

              <Tooltip title="Restore Case">
                <Button
                  onClick={() =>
                    restoreItem(
                      "reports",
                      report._id,
                      "deletedReports",
                      "reports/soft-deleted-reports"
                    )
                  }
                  className="bg-purple-200 text-purple-500"
                  icon={<MdOutlineSettingsBackupRestore size={20} />}
                />
              </Tooltip>

              <div className="flex justify-end mt-4 space-x-2">
                {(isSuperAdmin ||
                  report?.reportedBy?._id === user?.data?._id) && (
                  <Tooltip title="Delete Report">
                    <Button
                      icon={<DeleteOutlined />}
                      className="bg-red-500 text-white hover:bg-red-600"
                      onClick={() => {
                        Modal.confirm({
                          title: "Are you sure you want to delete this report?",
                          onOk: () => deleteReport(report?._id),
                        });
                      }}
                    />
                  </Tooltip>
                )}
              </div>
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
