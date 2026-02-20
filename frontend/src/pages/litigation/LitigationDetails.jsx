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

const { TabPane } = Tabs;

// ─── Shared empty state ───────────────────────────────────────────────────────
const EmptySection = ({ message: msg = "No data recorded yet" }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
      <FileTextOutlined className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm font-medium">{msg}</p>
  </div>
);

// ─── Tab label with icon ──────────────────────────────────────────────────────
const TabLabel = ({ icon, label }) => (
  <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
    {icon}
    {label}
  </span>
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
      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 shadow-sm ${styles[variant]}`}>
      {icon}
      {children}
    </button>
  );
};

// ─── Single process row ───────────────────────────────────────────────────────
const ProcessItem = ({ process, index }) => (
  <div
    key={index}
    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
    <div>
      <p className="text-sm font-medium text-gray-900">{process.name}</p>
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
  // matterId from useParams is always a stable string primitive — safe to use directly.
  const { matterId } = useParams();

  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("hearings");

  const litigationDetails = useSelector(selectSelectedDetails);
  const loading = useSelector(selectDetailsLoading);

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 1 — Removed clearSelectedMatter() from the cleanup function.
  //
  // The original code dispatched clearSelectedMatter() on unmount, which set
  // selectedDetails → null. That triggered the loading guard to flash, which
  // caused the parent to remount HearingTimeline with fresh props, which ran
  // HearingTimeline's useEffect, which dispatched fetchMatterHearings, which
  // updated matterHearings in Redux, which re-rendered the parent (because it
  // also selects from the same store), which passed new prop references down,
  // which re-ran the effect again — infinite loop.
  //
  // selectedDetails is naturally overwritten the next time fetchLitigationDetails
  // runs for a different matter, so there is no stale-data risk in removing
  // the cleanup dispatch.
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (matterId) {
      dispatch(fetchLitigationDetails(matterId));
    }
  }, [matterId, dispatch]);

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 2 — Stabilise the hearings array reference passed to HearingTimeline.
  //
  // litigationDetails?.hearings is a new array reference on every Redux selector
  // evaluation, even when the contents haven't changed. The previous pattern
  //   hearings={litigationDetails.hearings || []}
  // made this worse: the `|| []` produces a brand-new [] on every render when
  // hearings is null/undefined. HearingTimeline's useEffect had [stableMatterId]
  // as its dependency, but React.memo and internal useMemo hooks still fired on
  // every new array reference, causing cascading re-renders that circled back
  // to trigger another fetch.
  //
  // Solution: cache the reference in a ref and only replace it when the data
  // genuinely changes, using a lightweight fingerprint (length + first _id +
  // last _id) instead of a deep comparison.
  // ─────────────────────────────────────────────────────────────────────────
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

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Title row */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate("/dashboard/matters/litigation")}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                <ArrowLeftOutlined />
              </button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate leading-tight">
                  {matter?.title || "Litigation Matter"}
                </h1>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Suit No: {litigationDetails.suitNo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <PrinterOutlined /> Print
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={exportLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                <DownloadOutlined />
                {exportLoading ? "Exporting…" : "Export PDF"}
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors">
                <EditOutlined /> Edit
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
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
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
              padding: "0 24px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
            tabBarGutter={4}>
            {/* Hearings */}
            <TabPane
              tab={<TabLabel icon={<CalendarOutlined />} label="Hearings" />}
              key="hearings">
              <div className="p-6">
                {/*
                  Pass stableHearings — referentially stable across renders
                  unless the underlying data changes (see FIX 2 above).
                  Do NOT inline `litigationDetails.hearings || []` here.
                */}
                <HearingTimeline
                  matterId={matterId}
                  hearings={stableHearings}
                />
              </div>
            </TabPane>

            {/* Court Orders */}
            <TabPane
              tab={
                <TabLabel icon={<SnippetsOutlined />} label="Court Orders" />
              }
              key="orders">
              <div className="p-6">
                <CourtOrdersList
                  matterId={matterId}
                  courtOrders={litigationDetails.courtOrders || []}
                />
              </div>
            </TabPane>

            {/* Processes */}
            <TabPane
              tab={<TabLabel icon={<AuditOutlined />} label="Processes" />}
              key="processes">
              <div className="p-6">
                <ProcessesTab litigationDetails={litigationDetails} />
              </div>
            </TabPane>

            {/* Judgment */}
            <TabPane
              tab={<TabLabel icon={<FileTextOutlined />} label="Judgment" />}
              key="judgment">
              <div className="p-6">
                {litigationDetails.judgment?.judgmentDate ? (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Judgment Date" span={2}>
                      {formatDate(litigationDetails.judgment.judgmentDate)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Outcome" span={2}>
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
            </TabPane>

            {/* Appeal */}
            <TabPane
              tab={<TabLabel icon={<TrophyOutlined />} label="Appeal" />}
              key="appeal">
              <div className="p-6">
                {litigationDetails.appeal?.isAppealed ? (
                  <Descriptions column={2} bordered size="small">
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
            </TabPane>

            {/* Settlement */}
            <TabPane
              tab={
                <TabLabel icon={<CheckCircleOutlined />} label="Settlement" />
              }
              key="settlement">
              <div className="p-6">
                {litigationDetails.settlement?.isSettled ? (
                  <Descriptions column={2} bordered size="small">
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
            </TabPane>

            {/* Precedents — only shown when data exists */}
            {litigationDetails.precedents?.length > 0 && (
              <TabPane
                tab={
                  <TabLabel icon={<SnippetsOutlined />} label="Precedents" />
                }
                key="precedents">
                <div className="p-6 space-y-3">
                  {litigationDetails.precedents.map((precedent, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-gray-50 border border-gray-100">
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
              </TabPane>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LitigationDetails;
