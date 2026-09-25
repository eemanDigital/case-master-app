import PropTypes from "prop-types";
import { useEffect } from "react";
import { Card, Typography, Row, Col, Skeleton, Tag } from "antd";
import {
  CalendarOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  WomanOutlined,
  ManOutlined,
  PlusCircleOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  CalendarCheckOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import PageErrorAlert from "./PageErrorAlert";

const { Text } = Typography;

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString() : "N/A";

const LEAVE_CATEGORIES = [
  {
    key: "annualLeaveBalance",
    label: "Annual Leave",
    icon: <CalendarOutlined />,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    key: "sickLeaveBalance",
    label: "Sick Leave",
    icon: <MedicineBoxOutlined />,
    color: "#dc2626",
    bg: "#fef2f2",
  },
  {
    key: "compassionateLeaveBalance",
    label: "Compassionate Leave",
    icon: <HeartOutlined />,
    color: "#9333ea",
    bg: "#faf5ff",
  },
  {
    key: "maternityLeaveBalance",
    label: "Maternity Leave",
    icon: <WomanOutlined />,
    color: "#db2777",
    bg: "#fdf2f8",
  },
  {
    key: "paternityLeaveBalance",
    label: "Paternity Leave",
    icon: <ManOutlined />,
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    key: "carryOverDays",
    label: "Carry Over Days",
    icon: <PlusCircleOutlined />,
    color: "#d97706",
    bg: "#fffbeb",
  },
];

const LeaveBalanceDisplay = ({ userId }) => {
  const { data, loading, error, dataFetcher } = useDataFetch();

  useEffect(() => {
    const getBalance = async () => {
      if (userId) {
        await dataFetcher(`leaves/balances/${userId}`, "GET");
      }
    };
    getBalance();
  }, [userId, dataFetcher]);

  if (error) return <PageErrorAlert message={error.message} />;

  const balanceData = data?.data?.leaveBalance || data?.data;
  const year = balanceData?.year ?? new Date().getFullYear();

  if (loading) {
    return (
      <Card bordered={false} className="rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton.Avatar active shape="square" size={40} />
          <div className="flex-1">
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: 180 }} />
          </div>
        </div>
        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col xs={12} sm={8} lg={4} key={i}>
              <Card bordered={false} className="rounded-xl">
                <Skeleton active paragraph={false} title={{ width: "70%" }} />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  }

  return (
    <Card bordered={false} className="rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 text-lg">
          <CalendarCheckOutlined />
        </div>
        <div className="min-w-0">
          <Text strong className="!text-lg !text-slate-800 block leading-tight">
            Leave Balance
          </Text>
          <Text type="secondary" className="!text-xs sm:!text-sm block">
            Entitlements by type shown in days
          </Text>
        </div>
      </div>

      {/* Total Available Leave — summary banner */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-700 rounded-2xl px-5 sm:px-6 py-5 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text className="!text-[11px] font-medium uppercase tracking-wider text-indigo-200 block">
            Total Available Leave
          </Text>
          <div className="text-3xl sm:text-4xl font-bold text-white leading-none mt-1">
            {balanceData?.totalAvailableLeave ?? 0}{" "}
            <span className="text-lg sm:text-xl font-medium text-indigo-200">
              days
            </span>
          </div>
          <Text className="!text-xs text-indigo-200 block mt-2">
            Last updated {formatDate(balanceData?.updatedAt)}
          </Text>
        </div>
        <Tag
          color="gold"
          className="!m-0 font-semibold text-xs px-3 py-1 rounded-md">
          Year {year}
        </Tag>
      </div>

      {/* Per-type tiles */}
      <Row gutter={[16, 16]}>
        {LEAVE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const value = balanceData?.[cat.key] ?? 0;
          return (
            <Col xs={12} sm={8} lg={4} key={cat.key}>
              <div className="border border-slate-200 rounded-xl bg-white p-4 h-full flex flex-col justify-between gap-3 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <Text
                    type="secondary"
                    className="!text-[11px] font-medium uppercase tracking-wider block leading-tight">
                    {cat.label}
                  </Text>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: cat.bg, color: cat.color }}>
                    {Icon}
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-800">
                    {value}
                  </span>
                  <span className="text-xs text-slate-400">days</span>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Additional Information — footer strip */}
      <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
        <span className="flex items-center gap-2 text-xs text-slate-600">
          <CalendarOutlined className="text-slate-400" />
          <span className="font-medium">Year:</span> {year}
        </span>
        <span className="flex items-center gap-2 text-xs text-slate-600">
          <ClockCircleOutlined className="text-slate-400" />
          <span className="font-medium">Last Updated:</span>{" "}
          {formatDate(balanceData?.updatedAt)}
        </span>
        <span className="flex items-center gap-2 text-xs text-slate-600">
          <FieldTimeOutlined className="text-slate-400" />
          <span className="font-medium">Created:</span>{" "}
          {formatDate(balanceData?.createdAt)}
        </span>
      </div>
    </Card>
  );
};

LeaveBalanceDisplay.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default LeaveBalanceDisplay;