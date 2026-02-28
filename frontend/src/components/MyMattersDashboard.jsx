import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMyMattersSummary } from "../redux/features/matter/matterSlice";
import { Card, Table, Tag, Progress, Skeleton, Empty, Tooltip } from "antd";
import {
  FaBriefcase,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFire,
  FaArrowRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const getStatusColor = (status) => {
  const colors = {
    active: "green",
    pending: "orange",
    completed: "blue",
    closed: "default",
    "on-hold": "gold",
    archived: "default",
    settled: "purple",
    withdrawn: "red",
    won: "green",
    lost: "red",
  };
  return colors[status] || "default";
};

const getPriorityColor = (priority) => {
  const colors = {
    urgent: "red",
    high: "orange",
    medium: "blue",
    low: "default",
  };
  return colors[priority] || "default";
};

const MyMattersDashboard = ({ limit = 5, showHeader = true }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { myMattersSummary, isLoading } = useSelector((state) => state.matter);

  useEffect(() => {
    dispatch(getMyMattersSummary());
  }, [dispatch]);

  const summary = myMattersSummary?.summary || {};
  const recentMatters = myMattersSummary?.recentMatters || [];
  const byType = myMattersSummary?.byType || [];
  const byStatus = myMattersSummary?.byStatus || [];

  const columns = [
    {
      title: "Matter No.",
      dataIndex: "matterNumber",
      key: "matterNumber",
      render: (text) => (
        <span className="font-semibold text-blue-600">{text}</span>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)} className="uppercase text-xs">
          {status}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} className="uppercase text-xs">
          {priority}
        </Tag>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (!myMattersSummary) {
    return (
      <Card className="rounded-2xl shadow-lg">
        <Empty description="No matters assigned yet" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <FaBriefcase className="text-xl text-white" />
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">
                {summary.totalMatters || 0}
              </div>
              <div className="text-xs opacity-90">Total Matters</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <FaCheckCircle className="text-xl text-white" />
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">
                {summary.activeMatters || 0}
              </div>
              <div className="text-xs opacity-90">Active</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <FaClock className="text-xl text-white" />
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">
                {summary.pendingMatters || 0}
              </div>
              <div className="text-xs opacity-90">Pending</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <FaCheckCircle className="text-xl text-white" />
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">
                {summary.completedMatters || 0}
              </div>
              <div className="text-xs opacity-90">Completed</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <FaFire className="text-xl text-white" />
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">
                {summary.urgentMatters || 0}
              </div>
              <div className="text-xs opacity-90">Urgent</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20">
              <FaExclamationTriangle className="text-xl text-white" />
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">
                {summary.highPriorityMatters || 0}
              </div>
              <div className="text-xs opacity-90">High Priority</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card className="rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Completion Rate</h3>
          <span className="text-2xl font-bold text-blue-600">
            {summary.completionRate || 0}%
          </span>
        </div>
        <Progress
          percent={summary.completionRate || 0}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
          trailColor="#f0f0f0"
        />
      </Card>

      {/* Recent Matters Table */}
      {showHeader && (
        <Card
          className="rounded-2xl shadow-lg"
          title={
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">My Recent Matters</span>
              <button
                onClick={() => navigate("/matters?tab=my-matters")}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                View All <FaArrowRight />
              </button>
            </div>
          }>
          {recentMatters.length > 0 ? (
            <Table
              dataSource={recentMatters}
              columns={columns}
              rowKey="_id"
              pagination={false}
              size="small"
              className="mt-4"
              onRow={(record) => ({
                onClick: () => navigate(`/dashboard/matters/${record._id}`),
                className: "cursor-pointer hover:bg-gray-50",
              })}
            />
          ) : (
            <Empty description="No recent matters" className="py-8" />
          )}
        </Card>
      )}

      {/* By Status & Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-lg" title="Matters by Status">
          {byStatus.length > 0 ? (
            <div className="space-y-3">
              {byStatus.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between">
                  <Tag color={getStatusColor(item._id)} className="uppercase">
                    {item._id}
                  </Tag>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No data" />
          )}
        </Card>

        <Card className="rounded-2xl shadow-lg" title="Matters by Type">
          {byType.length > 0 ? (
            <div className="space-y-3">
              {byType.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between">
                  <span className="capitalize">{item._id}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No data" />
          )}
        </Card>
      </div>
    </div>
  );
};

export default MyMattersDashboard;
