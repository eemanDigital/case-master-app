import React, { useMemo } from "react";
import { Card, Timeline, Typography, Tag, Avatar, Space, Empty, List } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  SafetyOutlined,
  AlertOutlined,
  SearchOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { selectCurrentAdvisoryDetail } from "../../redux/features/advisory/advisorySlice";

const { Text } = Typography;

const ActivityLog = ({ advisoryId }) => {
  const advisory = useSelector(selectCurrentAdvisoryDetail);

  const activities = useMemo(() => {
    if (!advisory) return [];

    const activityList = [];

    if (advisory.createdAt) {
      activityList.push({
        id: "created",
        action: "created",
        entity: "advisory",
        user: advisory.createdBy || { firstName: "System", lastName: "" },
        timestamp: advisory.createdAt,
        details: "Advisory matter created",
      });
    }

    if (advisory.updatedAt && advisory.updatedAt !== advisory.createdAt) {
      activityList.push({
        id: "updated",
        action: "updated",
        entity: "advisory",
        user: advisory.lastModifiedBy || { firstName: "System", lastName: "" },
        timestamp: advisory.updatedAt,
        details: "Advisory matter updated",
      });
    }

    if (advisory.requestDate) {
      activityList.push({
        id: "request",
        action: "created",
        entity: "request",
        user: advisory.createdBy || { firstName: "System", lastName: "" },
        timestamp: advisory.requestDate,
        details: "Advisory request submitted",
      });
    }

    if (advisory.targetDeliveryDate) {
      activityList.push({
        id: "target",
        action: "updated",
        entity: "timeline",
        user: advisory.lastModifiedBy || { firstName: "System", lastName: "" },
        timestamp: advisory.targetDeliveryDate,
        details: "Target delivery date set",
      });
    }

    if (advisory.actualDeliveryDate) {
      activityList.push({
        id: "delivered",
        action: "completed",
        entity: "deliverable",
        user: advisory.lastModifiedBy || { firstName: "System", lastName: "" },
        timestamp: advisory.actualDeliveryDate,
        details: "Advisory delivered",
      });
    }

    if (advisory.researchQuestions?.length > 0) {
      advisory.researchQuestions.forEach((q, index) => {
        if (q.addedAt) {
          activityList.push({
            id: `research_${index}`,
            action: "created",
            entity: "research_question",
            user: q.addedBy || { firstName: "System", lastName: "" },
            timestamp: q.addedAt,
            details: `Research question added: "${q.question?.substring(0, 50)}..."`,
          });
        }
        if (q.updatedAt && q.updatedAt !== q.addedAt) {
          activityList.push({
            id: `research_updated_${index}`,
            action: "updated",
            entity: "research_question",
            user: q.updatedBy || { firstName: "System", lastName: "" },
            timestamp: q.updatedAt,
            details: `Research question updated: "${q.question?.substring(0, 50)}..."`,
          });
        }
      });
    }

    if (advisory.keyFindings?.length > 0) {
      advisory.keyFindings.forEach((f, index) => {
        if (f.addedAt) {
          activityList.push({
            id: `finding_${index}`,
            action: "created",
            entity: "key_finding",
            user: f.addedBy || { firstName: "System", lastName: "" },
            timestamp: f.addedAt,
            details: `Key finding added: "${f.finding?.substring(0, 50)}..."`,
          });
        }
        if (f.updatedAt && f.updatedAt !== f.addedAt) {
          activityList.push({
            id: `finding_updated_${index}`,
            action: "updated",
            entity: "key_finding",
            user: f.updatedBy || { firstName: "System", lastName: "" },
            timestamp: f.updatedAt,
            details: `Key finding updated`,
          });
        }
      });
    }

    if (advisory.deliverables?.length > 0) {
      advisory.deliverables.forEach((d, index) => {
        if (d.addedAt) {
          activityList.push({
            id: `deliverable_${index}`,
            action: "created",
            entity: "deliverable",
            user: d.addedBy || { firstName: "System", lastName: "" },
            timestamp: d.addedAt,
            details: `Deliverable added: "${d.title}"`,
          });
        }
        if (d.updatedAt && d.updatedAt !== d.addedAt) {
          activityList.push({
            id: `deliverable_updated_${index}`,
            action: "updated",
            entity: "deliverable",
            user: d.updatedBy || { firstName: "System", lastName: "" },
            timestamp: d.updatedAt,
            details: `Deliverable status updated: "${d.title}" - ${d.status}`,
          });
        }
      });
    }

    if (advisory.recommendations?.length > 0) {
      advisory.recommendations.forEach((r, index) => {
        if (r.addedAt) {
          activityList.push({
            id: `recommendation_${index}`,
            action: "created",
            entity: "recommendation",
            user: r.addedBy || { firstName: "System", lastName: "" },
            timestamp: r.addedAt,
            details: `Recommendation added: "${r.recommendation?.substring(0, 50)}..."`,
          });
        }
        if (r.updatedAt && r.updatedAt !== r.addedAt) {
          activityList.push({
            id: `recommendation_updated_${index}`,
            action: "updated",
            entity: "recommendation",
            user: r.updatedBy || { firstName: "System", lastName: "" },
            timestamp: r.updatedAt,
            details: `Recommendation updated`,
          });
        }
      });
    }

    if (advisory.complianceChecklist?.length > 0) {
      advisory.complianceChecklist.forEach((c, index) => {
        if (c.addedAt) {
          activityList.push({
            id: `compliance_${index}`,
            action: "created",
            entity: "compliance",
            user: c.addedBy || { firstName: "System", lastName: "" },
            timestamp: c.addedAt,
            details: `Compliance requirement added: "${c.requirement?.substring(0, 50)}..."`,
          });
        }
        if (c.updatedAt && c.updatedAt !== c.addedAt) {
          activityList.push({
            id: `compliance_updated_${index}`,
            action: "updated",
            entity: "compliance",
            user: c.updatedBy || { firstName: "System", lastName: "" },
            timestamp: c.updatedAt,
            details: `Compliance requirement updated: ${c.status}`,
          });
        }
      });
    }

    if (advisory.riskAssessment?.risks?.length > 0) {
      advisory.riskAssessment.risks.forEach((risk, index) => {
        if (risk.addedAt) {
          activityList.push({
            id: `risk_${index}`,
            action: "created",
            entity: "risk",
            user: risk.addedBy || { firstName: "System", lastName: "" },
            timestamp: risk.addedAt,
            details: `Risk identified: "${risk.risk?.substring(0, 50)}..."`,
          });
        }
        if (risk.updatedAt && risk.updatedAt !== risk.addedAt) {
          activityList.push({
            id: `risk_updated_${index}`,
            action: "updated",
            entity: "risk",
            user: risk.updatedBy || { firstName: "System", lastName: "" },
            timestamp: risk.updatedAt,
            details: `Risk assessment updated`,
          });
        }
      });
    }

    return activityList.sort((a, b) => 
      dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
    );
  }, [advisory]);

  const getActionIcon = (action) => {
    const icons = {
      created: <PlusOutlined />,
      updated: <EditOutlined />,
      completed: <CheckCircleOutlined />,
      default: <ClockCircleOutlined />,
    };
    return icons[action] || icons.default;
  };

  const getActionColor = (action) => {
    const colors = {
      created: "green",
      updated: "blue",
      completed: "purple",
      default: "gray",
    };
    return colors[action] || colors.default;
  };

  const getEntityIcon = (entity) => {
    const icons = {
      advisory: <FileTextOutlined />,
      research_question: <SearchOutlined />,
      key_finding: <BulbOutlined />,
      deliverable: <FileTextOutlined />,
      recommendation: <FileTextOutlined />,
      compliance: <SafetyOutlined />,
      risk: <AlertOutlined />,
      timeline: <ClockCircleOutlined />,
      request: <FileTextOutlined />,
      default: <FileTextOutlined />,
    };
    return icons[entity] || icons.default;
  };

  const getUserName = (user) => {
    if (!user) return "System";
    if (typeof user === "string") return user;
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName} ${lastName}`.trim() || "System User";
  };

  if (!advisory) {
    return (
      <Card title="Activity Log">
        <Empty description="No advisory data available" />
      </Card>
    );
  }

  return (
    <Card 
      title="Activity Log"
      extra={
        <Text type="secondary">
          {activities.length} activity/activities
        </Text>
      }
    >
      {activities.length > 0 ? (
        <Timeline
          mode="left"
          items={activities.map((activity) => ({
            color: getActionColor(activity.action),
            dot: getEntityIcon(activity.entity),
            children: (
              <div style={{ paddingLeft: 16 }}>
                <Space align="start" style={{ width: "100%" }}>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                  <div style={{ flex: 1 }}>
                    <Space size={4} wrap>
                      <Text strong>{getUserName(activity.user)}</Text>
                      <Tag
                        color={getActionColor(activity.action)}
                        icon={getActionIcon(activity.action)}>
                        {activity.action}
                      </Tag>
                      <Text type="secondary">
                        the {activity.entity.replace(/_/g, " ")}
                      </Text>
                    </Space>
                    {activity.details && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">{activity.details}</Text>
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(activity.timestamp).format("DD MMM YYYY HH:mm")}
                      </Text>
                    </div>
                  </div>
                </Space>
              </div>
            ),
          }))}
        />
      ) : (
        <Empty description="No activity recorded yet" />
      )}
    </Card>
  );
};

export default ActivityLog;
