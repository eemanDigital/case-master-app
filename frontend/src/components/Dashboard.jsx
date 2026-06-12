import { useEffect, useMemo } from "react";
import { Card, Skeleton, Alert } from "antd";
import { useAdminHook } from "../hooks/useAdminHook";
import {
  RightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  FaBriefcase,
  FaGavel,
  FaTasks,
  FaExclamationTriangle,
} from "react-icons/fa";

import { useSelector, useDispatch } from "react-redux";
import ScrollingEvents from "./ScrollingEvents";

import { ShowOnlyVerifiedUser, ShowStaff } from "./protect/Protect";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import VerifyAccountNotice from "./VerifyAccountNotice";
import ClientMatterDashboard from "./clientDashboard/ClientMatterDashboard";
import {
  getMatterStats,
  getMyMattersSummary,
} from "../redux/features/matter/matterSlice";
import { fetchUpcomingHearings } from "../redux/features/litigation/litigationSlice";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

const StatCard = ({ icon: Icon, value, label, href, gradient, accent }) => (
  <Link to={href} className="block h-full">
    <Card
      className={`h-full bg-gradient-to-br ${gradient} border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden relative`}
      bodyStyle={{ height: '100%' }}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
      <div className="flex items-center justify-between h-full relative z-10">
        <div className="text-white">
          <div className="text-3xl font-bold tracking-tight">{value ?? 0}</div>
          <div className="text-sm font-medium opacity-90 mt-1">{label}</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
          <Icon className="text-2xl text-white" />
        </div>
      </div>
    </Card>
  </Link>
);

