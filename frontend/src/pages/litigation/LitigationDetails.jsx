import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Tabs, Tag, message, Skeleton, Descriptions } from "antd";
import {
  EditOutlined,
  DownloadOutlined,
  PrinterOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  AuditOutlined,
  SnippetsOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import MatterDetailsCard from "../../components/litigation/MatterDetailsCard";
import JudgmentRecordModal from "../../components/litigation/JudgmentRecordModal";
import SettlementRecordModal from "../../components/litigation/SettlementRecordModal";
import AppealFilingModal from "../../components/litigation/AppealFilingModal";
import HearingTimeline from "../../components/litigation/HearingTimeline";
import StatusTag from "../../components/common/StatusTag";
import CourtOrdersList from "../../components/litigation/CourtOrdersList";

import {
  fetchLitigationDetails,
  selectSelectedDetails,
  selectDetailsLoading,
} from "../../redux/features/litigation/litigationSlice";

import litigationService from "../../redux/features/litigation/litigationService";

import {
  formatDate,
  formatCurrency,
  downloadFile,
  getExportFilename,
} from "../../utils/formatters";
import {
  JUDGMENT_OUTCOMES,
  APPEAL_STATUS,
} from "../../utils/litigationConstants";
import LitigationSteps from "../../components/litigation/LitigationSteps";

// ─── Shared empty state ───────────────────────────────────────────────────────
const EmptySection = ({ message: msg = "No data recorded yet" }) => (
  <div className="flex flex-col items-center justify-center py-8 sm:py-16 text-gray-400">
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 sm:mb-4">
      <FileTextOutlined className="text-xl sm:text-2xl text-gray-300" />
    </div>
    <p className="text-xs sm:text-sm font-medium">{msg}</p>
  </div>
);

// ─── Action pill button ───────────────────────────────────────────────────────
const PillButton = ({ onClick, icon, children, variant = "default" }) => {
  const styles = {
    default:
      "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400",
    violet:
      "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-400",
  };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg border transition-all duration-150 shadow-sm ${styles[variant]}`}>
      {icon}
      {children}
    </button>
  );
};

// ─── Single process row ───────────────────────────────────────────────────────
const ProcessItem = ({ process, index }) => (
  <div
    key={index}
    className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
    <div>
      <p className="text-xs sm:text-sm font-medium text-gray-900">
        {process.name}
      </p>
      {process.filingDate && (
        <p className="text-xs text-gray-400 mt-0.5">
          Filed: {formatDate(process.filingDate)}
        </p>
      )}
    </div>
    <Tag
      color={process.status === "completed" ? "success" : "processing"}
      className="!rounded-full !text-xs !capitalize">
      {process.status}
    </Tag>
  </div>
);

// ─── Processes tab ────────────────────────────────────────────────────────────
const ProcessesTab = ({ litigationDetails }) => {
  const first = litigationDetails?.firstParty?.processesFiled || [];
  const second = litigationDetails?.secondParty?.processesFiled || [];

  if (!first.length && !second.length)
    return <EmptySection message="No processes filed yet" />;

  return (
    <div className="space-y-6">
      {first.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <TeamOutlined /> First Party Processes
          </h4>
          <div className="space-y-2">
            {first.map((p, i) => (
              <ProcessItem key={i} process={p} index={i} />
            ))}
          </div>
        </div>
      )}
      {second.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <TeamOutlined /> Second Party Processes
          </h4>
          <div className="space-y-2">
            {second.map((p, i) => (
              <ProcessItem key={i} process={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const DetailsSkeleton = () => (
  <div className="min-h-screen bg-[#f5f6fa] p-6 space-y-4">
    <Skeleton active paragraph={{ rows: 2 }} />
    <Skeleton active paragraph={{ rows: 6 }} />
    <Skeleton active paragraph={{ rows: 10 }} />
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const LitigationDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();

  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("hearings");

  const litigationDetails = useSelector(selectSelectedDetails);
  const loading = useSelector(selectDetailsLoading);

  useEffect(() => {
    if (matterId) {
      dispatch(fetchLitigationDetails(matterId));
    }
  }, [matterId, dispatch]);

  // ─── Stabilise hearings array reference ───────────────────────────────────
  const stableHearingsRef = useRef([]);
  const prevFingerprintRef = useRef(null);

  if (litigationDetails?.hearings) {
    const h = litigationDetails.hearings;
    const fingerprint = `${h.length}-${h[0]?._id ?? ""}-${h[h.length - 1]?._id ?? ""}`;
    if (fingerprint !== prevFingerprintRef.current) {
      stableHearingsRef.current = h;
      prevFingerprintRef.current = fingerprint;
    }
  } else {
    stableHearingsRef.current = [];
    prevFingerprintRef.current = null;
  }

  const stableHearings = stableHearingsRef.current;

  const handleEdit = useCallback(() => {
    navigate(`/dashboard/matters/litigation/${matterId}/edit`);
  }, [navigate, matterId]);

  const handleExport = useCallback(
    async (format = "pdf") => {
      try {
        setExportLoading(true);
        const blob = await litigationService.exportSingleMatter(
          matterId,
          format,
        );
        const filename = getExportFilename(
          `litigation_${litigationDetails?.suitNo}`,
          format,
        );
        downloadFile(blob, filename);
        message.success("Matter exported successfully");
      } catch {
        message.error("Failed to export matter");
      } finally {
        setExportLoading(false);
      }
    },
    [matterId, litigationDetails?.suitNo],
  );

  const handlePrint = useCallback(() => window.print(), []);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading && !litigationDetails) return <DetailsSkeleton />;

  if (!litigationDetails) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <FileTextOutlined className="text-4xl text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Details Not Found
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            No litigation details are available for this matter.
          </p>
          <button
            onClick={() => navigate("/dashboard/matters/litigation")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors">
            <ArrowLeftOutlined /> Back to Litigation
          </button>
        </div>
      </div>
    );
  }

  const matter = litigationDetails.matter;

  // Build tab items array cleanly — no JSX comments inside array literals
  const tabItems = [
    // ── Hearings ──────────────────────────────────────────────────────────
    {
      key: "hearings",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <CalendarOutlined />
          <span className="hidden sm:inline">Hearings</span>
        </span>
      ),
      children: (
        <div className="p-2 sm:p-4 md:p-6">
          <HearingTimeline matterId={matterId} hearings={stableHearings} />
        </div>
      ),
    },

    // ── Processes ─────────────────────────────────────────────────────────
    {
      key: "processes",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <FileTextOutlined />
          <span className="hidden sm:inline">Processes</span>
        </span>
      ),
      children: (
        <div className="p-2 sm:p-4 md:p-6">
          {litigationDetails.processes?.length > 0 ? (
            <div className="space-y-3">
              {litigationDetails.processes.map((process, index) => (
                <ProcessItem key={index} process={process} index={index} />
              ))}
            </div>
          ) : (
            <EmptySection message="No processes filed yet" />
          )}
        </div>
      ),
    },

    // ── Court Orders ──────────────────────────────────────────────────────
    {
      key: "orders",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <TeamOutlined />
          <span className="hidden sm:inline">Court Orders</span>
        </span>
      ),
      children: (
        <div className="p-2 sm:p-4 md:p-6">
          <CourtOrdersList matterId={matterId} />
        </div>
      ),
    },

    // ── Judgment ──────────────────────────────────────────────────────────
    {
      key: "judgment",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <AuditOutlined />
          <span className="hidden sm:inline">Judgment</span>
        </span>
      ),
      children: (
        <div className="p-2 sm:p-4 md:p-6">
          {litigationDetails.judgment?.outcome ? (
            <Descriptions
              column={{ xs: 1, sm: 2, md: 2 }}
              bordered
              size="small">
              <Descriptions.Item label="Outcome">
                <StatusTag
                  status={litigationDetails.judgment.outcome}
                  configArray={JUDGMENT_OUTCOMES}
                />
              </Descriptions.Item>
              {litigationDetails.judgment.damages > 0 && (
                <Descriptions.Item label="Damages Awarded">
                  {formatCurrency(litigationDetails.judgment.damages)}
                </Descriptions.Item>
              )}
              {litigationDetails.judgment.costs > 0 && (
                <Descriptions.Item label="Costs">
                  {formatCurrency(litigationDetails.judgment.costs)}
                </Descriptions.Item>
              )}
              {litigationDetails.judgment.judgmentSummary && (
                <Descriptions.Item label="Summary" span={2}>
                  {litigationDetails.judgment.judgmentSummary}
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <EmptySection message="No judgment recorded yet" />
          )}
        </div>
      ),
    },

    // ── Appeal ────────────────────────────────────────────────────────────
    {
      key: "appeal",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <TrophyOutlined />
          <span className="hidden sm:inline">Appeal</span>
        </span>
      ),
      children: (
        <div className="p-2 sm:p-4 md:p-6">
          {litigationDetails.appeal?.isAppealed ? (
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Appeal Filed">
                <Tag color="blue">Yes</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Appeal Date">
                {formatDate(litigationDetails.appeal.appealDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Appeal Court">
                {litigationDetails.appeal.appealCourt}
              </Descriptions.Item>
              <Descriptions.Item label="Appeal Suit No">
                {litigationDetails.appeal.appealSuitNo}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <StatusTag
                  status={litigationDetails.appeal.appealStatus}
                  configArray={APPEAL_STATUS}
                />
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <EmptySection message="No appeal filed" />
          )}
        </div>
      ),
    },

    // ── Settlement ────────────────────────────────────────────────────────
    {
      key: "settlement",
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <CheckCircleOutlined />
          <span className="hidden sm:inline">Settlement</span>
        </span>
      ),
      children: (
        <div className="p-2 sm:p-4 md:p-6">
          {litigationDetails.settlement?.isSettled ? (
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Settled">
                <Tag color="green">Yes</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Settlement Date">
                {formatDate(litigationDetails.settlement.settlementDate)}
              </Descriptions.Item>
              {litigationDetails.settlement.settlementAmount > 0 && (
                <Descriptions.Item label="Amount" span={2}>
                  {formatCurrency(
                    litigationDetails.settlement.settlementAmount,
                  )}
                </Descriptions.Item>
              )}
              {litigationDetails.settlement.settlementTerms && (
                <Descriptions.Item label="Terms" span={2}>
                  {litigationDetails.settlement.settlementTerms}
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <EmptySection message="No settlement recorded" />
          )}
        </div>
      ),
    },

    // ── Precedents (only shown when data exists) ──────────────────────────
    ...(litigationDetails.precedents?.length > 0
      ? [
          {
            key: "precedents",
            label: (
              <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                <SnippetsOutlined />
                <span className="hidden sm:inline">Precedents</span>
              </span>
            ),
            children: (
              <div className="p-2 sm:p-4 md:p-6 space-y-3">
                {litigationDetails.precedents.map((precedent, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900">
                      {precedent.caseName}
                    </h4>
                    {precedent.citation && (
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {precedent.citation}
                      </p>
                    )}
                    {precedent.relevance && (
                      <p className="text-sm text-gray-700 mt-2">
                        {precedent.relevance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ),
          },
        ]
      : []),
  ];

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 md:py-4">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <button
                onClick={() => navigate("/dashboard/matters/litigation")}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                <ArrowLeftOutlined />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm md:text-base font-bold text-gray-900 truncate leading-tight">
                  {matter?.title || "Litigation Matter"}
                </h1>
                <p className="text-xs text-gray-400 font-mono mt-0.5 hidden sm:block">
                  Suit No: {litigationDetails.suitNo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <button
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <PrinterOutlined />
                <span className="hidden md:inline">Print</span>
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={exportLoading}
                className="inline-flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                <DownloadOutlined />
                <span className="hidden md:inline">
                  {exportLoading ? "Exporting…" : "Export PDF"}
                </span>
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors">
                <EditOutlined />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>

          {/* Case action strip */}
          <div className="flex flex-wrap gap-2">
            <PillButton
              onClick={() => setShowJudgmentModal(true)}
              icon={<AuditOutlined />}>
              {litigationDetails.judgment ? "Edit Judgment" : "Record Judgment"}
            </PillButton>
            <PillButton
              onClick={() => setShowSettlementModal(true)}
              icon={<CheckCircleOutlined />}
              variant="emerald">
              {litigationDetails.settlement?.isSettled
                ? "Edit Settlement"
                : "Record Settlement"}
            </PillButton>
            <PillButton
              onClick={() => setShowAppealModal(true)}
              icon={<TrophyOutlined />}
              variant="violet">
              {litigationDetails.appeal?.isAppealed
                ? "Edit Appeal"
                : "File Appeal"}
            </PillButton>
          </div>
        </div>
      </div>

      <LitigationSteps
        steps={litigationDetails.steps || []}
        matterId={matterId}
      />

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <JudgmentRecordModal
        visible={showJudgmentModal}
        onCancel={() => setShowJudgmentModal(false)}
        matterId={matterId}
        initialValues={litigationDetails.judgment}
      />
      <SettlementRecordModal
        visible={showSettlementModal}
        onCancel={() => setShowSettlementModal(false)}
        matterId={matterId}
        initialValues={litigationDetails.settlement}
      />
      <AppealFilingModal
        visible={showAppealModal}
        onCancel={() => setShowAppealModal(false)}
        matterId={matterId}
        initialValues={litigationDetails.appeal}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        <MatterDetailsCard
          litigation={litigationDetails}
          matter={matter}
          onEdit={handleEdit}
        />

        {/* Tabbed sections */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarStyle={{
              margin: 0,
              padding: "0 12px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
              overflowX: "auto",
            }}
            tabBarGutter={4}
            items={tabItems}
          />
        </div>
      </div>
    </div>
  );
};

export default LitigationDetails;
