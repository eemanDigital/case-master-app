import React, { useState } from "react";
import {
  Card,
  Descriptions,
  Typography,
  Divider,
  Space,
  Button,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  message,
  Spin,
} from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  FileTextOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import dayjs from "dayjs";
import { fetchRetainerSummary } from "../../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;

const RetainerSummaryReport = ({ matterId }) => {
  const dispatch = useDispatch();
  const summary = useSelector((state) => state.retainer.retainerSummary);
  const loading = useSelector((state) => state.retainer.summaryLoading);

  useEffect(() => {
    if (matterId) {
      dispatch(fetchRetainerSummary(matterId));
    }
  }, [dispatch, matterId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    message.info("PDF export feature coming soon");
  };

  const handleExportExcel = () => {
    message.info("Excel export feature coming soon");
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <div className="flex justify-center items-center p-10">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="shadow-lg">
        <Text type="secondary">No summary available</Text>
      </Card>
    );
  }

  const serviceColumns = [
    {
      title: "Service Type",
      dataIndex: "serviceType",
      key: "serviceType",
    },
    {
      title: "Limit",
      dataIndex: "serviceLimit",
      key: "serviceLimit",
      align: "center",
    },
    {
      title: "Used",
      dataIndex: "usageCount",
      key: "usageCount",
      align: "center",
    },
    {
      title: "Remaining",
      key: "remaining",
      align: "center",
      render: (_, record) => record.serviceLimit - record.usageCount,
    },
    {
      title: "Utilization",
      key: "utilization",
      align: "center",
      render: (_, record) => {
        const rate =
          record.serviceLimit > 0
            ? ((record.usageCount / record.serviceLimit) * 100).toFixed(1)
            : 0;
        return (
          <Tag
            color={rate >= 80 ? "error" : rate >= 50 ? "warning" : "success"}>
            {rate}%
          </Tag>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>Retainer Summary Report</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportPDF}>
            Export PDF
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
            Export Excel
          </Button>
        </Space>
      }
      className="shadow-lg print:shadow-none">
      <div className="summary-report">
        <div className="mb-6 text-center">
          <Title level={3}>Retainer Agreement Summary</Title>
          <Text type="secondary">
            Generated on {dayjs().format("DD MMMM YYYY [at] HH:mm")}
          </Text>
        </div>

        <Divider />

        <Title level={4}>Agreement Details</Title>
        <Descriptions bordered column={2} size="small" className="mb-6">
          <Descriptions.Item label="Matter Number">
            {summary.matter?.matterNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Retainer Type">
            {summary.retainerType}
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {dayjs(summary.agreementStartDate).format("DD MMM YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {dayjs(summary.agreementEndDate).format("DD MMM YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={
                summary.matter?.status === "active"
                  ? "success"
                  : summary.matter?.status === "expired"
                    ? "error"
                    : "default"
              }>
              {summary.matter?.status?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Auto Renewal">
            {summary.autoRenewal ? "Yes" : "No"}
          </Descriptions.Item>
        </Descriptions>

        <Title level={4}>Financial Summary</Title>
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Retainer Fee"
                value={summary.billing?.retainerFee || 0}
                prefix="₦"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Disbursements"
                value={summary.totalDisbursements || 0}
                prefix="₦"
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="VAT"
                value={summary.billing?.vatRate || 0}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="WHT"
                value={summary.billing?.whtRate || 0}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        <Title level={4}>Service Utilization</Title>
        <Table
          dataSource={summary.servicesIncluded || []}
          columns={serviceColumns}
          pagination={false}
          size="small"
          className="mb-6"
        />

        <Title level={4}>Request Statistics</Title>
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Total Requests"
                value={summary.totalRequestsHandled || 0}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Pending"
                value={
                  summary.requests?.filter((r) => r.status === "pending")
                    .length || 0
                }
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Completed"
                value={
                  summary.requests?.filter((r) => r.status === "completed")
                    .length || 0
                }
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>

        <Title level={4}>Scope Description</Title>
        <Card size="small" className="mb-6">
          <Text>{summary.scopeDescription}</Text>
        </Card>

        {summary.exclusions && summary.exclusions.length > 0 && (
          <>
            <Title level={4}>Exclusions</Title>
            <Card size="small" className="mb-6">
              <ul className="list-disc list-inside">
                {summary.exclusions.map((exclusion, index) => (
                  <li key={index}>{exclusion}</li>
                ))}
              </ul>
            </Card>
          </>
        )}

        <Divider />

        <div className="text-center text-gray-500 print:hidden">
          <Text type="secondary">End of Report</Text>
        </div>
      </div>
    </Card>
  );
};

export default RetainerSummaryReport;
