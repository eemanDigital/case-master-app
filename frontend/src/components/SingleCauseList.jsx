import PropTypes from "prop-types";
import { useState } from "react";
import { Table, Card, Button, Typography, Space } from "antd";
import { DownloadOutlined, UserAddOutlined } from "@ant-design/icons";
import { formatDate } from "../utils/formatDate";
import LawyersInCourtForm from "../pages/LawyersInCourtForm";
import { useAdminHook } from "../hooks/useAdminHook";
import PageErrorAlert from "./PageErrorAlert";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

const SingleCauseList = ({
  causeListData,
  loadingCauseList,
  errorCauseList,
  addResultNumber,
  result,
  onDownloadCauseList,
  title,
  showDownloadBtn,
  hideButton,
  h1Style,
  loadingPdf,
  pdfError,
  cardWidth,
}) => {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const { isSuperOrAdmin } = useAdminHook();

  if (pdfError) {
    return toast.error(pdfError || "Failed to download document"); //pdf error toast
  }

  // cause list data error toast
  if (errorCauseList)
    return (
      <PageErrorAlert
        errorCondition={errorCauseList}
        errorMessage={errorCauseList}
      />
    );

  const onRowClick = (record) => {
    if (isSuperOrAdmin) {
      setSelectedReportId(record.key);
    }
  };

  const columns = [
    {
      title: "Case",
      dataIndex: "case",
      key: "case",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Adjourned For",
      dataIndex: "adjournedFor",
      key: "adjournedFor",
    },
    {
      title: "Adjourned Date",
      dataIndex: "adjournedDate",
      key: "adjournedDate",
    },
    {
      title: "Lawyers In Court",
      dataIndex: "lawyersInCourt",
      key: "lawyersInCourt",
      render: (lawyersInCourt) =>
        lawyersInCourt.length > 0 ? (
          <ul className="list-none p-0">
            {lawyersInCourt.map((lawyer, index) => (
              <li key={index} className="text-blue-600 capitalize">
                {lawyer.firstName} {lawyer.lastName},{" "}
                <Text type="secondary">Esq.</Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text type="danger">Not Yet Assigned</Text>
        ),
    },
    !hideButton && {
      title: "Action",
      key: "action",
      render: (_, record) =>
        isSuperOrAdmin && selectedReportId === record.key ? (
          <LawyersInCourtForm reportId={record.key} />
        ) : (
          <Button
            className="blue-btn"
            icon={<UserAddOutlined />}
            onClick={() => setSelectedReportId(record.key)}>
            Assign Lawyer
          </Button>
        ),
    },
  ].filter(Boolean);

  // Transform causeListData into a structure compatible with the Table component
  const data = causeListData?.map((report) => ({
    key: report._id,
    case: `${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`,
    adjournedFor: report?.adjournedFor,
    adjournedDate: formatDate(report?.adjournedDate),
    lawyersInCourt: report?.lawyersInCourt,
  }));

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: cardWidth || "100%" }}>
      {addResultNumber && (
        <Card>
          {
            <Title
              level={2}
              style={h1Style || { textAlign: "center", color: "#1890ff" }}>
              {title || `Number of Cases: ${result}`}
            </Title>
          }
        </Card>
      )}
      <Card title={title || "Cause List"}>
        <Table
          onRow={(record) => ({
            onClick: () => onRowClick(record),
          })}
          columns={columns}
          dataSource={data}
          loading={loadingCauseList}
          pagination={!hideButton && { pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
        {showDownloadBtn && (
          <Button
            loading={loadingPdf}
            className="blue-btn"
            icon={<DownloadOutlined />}
            onClick={onDownloadCauseList}
            style={{ marginTop: 16 }}>
            Download Cause List
          </Button>
        )}
      </Card>
    </Space>
  );
};

// prop type validation
SingleCauseList.propTypes = {
  causeListData: PropTypes.arrayOf(
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
        thirdParty: PropTypes.shape({
          name: PropTypes.arrayOf(
            PropTypes.shape({
              name: PropTypes.string, // Made optional to avoid warnings
            })
          ),
        }),
      }).isRequired,
      adjournedFor: PropTypes.string,
      adjournedDate: PropTypes.string,
      lawyersInCourt: PropTypes.arrayOf(
        PropTypes.shape({
          firstName: PropTypes.string.isRequired,
          lastName: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  loadingCauseList: PropTypes.bool.isRequired,
  errorCauseList: PropTypes.string,
  addResultNumber: PropTypes.bool,
  result: PropTypes.number,
  onDownloadCauseList: PropTypes.func.isRequired,
  title: PropTypes.string,
  showDownloadBtn: PropTypes.bool,
  hideButton: PropTypes.bool,
  h1Style: PropTypes.string,
  loadingPdf: PropTypes.bool,
  pdfError: PropTypes.string,
  cardWidth: PropTypes.string,
};

SingleCauseList.defaultProps = {
  causeListData: [], // Provide a default empty array
};
export default SingleCauseList;
