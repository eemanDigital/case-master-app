import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Empty, Spin, Button, Skeleton, Badge, Progress, Tooltip, Statistic } from 'antd';
import {
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  RiseOutlined,
  SafetyOutlined,
  FileProtectOutlined,
  BellOutlined,
  RightOutlined,
  AreaChartOutlined,
} from '@ant-design/icons';
import {
  fetchDashboard,
} from '../../redux/features/cacCompliance';

const formatCurrency = (amount) => {
  return '₦' + (amount || 0).toLocaleString('en-NG');
};

const getRiskColor = (level) => {
  switch (level) {
    case 'red': return '#ef4444';
    case 'amber': return '#f59e0b';
    case 'green': return '#22c55e';
    default: return '#6b7280';
  }
};

const StatCard = ({ title, value, icon, color, suffix, trend, loading }) => (
  <Card 
    className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    styles={{ body: { padding: '24px' } }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        {loading ? (
          <Skeleton.Input active size="large" style={{ width: 120 }} />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color }}>
              {suffix ? suffix(value) : value}
            </span>
            {trend !== undefined && (
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        )}
      </div>
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          {React.cloneElement(icon, { className: `w-7 h-7`, style: { color } })}
        </div>
    </div>
    <div 
      className="absolute bottom-0 left-0 right-0 h-1"
      style={{ backgroundColor: `${color}30` }}
    />
  </Card>
);

const RiskBadge = ({ level }) => {
  const colors = {
    red: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    amber: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    green: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' }
  };
  const c = colors[level] || colors.amber;
  
  return (
    <span 
      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {level}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const configs = {
    compliant: { bg: '#f0fdf4', text: '#16a34a' },
    due_soon: { bg: '#fffbeb', text: '#d97706' },
    overdue: { bg: '#fef2f2', text: '#dc2626' },
    violation: { bg: '#fef2f2', text: '#dc2626' },
    not_applicable: { bg: '#f3f4f6', text: '#6b7280' }
  };
  const c = configs[status] || configs.not_applicable;
  
  return (
    <span 
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status?.replace('_', ' ')}
    </span>
  );
};

const AtRiskCard = ({ company }) => (
  <Link 
    to={`/dashboard/cac-compliance/companies/${company._id}`}
    className="block"
  >
    <Card 
      className="transition-all duration-200 hover:shadow-md hover:border-opacity-50 group"
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: getRiskColor(company.riskLevel) }}
          >
            {company.name?.charAt(0) || 'C'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {company.name}
            </h4>
            <p className="text-sm text-gray-500">{company.rcNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-sm text-gray-500">Issue</p>
            <p className="font-medium text-gray-700 text-sm">{company.urgentProblem}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Liability</p>
            <p 
              className="font-bold text-lg"
              style={{ 
                color: company.totalLiability > 0 ? '#dc2626' : '#16a34a',
                fontFamily: "'IBM Plex Mono', monospace"
              }}
            >
              {formatCurrency(company.totalLiability)}
            </p>
          </div>
          <RightOutlined className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </Card>
  </Link>
);

const DeadlineCard = ({ deadline }) => {
  const daysColor = deadline.daysUntil <= 7 ? '#dc2626' : deadline.daysUntil <= 30 ? '#f59e0b' : '#6b7280';
  
  return (
    <Link 
      to={`/dashboard/cac-compliance/companies/${deadline.companyId}`}
      className="block"
    >
      <Card 
        className="transition-all duration-200 hover:shadow-md group"
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClockCircleOutlined className="w-4 h-4 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 text-sm">{deadline.companyName}</p>
              <p className="text-xs text-gray-500">{deadline.checkTypeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={deadline.status} />
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {new Date(deadline.dueDate).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </p>
              <p 
                className="text-sm font-semibold"
                style={{ color: daysColor }}
              >
                {deadline.daysUntil === 0 ? 'Today' : deadline.daysUntil === 1 ? 'Tomorrow' : `${deadline.daysUntil} days`}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

const CACDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, isLoading } = useSelector((state) => state.cacCompliance);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchDashboard());
    setRefreshing(false);
  };

  const { stats, atRiskCompanies, upcomingDeadlines } = dashboard;

  const complianceRate = stats.totalClients > 0 
    ? Math.round((stats.greenCount / stats.totalClients) * 100) 
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <SafetyOutlined className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">CAC Compliance</h1>
                <p className="text-sm text-gray-500">Monitor and manage client compliance</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              icon={<SyncOutlined spin={refreshing} className="w-4 h-4" />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Link to="/dashboard/cac-compliance/companies">
              <Button type="primary" icon={<TeamOutlined />}>
                View Companies
              </Button>
            </Link>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Total Clients"
              value={stats.totalClients || 0}
              icon={<TeamOutlined />}
              color="#3b82f6"
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="h-full"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">Compliance Rate</p>
                <Badge 
                  status={complianceRate >= 80 ? 'success' : complianceRate >= 50 ? 'warning' : 'error'} 
                  text={
                    <span className="text-sm font-medium">
                      {complianceRate >= 80 ? 'Good' : complianceRate >= 50 ? 'Fair' : 'Needs Work'}
                    </span>
                  }
                />
              </div>
              <Progress
                percent={complianceRate}
                strokeColor={{
                  '0%': '#3b82f6',
                  '100%': '#22c55e',
                }}
                trailColor="#e5e7eb"
                showInfo={false}
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                {stats.greenCount || 0} of {stats.totalClients || 0} clients compliant
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Needs Attention"
              value={stats.atRiskCount || 0}
              icon={<WarningOutlined />}
              color={stats.atRiskCount > 0 ? '#f59e0b' : '#22c55e'}
              loading={isLoading}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="h-full"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Liability</p>
                  {isLoading ? (
                    <Skeleton.Input active size="large" style={{ width: 140 }} />
                  ) : (
                    <p 
                      className="text-2xl font-bold"
                      style={{ 
                        color: (stats.totalFirmLiability || 0) > 0 ? '#dc2626' : '#16a34a',
                        fontFamily: "'IBM Plex Mono', monospace"
                      }}
                    >
                      {formatCurrency(stats.totalFirmLiability)}
                    </p>
                  )}
                </div>
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: (stats.totalFirmLiability || 0) > 0 ? '#fef2f2' : '#f0fdf4' }}
                >
                  <DollarOutlined 
                    className="w-7 h-7" 
                    style={{ color: (stats.totalFirmLiability || 0) > 0 ? '#dc2626' : '#16a34a' }} 
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <WarningOutlined className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <span className="font-semibold">Needs Attention</span>
                    <Badge 
                      count={atRiskCompanies?.length || 0} 
                      className="ml-2"
                      style={{ backgroundColor: '#dc2626' }}
                    />
                  </div>
                </div>
              }
              extra={
                <Link to="/dashboard/cac-compliance/companies?risk=red,amber" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All
                </Link>
              }
              className="h-full"
              styles={{ body: { padding: atRiskCompanies?.length > 0 ? '12px' : '24px' } }}
            >
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} styles={{ body: { padding: '16px' } }}>
                      <div className="flex items-center gap-4">
                        <Skeleton.Avatar active size={48} />
                        <div className="flex-1">
                          <Skeleton.Input active style={{ width: '60%' }} />
                          <Skeleton.Input active size="small" style={{ width: '40%' }} className="mt-2" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : atRiskCompanies && atRiskCompanies.length > 0 ? (
                <div className="space-y-2">
                  {atRiskCompanies.slice(0, 5).map((company) => (
                    <AtRiskCard key={company._id} company={company} />
                  ))}
                  {atRiskCompanies.length > 5 && (
                    <Link 
                      to="/dashboard/cac-compliance/companies?risk=red,amber"
                      className="block text-center py-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View {atRiskCompanies.length - 5} more...
                    </Link>
                  )}
                </div>
              ) : (
                <Empty
                  image={
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <CheckCircleOutlined className="w-10 h-10 text-green-500" />
                    </div>
                  }
                  description={
                    <div className="text-center">
                      <p className="text-lg font-semibold text-green-600">All Clear!</p>
                      <p className="text-gray-500">No compliance issues detected</p>
                    </div>
                  }
                />
              )}
            </Card>
          </Col>
          
          <Col xs={24} lg={10}>
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ClockCircleOutlined className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-semibold">Upcoming Deadlines</span>
                    <Badge 
                      count={upcomingDeadlines?.length || 0} 
                      className="ml-2"
                      style={{ backgroundColor: '#3b82f6' }}
                    />
                  </div>
                </div>
              }
              extra={
                <Link to="/dashboard/cac-compliance/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Tasks
                </Link>
              }
              className="h-full"
              styles={{ body: { padding: upcomingDeadlines?.length > 0 ? '12px' : '24px' } }}
            >
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} active paragraph={{ rows: 1 }} />
                  ))}
                </div>
              ) : upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {upcomingDeadlines.slice(0, 8).map((deadline) => (
                    <DeadlineCard key={`${deadline.companyId}-${deadline.checkType}`} deadline={deadline} />
                  ))}
                </div>
              ) : (
                <Empty
                  image={
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                      <AreaChartOutlined className="w-8 h-8 text-gray-400" />
                    </div>
                  }
                  description={
                    <div className="text-center">
                      <p className="text-gray-600 font-medium">No Upcoming Deadlines</p>
                      <p className="text-gray-400 text-sm">All clear for this month</p>
                    </div>
                  }
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <RiseOutlined className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">Quick Actions</span>
                </div>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Link to="/dashboard/cac-compliance/companies">
                    <Card 
                      className="text-center cursor-pointer hover:border-blue-500 transition-colors"
                      styles={{ body: { padding: '24px' } }}
                    >
                      <TeamOutlined className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-semibold">Manage Companies</h4>
                      <p className="text-sm text-gray-500">Add or view client companies</p>
                    </Card>
                  </Link>
                </Col>
                <Col xs={24} sm={8}>
                  <Link to="/dashboard/cac-compliance/tasks">
                    <Card 
                      className="text-center cursor-pointer hover:border-green-500 transition-colors"
                      styles={{ body: { padding: '24px' } }}
                    >
                      <FileProtectOutlined className="w-8 h-8 text-green-600 mx-auto mb-3" />
                      <h4 className="font-semibold">Filing Tasks</h4>
                      <p className="text-sm text-gray-500">Track CAC filings</p>
                    </Card>
                  </Link>
                </Col>
                <Col xs={24} sm={8}>
                  <Button
                    type="link"
                    className="text-center w-full h-full p-0"
                    onClick={handleRefresh}
                  >
                    <Card 
                      className="cursor-pointer hover:border-purple-500 transition-colors"
                      styles={{ body: { padding: '24px' } }}
                    >
                      <BellOutlined className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                      <h4 className="font-semibold">Check Alerts</h4>
                      <p className="text-sm text-gray-500">View compliance alerts</p>
                    </Card>
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <div className="text-center text-sm text-gray-400 py-4">
          <p>CAC Compliance Module • Data updates daily at 7:00 AM WAT</p>
        </div>
      </div>
    </div>
  );
};

export default CACDashboard;
