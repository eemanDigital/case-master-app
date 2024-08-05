import { useState } from "react";
import { Table, Card, Button, Typography, Space } from "antd";
import { DownloadOutlined, UserAddOutlined } from "@ant-design/icons";
import { formatDate } from "../utils/formatDate";
import LawyersInCourtForm from "../pages/LawyersInCourtForm";
import { useAdminHook } from "../hooks/useAdminHook";
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
}) => {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const { isSuperOrAdmin } = useAdminHook();

  if (errorCauseList) return toast.error(errorCauseList);

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

  const data = causeListData?.map((report) => ({
    key: report._id,
    case: `${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`,
    adjournedFor: report?.adjournedFor,
    adjournedDate: formatDate(report?.adjournedDate),
    lawyersInCourt: report?.lawyersInCourt,
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {addResultNumber && (
        <Card>
          <Title
            level={2}
            style={h1Style || { textAlign: "center", color: "#1890ff" }}>
            {title || `Number of Cases: ${result}`}
          </Title>
        </Card>
      )}
      <Card>
        <Table
          onRow={(record) => ({
            onClick: () => onRowClick(record),
          })}
          columns={columns}
          dataSource={data}
          loading={loadingCauseList}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
        {showDownloadBtn && (
          <Button
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

export default SingleCauseList;
