import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Typography,
  Dropdown,
  message,
  Modal,
  Spin,
  Empty,
  Grid,
  Tooltip,
  Badge,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  MoreOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import templateService from "../../redux/features/templates/templateService";
import {
  getGeneratedDocuments,
  updateGeneratedDocument,
  selectGeneratedDocuments,
  selectTemplateLoading,
  selectTemplatePagination,
  resetTemplateState,
} from "../../redux/features/templates/templateSlice";
import DocumentViewer from "../../components/templates/DocumentViewer";
import api from "../../services/api";

const { useBreakpoint } = Grid;
const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

// ─── Status configuration ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  draft: {
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: <EditOutlined />,
    label: "Draft",
  },
  final: {
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    icon: <CheckCircleOutlined />,
    label: "Final",
  },
  signed: {
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: <CheckCircleOutlined />,
    label: "Signed",
  },
  archived: {
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#e5e7eb",
    icon: <InboxOutlined />,
    label: "Archived",
  },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.01em",
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        whiteSpace: "nowrap",
      }}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ─── Document Row Card ────────────────────────────────────────────────────────
const DocumentRow = ({
  record,
  onView,
  onExport,
  onDelete,
  onStatusChange,
  screens,
}) => {
  const [statusLoading, setStatusLoading] = useState(false);

  const handleStatusChange = async (value) => {
    setStatusLoading(true);
    await onStatusChange(record._id, value);
    setStatusLoading(false);
  };

  const exportItems = [
    {
      key: "pdf",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FilePdfOutlined style={{ color: "#ef4444" }} /> Export as PDF
        </span>
      ),
      onClick: () => onExport(record._id, "pdf"),
    },
    {
      key: "docx",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileWordOutlined style={{ color: "#3b82f6" }} /> Export as Word
        </span>
      ),
      onClick: () => onExport(record._id, "docx"),
    },
    {
      key: "txt",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileOutlined style={{ color: "#6b7280" }} /> Export as Text
        </span>
      ),
      onClick: () => onExport(record._id, "txt"),
    },
  ];

  const moreItems = [
    {
      key: "view",
      label: (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EyeOutlined /> View Document
        </span>
      ),
      onClick: () => onView(record),
    },
    { type: "divider" },
    {
      key: "delete",
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#ef4444",
          }}>
          <DeleteOutlined /> Delete
        </span>
      ),
      onClick: () => onDelete(record._id),
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: screens.xl
          ? "2fr 1.2fr 1fr 1fr 140px 160px"
          : screens.lg
            ? "2fr 1.2fr 1fr 140px 160px"
            : screens.md
              ? "2fr 1fr 140px 160px"
              : "1fr 120px 44px",
        alignItems: "center",
        gap: 16,
        padding: "14px 20px",
        background: "#fff",
        borderBottom: "1px solid #f1f5f9",
        transition: "background 0.15s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafbff")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
      {/* Title */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid #bfdbfe",
          }}>
          <FileTextOutlined style={{ color: "#3b82f6", fontSize: 15 }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              color: "#1e293b",
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: screens.xl ? 280 : screens.lg ? 220 : 180,
            }}>
            {record.title}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "#94a3b8",
              marginTop: 2,
              fontFamily: "'DM Sans', sans-serif",
            }}>
            {record.templateId?.title || "Custom Document"}
          </div>
        </div>
      </div>

      {/* Template — hidden below lg on smaller grid */}
      {(screens.xl || screens.lg) && (
        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
          <Tag
            style={{
              borderRadius: 6,
              fontSize: 11,
              padding: "1px 8px",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#475569",
              fontFamily: "'DM Sans', sans-serif",
            }}>
            {record.templateId?.category || "—"}
          </Tag>
        </div>
      )}

      {/* Matter — only xl */}
      {screens.xl && (
        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            fontFamily: "'DM Sans', sans-serif",
          }}>
          {record.matterId?.matterNumber ? (
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                background: "#f1f5f9",
                padding: "2px 7px",
                borderRadius: 5,
                color: "#475569",
              }}>
              {record.matterId.matterNumber}
            </span>
          ) : (
            <span style={{ color: "#cbd5e1" }}>—</span>
          )}
        </div>
      )}

      {/* Generated By — hidden on mobile */}
      {screens.md && (
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: "#475569",
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
            {record.generatedBy
              ? `${record.generatedBy.firstName} ${record.generatedBy.lastName}`
              : "—"}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 1,
            }}>
            <ClockCircleOutlined style={{ fontSize: 10 }} />
            {dayjs(record.createdAt).format("DD MMM YYYY")}
          </div>
        </div>
      )}

      {/* Status select */}
      <div>
        <Select
          value={record.status}
          size="small"
          loading={statusLoading}
          onChange={handleStatusChange}
          style={{ width: 130 }}
          dropdownStyle={{ borderRadius: 10 }}
          styles={{
            selector: {
              borderRadius: 20,
              border: `1px solid ${STATUS_CONFIG[record.status]?.border || "#e2e8f0"}`,
              background: STATUS_CONFIG[record.status]?.bg || "#f9fafb",
              color: STATUS_CONFIG[record.status]?.color || "#6b7280",
              fontWeight: 600,
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
            },
          }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Select.Option key={key} value={key}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: cfg.color,
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                {cfg.icon} {cfg.label}
              </span>
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Tooltip title="View Document">
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
            style={{
              borderRadius: 7,
              color: "#475569",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </Tooltip>

        <Dropdown
          menu={{ items: exportItems }}
          trigger={["click"]}
          placement="bottomRight">
          <Tooltip title="Export">
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              style={{
                borderRadius: 7,
                color: "#3b82f6",
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </Tooltip>
        </Dropdown>

        <Dropdown
          menu={{ items: moreItems }}
          trigger={["click"]}
          placement="bottomRight">
          <Button
            size="small"
            type="text"
            icon={<MoreOutlined />}
            style={{
              borderRadius: 7,
              color: "#94a3b8",
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </Dropdown>
      </div>
    </div>
  );
};

// ─── Table Header ─────────────────────────────────────────────────────────────
const TableHeader = ({ screens }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: screens.xl
        ? "2fr 1.2fr 1fr 1fr 140px 160px"
        : screens.lg
          ? "2fr 1.2fr 1fr 140px 160px"
          : screens.md
            ? "2fr 1fr 140px 160px"
            : "1fr 120px 44px",
      gap: 16,
      padding: "10px 20px",
      background: "#f8fafc",
      borderBottom: "2px solid #e2e8f0",
      borderRadius: "12px 12px 0 0",
    }}>
    {[
      "Document",
      screens.xl || screens.lg ? "Category" : null,
      screens.xl ? "Matter" : null,
      screens.md ? "Generated By" : null,
      "Status",
      "Actions",
    ]
      .filter(Boolean)
      .map((label, i) => (
        <div
          key={i}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "'DM Sans', sans-serif",
          }}>
          {label}
        </div>
      ))}
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, count, color, bg, border, icon }) => (
  <div
    style={{
      padding: "14px 18px",
      borderRadius: 12,
      background: bg,
      border: `1px solid ${border}`,
      display: "flex",
      alignItems: "center",
      gap: 12,
      flex: "1 1 120px",
    }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        background: color + "22",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        fontSize: 16,
      }}>
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#1e293b",
          lineHeight: 1,
          fontFamily: "'DM Sans', sans-serif",
        }}>
        {count}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: "#94a3b8",
          marginTop: 3,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
        }}>
        {label}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const GeneratedDocumentsList = () => {
  const dispatch = useDispatch();
  const documents = useSelector(selectGeneratedDocuments);
  const loading = useSelector(selectTemplateLoading);
  const pagination = useSelector(selectTemplatePagination);
  const screens = useBreakpoint();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [dateFilterModalVisible, setDateFilterModalVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  const getParams = useCallback(
    () => ({
      page: pagination.current,
      limit: pagination.limit,
      search: search || undefined,
      status: status || undefined,
      ...(dateRange && {
        startDate: dateRange[0]?.toISOString(),
        endDate: dateRange[1]?.toISOString(),
      }),
    }),
    [pagination.current, pagination.limit, search, status, dateRange],
  );

  const fetchDocuments = useCallback(() => {
    dispatch(getGeneratedDocuments(getParams()));
  }, [dispatch, getParams]);

  useEffect(() => {
    fetchDocuments();
    return () => dispatch(resetTemplateState());
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [search, status, dateRange, pagination.current]);

  const handleView = (record) => {
    setSelectedDoc(record);
    setViewerVisible(true);
  };

  const handleStatusChange = async (docId, newStatus) => {
    try {
      await dispatch(
        updateGeneratedDocument({ id: docId, data: { status: newStatus } }),
      ).unwrap();
      message.success("Status updated");
      fetchDocuments();
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleExport = async (docId, format) => {
    setExportingId(docId);
    try {
      const blob = await templateService.exportDocument(docId, format);

      const mimeTypes = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain",
      };

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: mimeTypes[format] }),
      );
      const a = document.createElement("a");
      a.href = url;
      const doc = documents?.find((d) => d._id === docId);
      a.download = `${doc?.title || "document"}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error("Export error:", err);
      message.error("Failed to export document");
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = (docId) => {
    Modal.confirm({
      title: "Delete Document",
      content:
        "Are you sure you want to permanently delete this document? This cannot be undone.",
      okText: "Delete",
      okType: "danger",
      okButtonProps: { style: { borderRadius: 8 } },
      cancelButtonProps: { style: { borderRadius: 8 } },
      onOk: async () => {
        try {
          await api.delete(`/templates/documents/${docId}`);
          message.success("Document deleted");
          fetchDocuments();
        } catch {
          message.error("Failed to delete document");
        }
      },
    });
  };

  // Compute stats from current documents
  const stats = documents?.reduce(
    (acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    },
    { draft: 0, final: 0, signed: 0, archived: 0 },
  );

  return (
    <>
      {/* Load DM Sans font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div
        style={{
          padding: screens.xs ? 12 : screens.md ? 20 : 28,
          minHeight: "100vh",
          background: "#f1f5f9",
          fontFamily: "'DM Sans', sans-serif",
        }}>
        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}>
          <div>
            <div
              style={{
                fontSize: screens.xs ? 20 : 26,
                fontWeight: 800,
                color: "#0f172a",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}>
              Generated Documents
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "#64748b",
                marginTop: 4,
                fontFamily: "'DM Sans', sans-serif",
              }}>
              All documents created from your legal templates
            </div>
          </div>
          <Badge
            count={pagination.totalRecords}
            overflowCount={999}
            style={{
              backgroundColor: "#3b82f6",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 12,
              boxShadow: "none",
              borderRadius: 8,
              padding: "0 10px",
              height: 24,
              lineHeight: "24px",
            }}
          />
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        {!screens.xs && documents?.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 20,
              flexWrap: "wrap",
            }}>
            <StatCard
              label="Drafts"
              count={stats?.draft || 0}
              color="#3b82f6"
              bg="#eff6ff"
              border="#bfdbfe"
              icon={<EditOutlined />}
            />
            <StatCard
              label="Final"
              count={stats?.final || 0}
              color="#10b981"
              bg="#ecfdf5"
              border="#a7f3d0"
              icon={<CheckCircleOutlined />}
            />
            <StatCard
              label="Signed"
              count={stats?.signed || 0}
              color="#f59e0b"
              bg="#fffbeb"
              border="#fde68a"
              icon={<CheckCircleOutlined />}
            />
            <StatCard
              label="Archived"
              count={stats?.archived || 0}
              color="#6b7280"
              bg="#f9fafb"
              border="#e5e7eb"
              icon={<InboxOutlined />}
            />
          </div>
        )}

        {/* ── Filter Bar ─────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "14px 18px",
            marginBottom: 16,
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
          <SearchOutlined style={{ color: "#94a3b8", fontSize: 15 }} />
          <Search
            placeholder="Search by document title..."
            allowClear
            onSearch={(v) => setSearch(v)}
            onChange={(e) => !e.target.value && setSearch("")}
            style={{ width: screens.xs ? "100%" : 260 }}
            styles={{
              affixWrapper: {
                borderRadius: 9,
                border: "1.5px solid #e2e8f0",
                background: "#f8fafc",
                fontFamily: "'DM Sans', sans-serif",
              },
            }}
          />

          <div
            style={{
              width: 1,
              height: 24,
              background: "#e2e8f0",
              display: screens.xs ? "none" : "block",
            }}
          />

          <FilterOutlined style={{ color: "#94a3b8", fontSize: 14 }} />
          <Select
            placeholder="All Statuses"
            allowClear
            style={{ width: screens.xs ? "100%" : 150 }}
            onChange={(v) => setStatus(v)}
            styles={{
              selector: {
                borderRadius: 9,
                border: "1.5px solid #e2e8f0",
                background: "#f8fafc",
                fontFamily: "'DM Sans', sans-serif",
              },
            }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <Select.Option key={key} value={key}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: cfg.color,
                    fontWeight: 600,
                    fontSize: 12,
                  }}>
                  {cfg.icon} {cfg.label}
                </span>
              </Select.Option>
            ))}
          </Select>

          {!screens.xs && (
            <>
              <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />
              <CalendarOutlined style={{ color: "#94a3b8", fontSize: 14 }} />
              <RangePicker
                onChange={(dates) => setDateRange(dates)}
                style={{ borderRadius: 9 }}
                placeholder={["Start date", "End date"]}
                format="DD/MM/YYYY"
                styles={{
                  popup: { fontFamily: "'DM Sans', sans-serif" },
                }}
              />
            </>
          )}

          {screens.xs && (
            <Button
              icon={<CalendarOutlined />}
              onClick={() => setDateFilterModalVisible(true)}
              style={{
                borderRadius: 9,
                border: "1.5px solid #e2e8f0",
                background: "#f8fafc",
                fontFamily: "'DM Sans', sans-serif",
                color: dateRange ? "#3b82f6" : "#64748b",
                width: "100%",
              }}>
              {dateRange
                ? `${dateRange[0]?.format("DD/MM")} – ${dateRange[1]?.format("DD/MM")}`
                : "Filter by date range"}
            </Button>
          )}
        </div>

        {/* ── Documents Table ─────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            background: "#fff",
          }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 80,
                gap: 16,
              }}>
              <Spin size="large" />
              <div
                style={{
                  color: "#94a3b8",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                }}>
                Loading documents...
              </div>
            </div>
          ) : !documents?.length ? (
            <div style={{ padding: "60px 24px" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: "#94a3b8",
                      fontSize: 14,
                    }}>
                    {search || status || dateRange
                      ? "No documents match your filters"
                      : "No documents generated yet"}
                  </div>
                }
              />
            </div>
          ) : (
            <>
              <TableHeader screens={screens} />
              {documents.map((record, idx) => (
                <DocumentRow
                  key={record._id}
                  record={record}
                  onView={handleView}
                  onExport={handleExport}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  screens={screens}
                  isExporting={exportingId === record._id}
                />
              ))}

              {/* ── Pagination ───────────────────────────────────────────── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderTop: "1px solid #f1f5f9",
                  background: "#fafbff",
                  flexWrap: "wrap",
                  gap: 10,
                }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                  Showing{" "}
                  <strong style={{ color: "#475569" }}>
                    {(pagination.current - 1) * pagination.limit + 1}–
                    {Math.min(
                      pagination.current * pagination.limit,
                      pagination.totalRecords,
                    )}
                  </strong>{" "}
                  of{" "}
                  <strong style={{ color: "#475569" }}>
                    {pagination.totalRecords}
                  </strong>{" "}
                  documents
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button
                    size="small"
                    disabled={pagination.current <= 1}
                    onClick={() =>
                      dispatch(
                        getGeneratedDocuments({
                          ...getParams(),
                          page: pagination.current - 1,
                        }),
                      )
                    }
                    style={{
                      borderRadius: 8,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: 12,
                      border: "1.5px solid #e2e8f0",
                    }}>
                    ← Previous
                  </Button>
                  {Array.from(
                    { length: Math.min(pagination.total, 5) },
                    (_, i) => {
                      const page = i + 1;
                      const isActive = page === pagination.current;
                      return (
                        <Button
                          key={page}
                          size="small"
                          onClick={() =>
                            dispatch(
                              getGeneratedDocuments({
                                ...getParams(),
                                page,
                              }),
                            )
                          }
                          style={{
                            borderRadius: 8,
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 12,
                            minWidth: 32,
                            border: isActive
                              ? "1.5px solid #3b82f6"
                              : "1.5px solid #e2e8f0",
                            background: isActive ? "#eff6ff" : "#fff",
                            color: isActive ? "#3b82f6" : "#475569",
                          }}>
                          {page}
                        </Button>
                      );
                    },
                  )}
                  <Button
                    size="small"
                    disabled={pagination.current >= pagination.total}
                    onClick={() =>
                      dispatch(
                        getGeneratedDocuments({
                          ...getParams(),
                          page: pagination.current + 1,
                        }),
                      )
                    }
                    style={{
                      borderRadius: 8,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: 12,
                      border: "1.5px solid #e2e8f0",
                    }}>
                    Next →
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Status Guide ────────────────────────────────────────────────── */}
        {!screens.xs && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "10px 16px",
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              flexWrap: "wrap",
            }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "'DM Sans', sans-serif",
              }}>
              Status flow:
            </span>
            {Object.entries(STATUS_CONFIG).map(([key, cfg], i, arr) => (
              <span
                key={key}
                style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusBadge status={key} />
                {i < arr.length - 1 && (
                  <span style={{ color: "#cbd5e1", fontSize: 14 }}>→</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile Date Filter Modal ─────────────────────────────────────── */}
      <Modal
        title="Filter by Date"
        open={dateFilterModalVisible}
        onOk={() => setDateFilterModalVisible(false)}
        onCancel={() => {
          setDateFilterModalVisible(false);
          setDateRange(null);
        }}
        okText="Apply"
        cancelText="Clear"
        styles={{ body: { padding: "20px 0 0" } }}>
        <RangePicker
          onChange={(dates) => setDateRange(dates)}
          style={{ width: "100%" }}
          format="DD/MM/YYYY"
        />
      </Modal>

      {/* ── Document Viewer ──────────────────────────────────────────────── */}
      {selectedDoc && (
        <DocumentViewer
          visible={viewerVisible}
          document={selectedDoc}
          onClose={() => {
            setViewerVisible(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </>
  );
};

export default GeneratedDocumentsList;
