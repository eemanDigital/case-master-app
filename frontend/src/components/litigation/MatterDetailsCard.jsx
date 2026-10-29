import { useState } from "react";
import { Card, Descriptions, Tag, Space, Button } from "antd";
import {
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { formatDate, formatName } from "../../utils/formatters";
import PropTypes from "prop-types";
import StatusTag from "../common/StatusTag";
import ExpandableText from "../common/ExpandableText";
import {
  MATTER_STATUS,
  CASE_STAGES,
  COURT_TYPES,
} from "../../utils/litigationConstants";

const PartyNameList = ({ names }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleNames = expanded ? names : names.slice(0, 5);

  return (
    <>
      <ul className="list-disc space-y-1 pl-5">
        {visibleNames.map((name, index) => (
          <li
            key={`${name}-${index}`}
            className="break-words font-medium whitespace-pre-wrap">
            {name}
          </li>
        ))}
      </ul>
      {names.length > 5 && (
        <Button
          type="link"
          size="small"
          className="px-0"
          onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show less" : `Show ${names.length - 5} more`}
        </Button>
      )}
    </>
  );
};

PartyNameList.propTypes = {
  names: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const MatterDetailsCard = ({ litigation, matter, onEdit }) => {
  const getCourtLabel = (courtName) => {
    const court = COURT_TYPES.find((c) => c.value === courtName);
    return court?.label || courtName;
  };

  const formatJudges = (judges) => {
    if (!judges || judges.length === 0) return "-";
    return judges.map((judge) => judge.name).filter(Boolean).join(", ") || "-";
  };

  const accountOfficers = (
    Array.isArray(matter?.accountOfficer)
      ? matter.accountOfficer
      : matter?.accountOfficer
        ? [matter.accountOfficer]
        : []
  )
    .map((officer) => ({
      id: officer?._id,
      name:
        [
          officer?.firstName,
          officer?.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        officer?.label ||
        officer?.name ||
        "",
    }))
    .filter((officer) => officer.name);

  const renderParty = (party, fallbackRole) => {
    const names = (Array.isArray(party?.name) ? party.name : [])
      .map((entry) =>
        typeof entry === "string" ? entry.trim() : entry?.name?.trim(),
      )
      .filter(Boolean);
    return (
      <div>
        <ExpandableText
          rows={2}
          className="text-sm text-gray-500 mb-1">
          {party?.description || fallbackRole}
        </ExpandableText>
        {names.length ? (
          <PartyNameList names={names} />
        ) : (
          <span className="text-gray-400">No parties recorded</span>
        )}
      </div>
    );
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
          {matter?.matterNumber || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="Matter Title" span={2}>
          <ExpandableText rows={2}>{matter?.title}</ExpandableText>
        </Descriptions.Item>

        <Descriptions.Item label="Priority">
          {matter?.priority ? (
            <Tag
              color={
                matter.priority === "urgent"
                  ? "red"
                  : matter.priority === "high"
                    ? "orange"
                    : matter.priority === "medium"
                      ? "blue"
                      : "default"
              }>
              {matter.priority}
            </Tag>
          ) : (
            "-"
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Date Opened">
          {formatDate(matter?.dateOpened)}
        </Descriptions.Item>

        <Descriptions.Item label="Matter Description" span={3}>
          <ExpandableText>{matter?.description}</ExpandableText>
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

        <Descriptions.Item label="State">{litigation?.state || "-"}</Descriptions.Item>

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
          {renderParty(
            litigation?.firstParty,
            "Plaintiff(s) / Applicant(s) / Claimant(s)",
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Second Party" span={3}>
          {renderParty(
            litigation?.secondParty,
            "Defendant(s) / Respondent(s)",
          )}
        </Descriptions.Item>

        {litigation?.otherParty?.map((party, index) => (
          <Descriptions.Item
            key={`other-party-${index}`}
            label={`Other Party ${index + 1}`}
            span={3}>
            {renderParty(party, "Other Party")}
          </Descriptions.Item>
        ))}

        <Descriptions.Item label="Client" span={2}>
          <Space>
            <UserOutlined />
            {matter?.client?.companyName ||
              formatName(matter?.client?.firstName, matter?.client?.lastName) ||
              "-"}
          </Space>
        </Descriptions.Item>

        <Descriptions.Item label="Account Officer(s)" span={3}>
          {accountOfficers.length ? (
            <Space wrap>
              {accountOfficers.map((officer, index) => (
                <Tag key={officer.id || `${officer.name}-${index}`}>
                  <UserOutlined className="mr-1" />
                  {officer.name}
                </Tag>
              ))}
            </Space>
          ) : (
            <span className="text-gray-400">No account officers assigned</span>
          )}
        </Descriptions.Item>

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

MatterDetailsCard.propTypes = {
  litigation: PropTypes.shape({
    suitNo: PropTypes.string,
    currentStage: PropTypes.string,
    courtName: PropTypes.string,
    otherCourt: PropTypes.string,
    courtNo: PropTypes.string,
    state: PropTypes.string,
    courtLocation: PropTypes.string,
    division: PropTypes.string,
    judge: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
    modeOfCommencement: PropTypes.string,
    otherModeOfCommencement: PropTypes.string,
    filingDate: PropTypes.string,
    serviceDate: PropTypes.string,
    firstParty: PropTypes.object,
    secondParty: PropTypes.object,
    otherParty: PropTypes.arrayOf(PropTypes.object),
    isLandmark: PropTypes.bool,
    citationReference: PropTypes.string,
    applicableLaws: PropTypes.arrayOf(PropTypes.string),
    legalIssues: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  matter: PropTypes.shape({
    accountOfficer: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.object),
      PropTypes.object,
    ]),
    client: PropTypes.object,
    status: PropTypes.string,
    matterNumber: PropTypes.string,
    title: PropTypes.string,
    priority: PropTypes.string,
    dateOpened: PropTypes.string,
    description: PropTypes.string,
  }),
  onEdit: PropTypes.func.isRequired,
};

export default MatterDetailsCard;
