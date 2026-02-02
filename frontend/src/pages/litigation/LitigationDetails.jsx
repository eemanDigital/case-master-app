import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tabs, Card, Descriptions, Tag, message, Space } from "antd";
import {
  EditOutlined,
  DownloadOutlined,
  PrinterOutlined,
  TrophyOutlined,
  // ScaleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import PageHeader from "../../components/common/PageHeader";
import LoadingScreen from "../../components/common/LoadingScreen";
import MatterDetailsCard from "../../components/litigation/MatterDetailsCard";
import JudgmentRecordModal from "../../components/litigation/JudgmentRecordModal";
import SettlementRecordModal from "../../components/litigation/SettlementRecordModal";
import AppealFilingModal from "../../components/litigation/AppealFilingModal";
import HearingTimeline from "../../components/litigation/HearingTimeline";

import StatusTag from "../../components/common/StatusTag";
import litigationService, {
  fetchLitigationDetails,
  selectSelectedDetails,
  selectDetailsLoading,
  clearSelectedMatter,
} from "../../redux/features/litigation/litigationSlice";
import {
  formatDate,
  formatCurrency,
  // formatArrayToString,
} from "../../utils/formatters";
import {
  JUDGMENT_OUTCOMES,
  APPEAL_STATUS,
} from "../../utils/litigationConstants";

import { downloadFile, getExportFilename } from "../../utils/formatters";
import CourtOrdersList from "../../components/litigation/CourtOrdersList";

const { TabPane } = Tabs;

const LitigationDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);

  const litigationDetails = useSelector(selectSelectedDetails);
  const loading = useSelector(selectDetailsLoading);

  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    dispatch(fetchLitigationDetails(matterId));

    return () => {
      dispatch(clearSelectedMatter());
    };
  }, [matterId, dispatch]);

  const handleEdit = () => {
    navigate(`/dashboard/matters/litigation/${matterId}/edit`);
  };

  const handleExport = async (format = "pdf") => {
    try {
      setExportLoading(true);
      const blob = await litigationService.exportSingleMatter(matterId, format);
      const filename = getExportFilename(
        `litigation_${litigationDetails.suitNo}`,
        format,
      );
      downloadFile(blob, filename);
      message.success("Matter exported successfully");
    } catch (error) {
      message.error("Failed to export matter");
    } finally {
      setExportLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingScreen tip="Loading litigation details..." fullScreen />;
  }

  if (!litigationDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Litigation Details Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            No details available for this matter.
          </p>
          <Button
            type="primary"
            onClick={() => navigate("/dashboard/matters/litigation")}>
            Back to Litigation List
          </Button>
        </div>
      </div>
    );
  }

  const matter = litigationDetails.matter;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={matter?.title || "Litigation Matter"}
        subtitle={`Suit No: ${litigationDetails.suitNo}`}
        showBack
        backPath="/dashboard/matters/litigation"
        extra={[
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>,
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={() => handleExport("pdf")}
            loading={exportLoading}>
            Export PDF
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}>
            Edit Details
          </Button>,
        ]}
      />

      <Space>
        <Button
          // icon={<ScaleOutlined />}
          onClick={() => setShowJudgmentModal(true)}>
          {litigationDetails.judgment ? "Edit Judgment" : "Record Judgment"}
        </Button>

        <Button
          icon={<CheckCircleOutlined />}
          onClick={() => setShowSettlementModal(true)}>
          {litigationDetails.settlement?.isSettled
            ? "Edit Settlement"
            : "Record Settlement"}
        </Button>

        <Button
          icon={<TrophyOutlined />}
          onClick={() => setShowAppealModal(true)}>
          {litigationDetails.appeal?.isAppealed ? "Edit Appeal" : "File Appeal"}
        </Button>
      </Space>

      {/* Modals */}
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

      <div className="max-w-7xl mx-auto p-6">
        {/* Matter Summary Card */}
        <MatterDetailsCard
          litigation={litigationDetails}
          matter={matter}
          onEdit={handleEdit}
        />

        {/* Tabs for different sections */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="bg-white rounded-lg p-4">
          <TabPane tab="Hearings" key="hearings">
            <HearingTimeline
              matterId={matterId}
              hearings={litigationDetails.hearings || []}
            />
          </TabPane>

          <TabPane tab="Court Orders" key="orders">
            <CourtOrdersList
              matterId={matterId}
              courtOrders={litigationDetails.courtOrders || []}
            />
          </TabPane>

          <TabPane tab="Processes Filed" key="processes">
            <Card title="Processes Filed by Parties">
              {/* First Party Processes */}
              {litigationDetails.firstParty?.processesFiled?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">First Party Processes</h4>
                  {litigationDetails.firstParty.processesFiled.map(
                    (process, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded mb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{process.name}</span>
                            {process.filingDate && (
                              <span className="text-sm text-gray-500 ml-2">
                                Filed: {formatDate(process.filingDate)}
                              </span>
                            )}
                          </div>
                          <Tag
                            color={
                              process.status === "completed"
                                ? "success"
                                : "processing"
                            }>
                            {process.status}
                          </Tag>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* Second Party Processes */}
              {litigationDetails.secondParty?.processesFiled?.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Second Party Processes</h4>
                  {litigationDetails.secondParty.processesFiled.map(
                    (process, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded mb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{process.name}</span>
                            {process.filingDate && (
                              <span className="text-sm text-gray-500 ml-2">
                                Filed: {formatDate(process.filingDate)}
                              </span>
                            )}
                          </div>
                          <Tag
                            color={
                              process.status === "completed"
                                ? "success"
                                : "processing"
                            }>
                            {process.status}
                          </Tag>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </Card>
          </TabPane>

          <TabPane tab="Judgment" key="judgment">
            <Card
              title={
                <div className="flex items-center gap-2">
                  {/* <ScaleOutlined /> */}
                  <span>Judgment Details</span>
                </div>
              }>
              {litigationDetails.judgment?.judgmentDate ? (
                <Descriptions column={2} bordered>
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
                <div className="text-center py-8 text-gray-500">
                  No judgment recorded yet
                </div>
              )}
            </Card>
          </TabPane>

          <TabPane tab="Appeal" key="appeal">
            <Card
              title={
                <div className="flex items-center gap-2">
                  <TrophyOutlined />
                  <span>Appeal Information</span>
                </div>
              }>
              {litigationDetails.appeal?.isAppealed ? (
                <Descriptions column={2} bordered>
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

                  <Descriptions.Item label="Appeal Status" span={2}>
                    <StatusTag
                      status={litigationDetails.appeal.appealStatus}
                      configArray={APPEAL_STATUS}
                    />
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No appeal filed
                </div>
              )}
            </Card>
          </TabPane>

          <TabPane tab="Settlement" key="settlement">
            <Card title="Settlement Information">
              {litigationDetails.settlement?.isSettled ? (
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Settled">
                    <Tag color="green">Yes</Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label="Settlement Date">
                    {formatDate(litigationDetails.settlement.settlementDate)}
                  </Descriptions.Item>

                  {litigationDetails.settlement.settlementAmount > 0 && (
                    <Descriptions.Item label="Settlement Amount" span={2}>
                      {formatCurrency(
                        litigationDetails.settlement.settlementAmount,
                      )}
                    </Descriptions.Item>
                  )}

                  {litigationDetails.settlement.settlementTerms && (
                    <Descriptions.Item label="Settlement Terms" span={2}>
                      {litigationDetails.settlement.settlementTerms}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No settlement recorded
                </div>
              )}
            </Card>
          </TabPane>

          {litigationDetails.precedents &&
            litigationDetails.precedents.length > 0 && (
              <TabPane tab="Precedents" key="precedents">
                <Card title="Legal Precedents">
                  {litigationDetails.precedents.map((precedent, index) => (
                    <div key={index} className="mb-4 p-4 bg-gray-50 rounded">
                      <h4 className="font-semibold">{precedent.caseName}</h4>
                      {precedent.citation && (
                        <div className="text-sm text-gray-600 mb-2">
                          Citation: {precedent.citation}
                        </div>
                      )}
                      {precedent.relevance && (
                        <div className="text-sm">{precedent.relevance}</div>
                      )}
                    </div>
                  ))}
                </Card>
              </TabPane>
            )}
        </Tabs>
      </div>
    </div>
  );
};

export default LitigationDetails;
