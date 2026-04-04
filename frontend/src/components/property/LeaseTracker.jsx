import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Button,
  Space,
  Timeline,
  Divider,
  Tooltip,
  Empty,
} from "antd";
import {
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  calculateLeaseCountdown,
  calculateLeaseProgress,
  getUrgencyColor,
  getUrgencyLabel,
  formatCurrency,
  DATE_FORMAT,
} from "../../utils/propertyConstants";
import dayjs from "dayjs";

const LeaseTracker = ({ leaseAgreement, renewalTracking, tenant, landlord }) => {
  const countdown = useMemo(() => {
    if (!leaseAgreement?.expiryDate) return null;
    return calculateLeaseCountdown(leaseAgreement.expiryDate);
  }, [leaseAgreement?.expiryDate]);

  const progress = useMemo(() => {
    if (!leaseAgreement?.commencementDate || !leaseAgreement?.expiryDate) return 0;
    return calculateLeaseProgress(
      leaseAgreement.commencementDate,
      leaseAgreement.expiryDate,
    );
  }, [leaseAgreement?.commencementDate, leaseAgreement?.expiryDate]);

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case "critical":
        return <ExclamationCircleOutlined />;
      case "warning":
        return <WarningOutlined />;
      case "notice":
        return <AlertOutlined />;
      case "expired":
        return <ClockCircleOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  const getProgressColor = (urgency) => {
    switch (urgency) {
      case "critical":
      case "expired":
        return "#ff4d4f";
      case "warning":
        return "#fa8c16";
      case "notice":
        return "#1890ff";
      default:
        return "#52c41a";
    }
  };

  if (!leaseAgreement) {
    return (
      <Card title="Lease Tracker">
        <Empty description="No lease agreement details available" />
      </Card>
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        {/* Countdown Card */}
        <Col xs={24} lg={12}>
          <Card
            className="h-full"
            style={{
              borderColor:
                countdown?.urgency === "critical"
                  ? "#ff4d4f"
                  : countdown?.urgency === "warning"
                    ? "#fa8c16"
                    : "#d9d9d9",
            }}
          >
            <div className="text-center">
              <Tag
                color={getUrgencyColor(countdown?.urgency)}
                icon={getUrgencyIcon(countdown?.urgency)}
                className="mb-4"
              >
                {getUrgencyLabel(countdown?.urgency)}
              </Tag>

              <div className="mb-4">
                <div className="text-5xl font-bold mb-2">
                  <span
                    style={{
                      color:
                        countdown?.urgency === "critical"
                          ? "#ff4d4f"
                          : countdown?.urgency === "warning"
                            ? "#fa8c16"
                            : "#1890ff",
                    }}
                  >
                    {Math.abs(countdown?.days || 0)}
                  </span>
                </div>
                <div className="text-gray-500 text-lg">
                  {countdown?.days < 0
                    ? "Days Overdue"
                    : countdown?.days === 0
                      ? "Expires Today"
                      : "Days Remaining"}
                </div>
              </div>

              <div className="flex justify-center gap-8 text-sm">
                <div>
                  <div className="font-semibold text-xl">{countdown?.weeks || 0}</div>
                  <div className="text-gray-500">Weeks</div>
                </div>
                <div>
                  <div className="font-semibold text-xl">{countdown?.months || 0}</div>
                  <div className="text-gray-500">Months</div>
                </div>
                <div>
                  <div className="font-semibold text-xl">{countdown?.years || 0}</div>
                  <div className="text-gray-500">Years</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Lease Details Card */}
        <Col xs={24} lg={12}>
          <Card title="Lease Details" className="h-full">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Status"
                  value={leaseAgreement.status || "Not Set"}
                  valueStyle={{
                    color:
                      leaseAgreement.status === "active"
                        ? "#52c41a"
                        : leaseAgreement.status === "expired"
                          ? "#ff4d4f"
                          : "#1890ff",
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Duration"
                  value={
                    leaseAgreement.duration
                      ? `${leaseAgreement.duration.years || 0}y ${leaseAgreement.duration.months || 0}m`
                      : "N/A"
                  }
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Start Date"
                  value={
                    leaseAgreement.commencementDate
                      ? dayjs(leaseAgreement.commencementDate).format(DATE_FORMAT)
                      : "Not Set"
                  }
                  prefix={<CalendarOutlined className="mr-2" />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="End Date"
                  value={
                    leaseAgreement.expiryDate
                      ? dayjs(leaseAgreement.expiryDate).format(DATE_FORMAT)
                      : "Not Set"
                  }
                  prefix={<CalendarOutlined className="mr-2" />}
                  valueStyle={{
                    color:
                      countdown?.urgency === "critical"
                        ? "#ff4d4f"
                        : countdown?.urgency === "warning"
                          ? "#fa8c16"
                          : "inherit",
                  }}
                />
              </Col>
            </Row>

            <Divider />

            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Lease Progress</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <Progress
              percent={progress}
              showInfo={false}
              strokeColor={getProgressColor(countdown?.urgency)}
              trailColor="#f0f0f0"
            />

            <div className="flex justify-between mt-4">
              <div>
                <div className="text-xs text-gray-500">Tenant</div>
                <div className="font-medium">
                  {tenant?.name || "Not specified"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Landlord</div>
                <div className="font-medium">
                  {landlord?.name || "Not specified"}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Renewal Status */}
      {renewalTracking?.renewalInitiated && (
        <Card title="Renewal Status" className="mt-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Statistic
                title="Renewal Status"
                value={renewalTracking.renewalStatus || "Not Initiated"}
                valueStyle={{
                  color:
                    renewalTracking.renewalStatus === "agreed"
                      ? "#52c41a"
                      : renewalTracking.renewalStatus === "in-progress"
                        ? "#1890ff"
                        : "#fa8c16",
                }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Statistic
                title="Renewal Deadline"
                value={
                  renewalTracking.renewalDeadline
                    ? dayjs(renewalTracking.renewalDeadline).format(DATE_FORMAT)
                    : "N/A"
                }
                prefix={<ClockCircleOutlined className="mr-2" />}
              />
            </Col>
            <Col xs={24} md={8}>
              <Statistic
                title="Proposed Rent"
                value={
                  renewalTracking.proposedNewRent?.amount
                    ? formatCurrency(
                        renewalTracking.proposedNewRent.amount,
                        renewalTracking.proposedNewRent.currency,
                      )
                    : "Not Set"
                }
                suffix={
                  renewalTracking.rentIncreasePercentage > 0 && (
                    <Tag color="orange" className="ml-2">
                      +{renewalTracking.rentIncreasePercentage}%
                    </Tag>
                  )
                }
              />
            </Col>
          </Row>

          {renewalTracking.negotiationsHistory?.length > 0 && (
            <>
              <Divider>Negotiation History</Divider>
              <Timeline
                items={renewalTracking.negotiationsHistory.map((neg, idx) => ({
                  color:
                    neg.response === "accepted"
                      ? "green"
                      : neg.response === "rejected"
                        ? "red"
                        : neg.response === "counter-offered"
                          ? "orange"
                          : "blue",
                  children: (
                    <div>
                      <div className="font-medium">
                        {neg.proposedBy === "landlord" ? "Landlord" : "Tenant"} -{" "}
                        {formatCurrency(neg.proposedAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dayjs(neg.proposedDate).format(DATE_FORMAT)}
                      </div>
                      <Tag
                        color={
                          neg.response === "accepted"
                            ? "success"
                            : neg.response === "rejected"
                              ? "error"
                              : neg.response === "counter-offered"
                                ? "warning"
                                : "processing"
                        }
                        className="mt-1"
                      >
                        {neg.response}
                      </Tag>
                    </div>
                  ),
                }))}
              />
            </>
          )}
        </Card>
      )}
    </>
  );
};

export default LeaseTracker;
