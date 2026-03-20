import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Select,
  DatePicker,
  Button,
  Typography,
  Spin,
  Tag,
  Progress,
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  AlertOutlined,
  TrophyOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchPerformanceReport,
  fetchDeadlineStats,
  selectPerformanceReport,
  selectDeadlineStats,
  selectDeadlineLoading,
  exportPerformanceReport,
} from "../../redux/features/deadlines/deadlineSlice";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { MonthPicker } = DatePicker;

const PerformanceReportPage = () => {
  const dispatch = useDispatch();
  const report = useSelector(selectPerformanceReport);
  const stats = useSelector(selectDeadlineStats);
  const loading = useSelector(selectDeadlineLoading);

  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  useEffect(() => {
    dispatch(fetchDeadlineStats());
    dispatch(fetchPerformanceReport({ year, month }));
  }, [dispatch, year, month]);

  const handleExport = async () => {
    try {
      const blob = await dispatch(exportPerformanceReport({ year, month })).unwrap();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `deadline-performance-${year}-${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const columns = [
    { title: "User", dataIndex: "user", key: "user", render: (u) => `${u?.firstName || ""} ${u?.lastName || ""}` },
    { title: "Total", dataIndex: "total", key: "total" },
    { title: "Completed", dataIndex: "completed", key: "completed", render: (v) => <Tag color="green">{v}</Tag> },
    { title: "Overdue", dataIndex: "overdue", key: "overdue", render: (v) => <Tag color="red">{v}</Tag> },
    { title: "On Time Rate", dataIndex: "onTimeRate", key: "onTimeRate", render: (v) => <Progress percent={Math.round(v)} size="small" /> },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ padding: 24, background: "#f1f5f9", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Performance Report</Title>
            <Text type="secondary">Deadline completion analytics for your firm</Text>
          </div>
          <Space>
            <Select value={year} onChange={setYear} style={{ width: 120 }} options={Array.from({ length: 5 }, (_, i) => ({ value: dayjs().year() - i, label: dayjs().year() - i }))} />
            <MonthPicker value={dayjs().month(month - 1)} onChange={(d) => d && setMonth(d.month() + 1)} placeholder="Select month" />
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchPerformanceReport({ year, month }))}>Refresh</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Total Deadlines" value={stats?.total || 0} prefix={<FileTextOutlined style={{ color: "#3b82f6" }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Completed" value={stats?.completed || 0} prefix={<CheckCircleOutlined style={{ color: "#10b981" }} />} valueStyle={{ color: "#10b981" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Overdue" value={stats?.overdue || 0} prefix={<AlertOutlined style={{ color: "#ef4444" }} />} valueStyle={{ color: "#ef4444" }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Completion Rate" value={`${report?.overallRate || 0}%`} prefix={<TrophyOutlined style={{ color: "#f59e0b" }} />} valueStyle={{ color: "#f59e0b" }} />
            </Card>
          </Col>
        </Row>

        <Card bordered={false} style={{ borderRadius: 12 }} title="User Performance">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
          ) : (
            <Table
              dataSource={report?.byUser || []}
              columns={columns}
              rowKey="user"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>

        <Card bordered={false} style={{ borderRadius: 12, marginTop: 16 }} title="Monthly Trend">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(report?.monthlyTrend || []).map((m) => (
              <div key={m.month} style={{ padding: 12, background: "#f8fafc", borderRadius: 8, minWidth: 100, textAlign: "center" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{m.month}</Text>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{m.completed}/{m.total}</div>
                <Progress percent={m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0} size="small" showInfo={false} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
};

export default PerformanceReportPage;