const CompactHearingRow = ({ hearing }) => {
  const date = hearing.nextHearingDate || hearing.date;
  const isToday = dayjs(date).isSame(dayjs(), "day");
  return (
    <Link
      to={`/dashboard/matters/litigation/${hearing.matterId}`}
      className={`block p-3 rounded-xl border transition-all hover:shadow-md ${
        isToday
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
      }`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
            isToday
              ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}>
          <span className="text-sm font-bold leading-none">
            {dayjs(date).format("D")}
          </span>
          <span className="text-[8px] font-semibold uppercase">
            {dayjs(date).format("MMM")}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {hearing.matter?.title || hearing.suitNo || "Hearing"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {hearing.courtName || "Court"} · {hearing.purpose || "Hearing"}
          </p>
        </div>
        <span
          className={`text-xs font-medium whitespace-nowrap ${
            isToday ? "text-emerald-600 font-bold" : "text-gray-400"
          }`}>
          {isToday ? "TODAY" : dayjs(date).format("MMM D")}
        </span>
      </div>
    </Link>
  );
};

const CompactTaskRow = ({ task }) => {
  const overdue =
    task.dueDate && dayjs(task.dueDate).isBefore(dayjs(), "day");
  return (
    <Link
      to={`/dashboard/tasks/${task._id}/details`}
      className="block p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            overdue ? "bg-red-500" : "bg-blue-500"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {task.title}
          </p>
          <p className="text-xs text-gray-500">
            {task.dueDate
              ? overdue
                ? `Overdue · ${dayjs(task.dueDate).format("MMM D")}`
                : `Due ${dayjs(task.dueDate).format("MMM D")}`
              : "No due date"}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            task.status === "completed"
              ? "bg-emerald-100 text-emerald-700"
              : overdue
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
          }`}>
          {task.status === "completed"
            ? "Done"
            : overdue
              ? "Overdue"
              : "Pending"}
        </span>
      </div>
    </Link>
  );
};

const Dashboard = () => {
  useRedirectLogoutUser("/users/login");
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { stats: matterStats, isLoading: matterLoading } = useSelector(
    (state) => state.matter,
  );
  const { myMattersSummary } = useSelector((state) => state.matter);

  const taskState = useSelector((state) => state.task);
  const tasksData = taskState?.entities
    ? Object.values(taskState.entities)
    : [];

  const hearings = useSelector(
    (state) => state.litigation?.upcomingHearings ?? [],
  );
  const hearingsLoading = useSelector(
    (state) => state.litigation?.statsLoading ?? false,
  );

  const { isStaff, isClient, isVerified } = useAdminHook();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    if (!isClient) {
      if (!matterStats) dispatch(getMatterStats());
      if (!myMattersSummary) dispatch(getMyMattersSummary());
      if (!hearings || hearings.length === 0)
        dispatch(fetchUpcomingHearings({ range: "all", limit: 50 }));
    }
  }, [dispatch, isClient, matterStats, myMattersSummary]);

  const tasksForMe = useMemo(
    () =>
      tasksData
        .filter((t) => t.status !== "completed")
        .slice(0, 5),
    [tasksData],
  );

  const upcomingHearings = useMemo(
    () =>
      (Array.isArray(hearings) ? hearings : [])
        .filter((h) => {
          const d = h.nextHearingDate || h.date;
          return d && dayjs(d).isAfter(dayjs().subtract(1, "day"));
        })
        .slice(0, 5),
    [hearings],
  );

  const recentMatters = useMemo(
    () => (myMattersSummary?.recentMatters ?? []).slice(0, 5),
    [myMattersSummary],
  );

  if (user?.error)
    return <Alert message={user.error} type="error" showIcon />;

  return (
    <>
      {!isVerified && <VerifyAccountNotice />}

      <ShowOnlyVerifiedUser>
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 md:py-6">
            <ShowStaff>
              <ScrollingEvents />
            </ShowStaff>

            {isClient && <ClientMatterDashboard />}

            {isStaff && (
              <>
                <header className="mb-8">
                  <div>
                    <p className="text-sm font-medium text-content-secondary">
                      {greeting}, {user?.data?.firstName}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">
                      Welcome back
                    </h1>
                  </div>
                </header>

                <section className="mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      icon={FaBriefcase}
                      value={matterStats?.activeMatters ?? 0}
                      label="Active Matters"
                      href="/dashboard/matters"
                      gradient="from-blue-600 to-blue-700"
                    />
                    <StatCard
                      icon={FaGavel}
                      value={upcomingHearings.length}
                      label="Upcoming Hearings"
                      href="/dashboard/calendar"
                      gradient="from-violet-600 to-violet-700"
                    />
                    <StatCard
                      icon={FaTasks}
                      value={tasksForMe.length}
                      label="Pending Tasks"
                      href="/dashboard/tasks"
                      gradient="from-emerald-600 to-emerald-700"
                    />
                    <StatCard
                      icon={FaExclamationTriangle}
                      value={
                        tasksData.filter((t) => {
                          if (t.status === "completed") return false;
                          return (
                            t.dueDate &&
                            dayjs(t.dueDate).isBefore(dayjs(), "day")
                          );
                        }).length
                      }
                      label="Overdue Items"
                      href="/dashboard/tasks"
                      gradient="from-red-600 to-red-700"
                    />
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card
                    className="shadow-lg border-border rounded-2xl"
                    bordered={false}
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-content-primary flex items-center gap-2">
                          <CalendarOutlined className="text-primary-500" />
                          Upcoming Hearings
                        </span>
                        <Link
                          to="/dashboard/calendar"
                          className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
                          View all <RightOutlined />
                        </Link>
                      </div>
                    }>
                    {hearingsLoading ? (
                      <Skeleton active paragraph={{ rows: 5 }} />
                    ) : upcomingHearings.length > 0 ? (
                      <div className="space-y-2">
                        {upcomingHearings.map((h) => (
                          <CompactHearingRow key={h._id} hearing={h} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-400">
                        <CalendarOutlined className="text-3xl mb-3 block" />
                        <p className="text-sm font-medium">No upcoming hearings</p>
                      </div>
                    )}
                  </Card>

                  <Card
                    className="shadow-lg border-border rounded-2xl"
                    bordered={false}
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-content-primary flex items-center gap-2">
                          <ClockCircleOutlined className="text-warning-500" />
                          My Tasks
                        </span>
                        <Link
                          to="/dashboard/tasks"
                          className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
                          View all <RightOutlined />
                        </Link>
                      </div>
                    }>
                    {taskState.loading ? (
                      <Skeleton active paragraph={{ rows: 5 }} />
                    ) : tasksForMe.length > 0 ? (
                      <div className="space-y-2">
                        {tasksForMe.map((t) => (
                          <CompactTaskRow key={t._id} task={t} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-400">
                        <ClockCircleOutlined className="text-3xl mb-3 block" />
                        <p className="text-sm font-medium">No pending tasks</p>
                      </div>
                    )}
                  </Card>
                </div>

                <Card
                  className="shadow-lg border-border rounded-2xl mb-8"
                  bordered={false}
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-content-primary flex items-center gap-2">
                        <FaBriefcase className="text-primary-500" />
                        Recent Matters
                      </span>
                      <Link
                        to="/dashboard/matters"
                        className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1">
                        View all <RightOutlined />
                      </Link>
                    </div>
                  }>
                  {recentMatters.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {recentMatters.map((m) => (
                        <Link
                          key={m._id}
                          to={`/dashboard/matters/${m._id}`}
                          className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 transition-colors rounded-lg -mx-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {m.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {m.matterNumber} · {m.matterType}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                                m.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : m.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : m.status === "completed"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-600"
                              }`}>
                              {m.status}
                            </span>
                            <RightOutlined className="text-gray-300 text-xs" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      <FaBriefcase className="text-3xl mb-3 mx-auto" />
                      <p className="text-sm font-medium">No matters assigned</p>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </ShowOnlyVerifiedUser>
    </>
  );
};

export default Dashboard;
