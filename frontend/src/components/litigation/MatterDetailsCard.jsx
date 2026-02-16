import { Card, Descriptions, Tag, Space, Button } from "antd";
import {
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { formatDate, formatName } from "../../utils/formatters";
import StatusTag from "../common/StatusTag";
import {
  MATTER_STATUS,
  CASE_STAGES,
  COURT_TYPES,
} from "../../utils/litigationConstants";
import MatterHearingsTimeline from "../calender/MatterHearingsTimeline";

const MatterDetailsCard = ({ litigation, matter, onEdit }) => {
  const getCourtLabel = (courtName) => {
    const court = COURT_TYPES.find((c) => c.value === courtName);
    return court?.label || courtName;
  };

  const formatPartyNames = (party) => {
    if (!party || !party.name || party.name.length === 0) return "-";
    return party.name.map((n) => n.name).join(", ");
  };

  const formatJudges = (judges) => {
    if (!judges || judges.length === 0) return "-";
    return judges.map((j) => j.name).join(", ");
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Case Summary</span>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={onEdit}
            size="small">
            Edit Details
          </Button>
        </div>
      }
      className="mb-6">
      <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
        <Descriptions.Item label="Suit Number" span={2}>
          <span className="font-semibold text-lg">{litigation.suitNo}</span>
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <StatusTag status={matter?.status} configArray={MATTER_STATUS} />
        </Descriptions.Item>

        <Descriptions.Item label="Matter Number">
          {matter?.matterNumber}
        </Descriptions.Item>

        <Descriptions.Item label="Current Stage" span={2}>
          <StatusTag
            status={litigation?.currentStage}
            configArray={CASE_STAGES}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Court" span={2}>
          <div>
            <div className="font-medium">
              {getCourtLabel(litigation?.courtName)}
            </div>
            {litigation?.otherCourt && (
              <div className="text-sm text-gray-500">
                {litigation?.otherCourt}
              </div>
            )}
          </div>
        </Descriptions.Item>

        <Descriptions.Item label="Court Number">
          {litigation?.courtNo || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="State">{litigation?.state}</Descriptions.Item>

        <Descriptions.Item label="Location" span={2}>
          {litigation?.courtLocation || "-"}
        </Descriptions.Item>

        {litigation?.division && (
          <Descriptions.Item label="Division" span={3}>
            {litigation?.division}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Judge(s)" span={3}>
          {formatJudges(litigation?.judge)}
        </Descriptions.Item>

        <Descriptions.Item label="Mode of Commencement" span={2}>
          {litigation?.modeOfCommencement}
          {litigation?.otherModeOfCommencement &&
            ` - ${litigation?.otherModeOfCommencement}`}
        </Descriptions.Item>

        <Descriptions.Item label="Filing Date">
          <Space>
            <CalendarOutlined />
            {formatDate(litigation?.filingDate)}
          </Space>
        </Descriptions.Item>

        {litigation?.serviceDate && (
          <Descriptions.Item label="Service Date" span={3}>
            <Space>
              <CalendarOutlined />
              {formatDate(litigation?.serviceDate)}
            </Space>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="First Party" span={3}>
          <div>
            {litigation?.firstParty?.description && (
              <div className="text-sm text-gray-500 mb-1">
                {litigation?.firstParty?.description}
              </div>
            )}
            <div className="font-medium">
              {formatPartyNames(litigation?.firstParty)}
            </div>
          </div>
        </Descriptions.Item>

        <Descriptions.Item label="Second Party" span={3}>
          <div>
            {litigation?.secondParty?.description && (
              <div className="text-sm text-gray-500 mb-1">
                {litigation?.secondParty?.description}
              </div>
            )}
            <div className="font-medium">
              {formatPartyNames(litigation?.secondParty)}
            </div>
          </div>
        </Descriptions.Item>

        {matter?.client && (
          <Descriptions.Item label="Client" span={2}>
            <Space>
              <UserOutlined />
              {matter?.client?.companyName ||
                formatName(matter?.client?.firstName, matter?.client?.lastName)}
            </Space>
          </Descriptions.Item>
        )}

        {matter?.accountOfficer && (
          <Descriptions.Item label="Account Officer">
            <Space>
              <UserOutlined />
              {formatName(
                matter?.accountOfficer.firstName,
                matter?.accountOfficer.lastName,
              )}
            </Space>
          </Descriptions.Item>
        )}

        {litigation?.isLandmark && (
          <Descriptions.Item label="Landmark Case" span={3}>
            <Tag color="gold">Landmark Case</Tag>
            {litigation?.citationReference && (
              <span className="ml-2 text-sm text-gray-600">
                {litigation?.citationReference}
              </span>
            )}
          </Descriptions.Item>
        )}

        {litigation?.applicableLaws &&
          litigation?.applicableLaws?.length > 0 && (
            <Descriptions.Item label="Applicable Laws" span={3}>
              <Space wrap>
                {litigation?.applicableLaws?.map((law, index) => (
                  <Tag key={index} color="blue">
                    {law}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}

        {litigation?.legalIssues && litigation?.legalIssues.length > 0 && (
          <Descriptions.Item label="Legal Issues" span={3}>
            <Space wrap>
              {litigation?.legalIssues?.map((issue, index) => (
                <Tag key={index} color="purple">
                  {issue}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
};

export default MatterDetailsCard;
