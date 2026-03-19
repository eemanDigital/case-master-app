import { useEffect, useState, useMemo, useCallback } from "react";
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
import ProcessesFiledManager from "../../components/litigation/ProcessesFiledManager";

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
import { downloadLitigationReport } from "../../utils/pdfDownload";

// ─── Module-level constants (never re-created) ────────────────────────────────
const PILL_STYLES = {
  default:
    "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400",
  violet:
    "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-400",
};

// ─── Pure sub-components (defined outside main component) ─────────────────────

const EmptySection = ({ message: msg = "No data recorded yet" }) => (
  <div className="flex flex-col items-center justify-center py-8 sm:py-16 text-gray-400">
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 sm:mb-4">
      <FileTextOutlined className="text-xl sm:text-2xl text-gray-300" />
    </div>
    <p className="text-xs sm:text-sm font-medium">{msg}</p>
  </div>
);

const PillButton = ({ onClick, icon, children, variant = "default" }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold rounded-lg border transition-all duration-150 shadow-sm ${PILL_STYLES[variant]}`}>
    {icon}
    {children}
  </button>
);

const TabPane = ({ children }) => (
  <div className="p-2 sm:p-4 md:p-6">{children}</div>
);

const DetailsSkeleton = () => (
  <div className="min-h-screen bg-[#f5f6fa] p-6 space-y-4">
    <Skeleton active paragraph={{ rows: 2 }} />
    <Skeleton active paragraph={{ rows: 6 }} />
    <Skeleton active paragraph={{ rows: 10 }} />
  </div>
);

const DetailsNotFound = ({ onBack }) => (
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
        onClick={onBack}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors">
        <ArrowLeftOutlined /> Back to Litigation
      </button>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const LitigationDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();

  // ── State — ALL hooks must come before any conditional return ─────────────
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [exportingFormats, setExportingFormats] = useState({});
  const [activeTab, setActiveTab] = useState("hearings");

  const litigationDetails = useSelector(selectSelectedDetails);
  const loading = useSelector(selectDetailsLoading);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (matterId) {
      dispatch(fetchLitigationDetails(matterId));
    }
  }, [matterId, dispatch]);

  // ── Stable hearings reference ─────────────────────────────────────────────
  // Extract scalar deps so useMemo only fires when content truly changes,
  // not on every Redux selector identity update.
  const hearingsArr = litigationDetails?.hearings;
  const hearingsLength = hearingsArr?.length ?? 0;
  const firstHearingId = hearingsArr?.[0]?._id ?? "";
  const lastHearingId = hearingsArr?.[hearingsLength - 1]?._id ?? "";

   
  const stableHearings = useMemo(
    () => hearingsArr ?? [],
    [hearingsLength, firstHearingId, lastHearingId],
  );

  // ── Stable modal close handlers ───────────────────────────────────────────
  const closeJudgmentModal = useCallback(() => setShowJudgmentModal(false), []);
  const closeSettlementModal = useCallback(
    () => setShowSettlementModal(false),
    [],
  );
  const closeAppealModal = useCallback(() => setShowAppealModal(false), []);

  // ── Navigation / export handlers ─────────────────────────────────────────
  const handleEdit = useCallback(() => {
    navigate(`/dashboard/matters/litigation/${matterId}/edit`);
  }, [navigate, matterId]);

  const handleExport = useCallback(
    async (format = "pdf") => {
      try {
        setExportingFormats((prev) => ({ ...prev, [format]: true }));
        await downloadLitigationReport(matterId, litigationDetails?.suitNo || 'litigation');
        message.success("Report downloaded successfully");
      } catch (error) {
        console.error("Export error:", error);
        message.error("Failed to download report");
      } finally {
        setExportingFormats((prev) => ({ ...prev, [format]: false }));
      }
    },
    [matterId, litigationDetails?.suitNo],
  );

  const handlePrint = useCallback(() => window.print(), []);

  const handleBackClick = useCallback(
    () => navigate("/dashboard/matters/litigation"),
    [navigate],
  );

  // ── Destructure detail slices for stable useMemo deps ─────────────────────
  const judgment = litigationDetails?.judgment;
  const appeal = litigationDetails?.appeal;
  const settlement = litigationDetails?.settlement;
  const precedents = litigationDetails?.precedents;

  console.log("Litigation details:", litigationDetails);

  // ── Tab items — memoized; must be computed BEFORE any early return ─────────
  const tabItems = useMemo(() => {
    // Guard: if no data yet, return empty array (avoids null-access inside tabs)
    if (!litigationDetails) return [];

    const firstPartyProcesses = litigationDetails.firstParty?.processesFiled || [];
    const secondPartyProcesses = litigationDetails.secondParty?.processesFiled || [];
    const processes = [...firstPartyProcesses, ...secondPartyProcesses];

    return [
      // Hearings ──────────────────────────────────────────────────────────────
      {
        key: "hearings",
        label: (
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
            <CalendarOutlined />
            <span className="hidden sm:inline">Hearings</span>
          </span>
        ),
        children: (
          <TabPane>
            <HearingTimeline matterId={matterId} hearings={stableHearings} />
          </TabPane>
        ),
      },

      // Processes ─────────────────────────────────────────────────────────────
      {
        key: "processes",
        label: (
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
            <FileTextOutlined />
            <span className="hidden sm:inline">Processes</span>
          </span>
        ),
        children: (
          <TabPane>
            <ProcessesFiledManager
              matterId={matterId}
              litigationDetails={litigationDetails}
            />
          </TabPane>
        ),
      },

      // Court Orders ──────────────────────────────────────────────────────────
      {
        key: "orders",
        label: (
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
            <TeamOutlined />
            <span className="hidden sm:inline">Court Orders</span>
          </span>
        ),
        children: (
          <TabPane>
            <CourtOrdersList matterId={matterId} />
          </TabPane>
        ),
      },

      // Judgment ──────────────────────────────────────────────────────────────
      {
        key: "judgment",
        label: (
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
            <AuditOutlined />
            <span className="hidden sm:inline">Judgment</span>
          </span>
        ),
        children: (
          <TabPane>
            {judgment?.outcome ? (
              <Descriptions
                column={{ xs: 1, sm: 2, md: 2 }}
                bordered
                size="small">
                <Descriptions.Item label="Outcome">
                  <StatusTag
                    status={judgment.outcome}
                    configArray={JUDGMENT_OUTCOMES}
                  />
                </Descriptions.Item>
                {judgment.damages > 0 && (
                  <Descriptions.Item label="Damages Awarded">
                    {formatCurrency(judgment.damages)}
                  </Descriptions.Item>
                )}
                {judgment.costs > 0 && (
                  <Descriptions.Item label="Costs">
                    {formatCurrency(judgment.costs)}
                  </Descriptions.Item>
                )}
                {judgment.judgmentSummary && (
                  <Descriptions.Item label="Summary" span={2}>
                    {judgment.judgmentSummary}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <EmptySection message="No judgment recorded yet" />
            )}
          </TabPane>
        ),
      },

      // Appeal ────────────────────────────────────────────────────────────────
      {
        key: "appeal",
        label: (
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
            <TrophyOutlined />
            <span className="hidden sm:inline">Appeal</span>
          </span>
        ),
        children: (
          <TabPane>
            {appeal?.isAppealed ? (
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                <Descriptions.Item label="Appeal Filed">
                  <Tag color="blue">Yes</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Appeal Date">
                  {formatDate(appeal.appealDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Appeal Court">
                  {appeal.appealCourt}
                </Descriptions.Item>
                <Descriptions.Item label="Appeal Suit No">
                  {appeal.appealSuitNo}
                </Descriptions.Item>
                <Descriptions.Item label="Status" span={2}>
                  <StatusTag
                    status={appeal.appealStatus}
                    configArray={APPEAL_STATUS}
                  />
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <EmptySection message="No appeal filed" />
            )}
          </TabPane>
        ),
      },

      // Settlement ────────────────────────────────────────────────────────────
      {
        key: "settlement",
        label: (
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
            <CheckCircleOutlined />
            <span className="hidden sm:inline">Settlement</span>
          </span>
        ),
        children: (
          <TabPane>
            {settlement?.isSettled ? (
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                <Descriptions.Item label="Settled">
                  <Tag color="green">Yes</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Settlement Date">
                  {formatDate(settlement.settlementDate)}
                </Descriptions.Item>
                {settlement.settlementAmount > 0 && (
                  <Descriptions.Item label="Amount" span={2}>
                    {formatCurrency(settlement.settlementAmount)}
                  </Descriptions.Item>
                )}
                {settlement.settlementTerms && (
                  <Descriptions.Item label="Terms" span={2}>
                    {settlement.settlementTerms}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <EmptySection message="No settlement recorded" />
            )}
          </TabPane>
        ),
      },

      // Precedents — only rendered when data exists ───────────────────────────
      ...(precedents?.length > 0
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
                <TabPane>
                  <div className="space-y-3">
                    {precedents.map((precedent, index) => (
                      <div
                        key={precedent._id ?? index}
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
                </TabPane>
              ),
            },
          ]
        : []),
    ];
  }, [
    litigationDetails,
    matterId,
    stableHearings,
    judgment,
    appeal,
    settlement,
    precedents,
  ]);

  // ── Early returns — AFTER every hook ─────────────────────────────────────
  if (loading && !litigationDetails) return <DetailsSkeleton />;
  if (!litigationDetails) return <DetailsNotFound onBack={handleBackClick} />;

  // ── Derived values (safe: guaranteed litigationDetails exists here) ───────
  const matter = litigationDetails.matter;
  const isPdfExporting = !!exportingFormats["pdf"];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-3 md:py-4">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <button
                onClick={handleBackClick}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                <ArrowLeftOutlined />
              </button>
              <div className="min-w-0">
                {/* Subtle opacity fade signals background refresh */}
                <h1
                  className={`text-sm md:text-base font-bold text-gray-900 truncate leading-tight transition-opacity duration-300 ${
                    loading ? "opacity-60" : "opacity-100"
                  }`}>
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
                disabled={isPdfExporting}
                className="inline-flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <DownloadOutlined />
                <span className="hidden md:inline">
                  {isPdfExporting ? "Exporting…" : "Export PDF"}
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
              {judgment ? "Edit Judgment" : "Record Judgment"}
            </PillButton>
            <PillButton
              onClick={() => setShowSettlementModal(true)}
              icon={<CheckCircleOutlined />}
              variant="emerald">
              {settlement?.isSettled ? "Edit Settlement" : "Record Settlement"}
            </PillButton>
            <PillButton
              onClick={() => setShowAppealModal(true)}
              icon={<TrophyOutlined />}
              variant="violet">
              {appeal?.isAppealed ? "Edit Appeal" : "File Appeal"}
            </PillButton>
          </div>
        </div>
      </div>

      {/* Litigation progress steps */}
      <LitigationSteps
        steps={litigationDetails.steps || []}
        matterId={matterId}
      />

      {/* Modals */}
      <JudgmentRecordModal
        visible={showJudgmentModal}
        onCancel={closeJudgmentModal}
        matterId={matterId}
        initialValues={judgment}
      />
      <SettlementRecordModal
        visible={showSettlementModal}
        onCancel={closeSettlementModal}
        matterId={matterId}
        initialValues={settlement}
      />
      <AppealFilingModal
        visible={showAppealModal}
        onCancel={closeAppealModal}
        matterId={matterId}
        initialValues={appeal}
      />

      {/* Main content */}
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
