import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Tag,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Skeleton,
  Divider,
  Space,
  Popconfirm,
  Empty,
  Row,
  Col,
  Statistic,
  Tooltip,
  Typography,
  Collapse,
} from 'antd';
import {
  ArrowLeftOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  SendOutlined,
  PrinterOutlined,
  SaveOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined,
  SafetyOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  EditOutlined,
  BankOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  fetchCompany,
  updateCompany,
  runAudit,
  resolveCheck,
  clearCurrentCompany,
} from '../../redux/features/cacCompliance';
import {
  fetchTasksByCompany,
  createTask,
  updateTask,
} from '../../redux/features/cacCompliance';
import {
  fetchLettersByCompany,
  generateLetter,
} from '../../redux/features/cacCompliance';

const { Option = Select.Option } = Select;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;
const { TextArea } = Input;

const formatCurrency = (amount) => {
  return '₦' + (amount || 0).toLocaleString('en-NG');
};

const getRiskColor = (level) => {
  const colors = {
    red: '#dc2626',
    amber: '#d97706',
    green: '#16a34a',
  };
  return colors[level] || '#6b7280';
};

const getStatusConfig = (status) => {
  const configs = {
    compliant: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: CheckCircleOutlined },
    due_soon: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', icon: ClockCircleOutlined },
    overdue: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: WarningOutlined },
    violation: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: WarningOutlined },
    not_applicable: { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb', icon: ClockCircleOutlined },
  };
  return configs[status] || configs.not_applicable;
};

import React from 'react';

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {React.createElement(Icon, { style: { fontSize: 14 } })}
      {status?.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

const RiskBadge = ({ level }) => {
  const colors = {
    red: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    amber: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    green: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };
  const c = colors[level] || colors.green;
  return (
    <Tag
      className="px-4 py-1.5 rounded-full text-sm font-bold"
      style={{
        backgroundColor: c.bg,
        color: c.text,
        border: `2px solid ${c.border}`,
      }}
    >
      {level?.toUpperCase()} RISK
    </Tag>
  );
};

const taskTypes = [
  { value: 'file_annual_return', label: 'File Annual Return' },
  { value: 'file_psc', label: 'File PSC' },
  { value: 'update_psc', label: 'Update PSC' },
  { value: 'file_director_change', label: 'File Director Change' },
  { value: 'file_address_change', label: 'File Address Change' },
  { value: 'file_share_capital', label: 'File Share Capital' },
  { value: 'file_allotment', label: 'File Allotment' },
  { value: 'register_charge', label: 'Register Charge' },
  { value: 'file_agm_resolution', label: 'File AGM Resolution' },
  { value: 'general_filing', label: 'General Filing' },
];

const letterTemplates = [
  { value: 'annual_return_overdue', label: 'Annual Returns Overdue' },
  { value: 'psc_violation', label: 'PSC Violation' },
  { value: 'agm_non_compliance', label: 'AGM Non-Compliance' },
  { value: 'general_non_compliance', label: 'General Non-Compliance' },
];

const companyTypeLabels = {
  small_private: 'Small Private Company',
  private: 'Private Company',
  public: 'Public Company',
  company_limited_by_guarantee: 'Company Limited by Guarantee',
  single_member: 'Single Member Company',
  llp: 'Limited Liability Partnership (LLP)',
  lp: 'Limited Partnership (LP)',
  business_name: 'Business Name',
  incorporated_trustees: 'Incorporated Trustees',
};

const ComplianceCheckCard = ({ check, onResolve, onExpand, isExpanded }) => {
  const config = getStatusConfig(check.status);
  const Icon = config.icon;
  const totalPenalty = check.estimatedPenalty?.totalLiability || 0;
  const isActionable = ['overdue', 'violation', 'due_soon'].includes(check.status);

  return (
    <Card
      className={`mb-4 transition-all duration-200 ${isActionable ? 'border-l-4' : ''}`}
      style={{
        borderLeftColor: isActionable ? config.text : undefined,
      }}
      styles={{ body: { padding: '20px' } }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.bg }}
          >
            {React.createElement(Icon, { style: { fontSize: 24, color: config.text } })}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-semibold text-lg">{check.checkTypeLabel}</h4>
              <StatusBadge status={check.status} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarOutlined style={{ fontSize: 16 }} />
                Due: {check.dueDate ? new Date(check.dueDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : 'N/A'}
              </span>
              {check.daysOverdue > 0 && (
                <Tag color="red" className="font-medium">
                  {check.daysOverdue} days overdue
                </Tag>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {totalPenalty > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Penalty</p>
              <p
                className="text-xl font-bold"
                style={{
                  color: config.text,
                  fontFamily: "'IBM Plex Mono', monospace"
                }}
              >
                {formatCurrency(totalPenalty)}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              size="small"
              icon={isExpanded ? <UpOutlined className="w-4 h-4" /> : <DownOutlined className="w-4 h-4" />}
              onClick={() => onExpand(check._id)}
            >
              {isExpanded ? 'Hide' : 'Details'}
            </Button>
            {isActionable && !check.isResolved && (
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined className="w-4 h-4" />}
                onClick={() => onResolve(check._id)}
              >
                Resolve
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t space-y-4">
          {check.legalBasis && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-1">Legal Basis</p>
              <p className="text-sm text-blue-700">{check.legalBasis}</p>
            </div>
          )}
          {check.estimatedPenalty?.calculationBreakdown && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-slate-800 mb-2">Penalty Breakdown</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                {check.estimatedPenalty.calculationBreakdown}
              </p>
            </div>
          )}
          {check.advisoryNote && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-800 mb-1">Advisory Note</p>
              <p className="text-sm text-amber-700">{check.advisoryNote}</p>
            </div>
          )}
          {check.recommendedAction && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-1">Recommended Action</p>
              <p className="text-sm text-green-700">{check.recommendedAction}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const PenaltySummary = ({ checks }) => {
  const totals = useMemo(() => {
    return checks.reduce((acc, check) => {
      const penalty = check.estimatedPenalty || {};
      return {
        company: acc.company + (penalty.companyLiability || 0),
        director: acc.director + (penalty.perDirectorLiability || 0),
        secretary: acc.secretary + (penalty.secretaryLiability || 0),
        total: acc.total + (penalty.totalLiability || 0),
      };
    }, { company: 0, director: 0, secretary: 0, total: 0 });
  }, [checks]);

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <DollarOutlined className="w-5 h-5 text-red-500" />
          <span>Penalty Summary</span>
        </div>
      }
      styles={{ body: { padding: '20px' } }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Company</p>
            <p className="text-lg font-semibold font-mono" style={{ color: totals.company > 0 ? '#dc2626' : '#16a34a' }}>
              {formatCurrency(totals.company)}
            </p>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Per Director</p>
            <p className="text-lg font-semibold font-mono" style={{ color: totals.director > 0 ? '#dc2626' : '#16a34a' }}>
              {formatCurrency(totals.director)}
            </p>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Secretary</p>
            <p className="text-lg font-semibold font-mono" style={{ color: totals.secretary > 0 ? '#dc2626' : '#16a34a' }}>
              {formatCurrency(totals.secretary)}
            </p>
          </div>
        </Col>
        <Col xs={12} lg={6}>
          <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <p className="text-xs text-red-500 uppercase tracking-wide mb-1 font-semibold">Total Liability</p>
            <p 
              className="text-xl font-bold font-mono"
              style={{ color: totals.total > 500000 ? '#dc2626' : totals.total > 0 ? '#d97706' : '#16a34a' }}
            >
              {formatCurrency(totals.total)}
            </p>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

const CACCompanyDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { currentCompany, currentCompanyChecks, isLoading } = useSelector((state) => state.cacCompliance);
  const { tasks, isLoading: tasksLoading } = useSelector((state) => state.cacTasks);
  const { letters, isLoading: lettersLoading } = useSelector((state) => state.cacLetters);

  const [activeTab, setActiveTab] = useState('compliance');
  const [expandedChecks, setExpandedChecks] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isLetterPreviewOpen, setIsLetterPreviewOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taskForm] = Form.useForm();
  const [letterForm] = Form.useForm();
  const [companyForm] = Form.useForm();

  const loadData = useCallback(() => {
    dispatch(fetchCompany(id));
    dispatch(fetchTasksByCompany(id));
    dispatch(fetchLettersByCompany(id));
  }, [dispatch, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentCompany());
    };
  }, [dispatch]);

  useEffect(() => {
    if (currentCompany && isEditing) {
      companyForm.setFieldsValue({
        ...currentCompany,
        incorporationDate: currentCompany.incorporationDate
          ? new Date(currentCompany.incorporationDate).toISOString().split('T')[0]
          : null,
        lastAnnualReturnDate: currentCompany.lastAnnualReturnDate
          ? new Date(currentCompany.lastAnnualReturnDate).toISOString().split('T')[0]
          : null,
        lastAGMDate: currentCompany.lastAGMDate
          ? new Date(currentCompany.lastAGMDate).toISOString().split('T')[0]
          : null,
        pscFiledDate: currentCompany.pscFiledDate
          ? new Date(currentCompany.pscFiledDate).toISOString().split('T')[0]
          : null,
      });
    }
  }, [currentCompany, isEditing, companyForm]);

  const handleRunAudit = async () => {
    try {
      await dispatch(runAudit(id)).unwrap();
      message.success({ content: 'Compliance audit completed', duration: 3 });
    } catch (error) {
      message.error({ content: error || 'Failed to run audit', duration: 4 });
    }
  };

  const handleResolveCheck = async (checkId) => {
    try {
      await dispatch(resolveCheck(checkId)).unwrap();
      message.success({ content: 'Check marked as resolved', duration: 3 });
    } catch (error) {
      message.error({ content: error || 'Failed to resolve check', duration: 4 });
    }
  };

  const handleCreateTask = async (values) => {
    setSubmitting(true);
    try {
      await dispatch(createTask({ ...values, companyId: id })).unwrap();
      message.success({ content: 'Filing task created', duration: 3 });
      setIsTaskModalOpen(false);
      taskForm.resetFields();
      dispatch(fetchTasksByCompany(id));
    } catch (error) {
      message.error({ content: error || 'Failed to create task', duration: 4 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      await dispatch(updateTask({ id: taskId, data: { status } })).unwrap();
      message.success({ content: 'Task updated', duration: 3 });
      dispatch(fetchTasksByCompany(id));
    } catch (error) {
      message.error({ content: error || 'Failed to update task', duration: 4 });
    }
  };

  const handleGenerateLetter = async (values) => {
    setSubmitting(true);
    try {
      const result = await dispatch(generateLetter({ companyId: id, ...values })).unwrap();
      setSelectedLetter(result);
      setIsLetterModalOpen(false);
      setIsLetterPreviewOpen(true);
      letterForm.resetFields();
    } catch (error) {
      message.error({ content: error || 'Failed to generate letter', duration: 4 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkLetterSent = async () => {
    try {
      await dispatch({
        type: 'cacLetters/markLetterSent/fulfilled',
        payload: { _id: selectedLetter._id, status: 'sent', sentAt: new Date() },
      });
      message.success({ content: 'Letter marked as sent', duration: 3 });
      setIsLetterPreviewOpen(false);
      dispatch(fetchLettersByCompany(id));
    } catch (error) {
      message.error({ content: error || 'Failed to mark letter as sent', duration: 4 });
    }
  };

  const handlePrintLetter = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedLetter?.subject || 'Advisory Letter'}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; padding: 40px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${selectedLetter?.content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleUpdateCompany = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        incorporationDate: values.incorporationDate ? new Date(values.incorporationDate) : undefined,
        lastAnnualReturnDate: values.lastAnnualReturnDate ? new Date(values.lastAnnualReturnDate) : undefined,
        lastAGMDate: values.lastAGMDate ? new Date(values.lastAGMDate) : undefined,
        pscFiledDate: values.pscFiledDate ? new Date(values.pscFiledDate) : undefined,
      };
      await dispatch(updateCompany({ id, data: payload })).unwrap();
      message.success({ content: 'Company updated', duration: 3 });
      setIsEditing(false);
    } catch (error) {
      message.error({ content: error || 'Failed to update company', duration: 4 });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !currentCompany) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spin size="large" tip="Loading company details..." />
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Empty description="Company not found">
          <Link to="/dashboard/cac-compliance/companies">
            <Button type="primary">Back to Companies</Button>
          </Link>
        </Empty>
      </div>
    );
  }

  const totalLiability = currentCompanyChecks.reduce(
    (sum, check) => sum + (check.estimatedPenalty?.totalLiability || 0),
    0
  );

  const taskColumns = [
    {
      title: 'Type',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (type) => taskTypes.find(t => t.value === type)?.label || type,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (p) => (
        <Tag color={p === 'urgent' ? 'red' : p === 'high' ? 'orange' : p === 'medium' ? 'blue' : 'default'}>
          {p?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={s === 'filed' ? 'green' : s === 'in_progress' ? 'blue' : 'orange'}>
          {s?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Select
          value={record.status}
          onChange={(value) => handleUpdateTaskStatus(record._id, value)}
          size="small"
          onClick={(e) => e.stopPropagation()}
        >
          <Option value="pending">Pending</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="filed">Filed</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
      ),
    },
  ];

  const letterColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Type',
      dataIndex: 'templateType',
      key: 'templateType',
      render: (type) => letterTemplates.find(t => t.value === type)?.label || type,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={s === 'sent' ? 'green' : 'orange'}>
          {s?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLetter(record);
              setIsLetterPreviewOpen(true);
            }}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'compliance',
      label: (
        <span className="flex items-center gap-2">
          <SafetyOutlined className="w-4 h-4" />
          Compliance
          {currentCompanyChecks.filter(c => !['compliant', 'not_applicable'].includes(c.status)).length > 0 && (
            <Tag color="red" className="ml-1">
              {currentCompanyChecks.filter(c => !['compliant', 'not_applicable'].includes(c.status)).length}
            </Tag>
          )}
        </span>
      ),
      children: (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              type="primary"
              icon={<FileTextOutlined className="w-4 h-4" />}
              onClick={() => setIsLetterModalOpen(true)}
            >
              Generate Letter
            </Button>
            <Button
              icon={<PlusOutlined className="w-4 h-4" />}
              onClick={() => setIsTaskModalOpen(true)}
            >
              Create Task
            </Button>
          </div>

          {currentCompanyChecks.map((check) => (
            <ComplianceCheckCard
              key={check._id}
              check={check}
              onResolve={handleResolveCheck}
              onExpand={(checkId) => {
                setExpandedChecks(prev =>
                  prev.includes(checkId)
                    ? prev.filter(id => id !== checkId)
                    : [...prev, checkId]
                );
              }}
              isExpanded={expandedChecks.includes(check._id)}
            />
          ))}

          <PenaltySummary checks={currentCompanyChecks} />
        </div>
      ),
    },
    {
      key: 'tasks',
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined className="w-4 h-4" />
          Filing Tasks
          <Tag className="ml-1">{tasks.length}</Tag>
        </span>
      ),
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined className="w-4 h-4" />} onClick={() => setIsTaskModalOpen(true)}>
              New Task
            </Button>
          }
        >
          <Table
            dataSource={tasks}
            columns={taskColumns}
            rowKey="_id"
            pagination={false}
            loading={tasksLoading}
            locale={{ emptyText: 'No filing tasks' }}
          />
        </Card>
      ),
    },
    {
      key: 'letters',
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined className="w-4 h-4" />
          Letters
          <Tag className="ml-1">{letters.length}</Tag>
        </span>
      ),
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined className="w-4 h-4" />} onClick={() => setIsLetterModalOpen(true)}>
              Generate Letter
            </Button>
          }
        >
          <Table
            dataSource={letters}
            columns={letterColumns}
            rowKey="_id"
            pagination={false}
            loading={lettersLoading}
            locale={{ emptyText: 'No advisory letters' }}
          />
        </Card>
      ),
    },
    {
      key: 'details',
      label: (
        <span className="flex items-center gap-2">
          <EditOutlined className="w-4 h-4" />
          Details
        </span>
      ),
      children: (
        <Card
          title="Company Information"
          extra={
            !isEditing && (
              <Button
                type="primary"
                icon={<EditOutlined className="w-4 h-4" />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )
          }
        >
          {isEditing ? (
            <Form
              form={companyForm}
              layout="vertical"
              onFinish={handleUpdateCompany}
              className="max-w-2xl"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="Company Name">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="rcNumber" label="RC Number">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="incorporationDate" label="Incorporation Date">
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="numDirectors" label="Number of Directors">
                    <Input type="number" min={1} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="pscFiled" label="PSC Filed" valuePropName="checked">
                    <input type="checkbox" className="w-5 h-5" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="pscHasConflict" label="PSC Has Conflict" valuePropName="checked">
                    <input type="checkbox" className="w-5 h-5" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="firstAnnualReturnFiled" label="First Annual Return Filed" valuePropName="checked">
                    <input type="checkbox" className="w-5 h-5" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="lastAnnualReturnDate" label="Last Annual Return Date">
                    <Input type="date" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="notes" label="Notes">
                <TextArea rows={4} />
              </Form.Item>
              <Form.Item className="mb-0">
                <Space>
                  <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    Save Changes
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="font-medium">{currentCompany.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">RC Number</p>
                <p className="font-medium">{currentCompany.rcNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Entity Type</p>
                <p className="font-medium">{companyTypeLabels[currentCompany.type] || currentCompany.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Incorporation Date</p>
                <p className="font-medium">
                  {currentCompany.incorporationDate
                    ? new Date(currentCompany.incorporationDate).toLocaleDateString('en-GB')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Directors/Partners</p>
                <p className="font-medium">{currentCompany.numDirectors}</p>
              </div>
              {['small_private', 'private', 'public', 'company_limited_by_guarantee', 'single_member', 'llp', 'lp'].includes(currentCompany.type) && (
                <div>
                  <p className="text-sm text-gray-500">Share Capital</p>
                  <p className="font-medium">
                    {currentCompany.shareCapital 
                      ? '₦' + currentCompany.shareCapital.toLocaleString('en-NG')
                      : '₦100,000 (default)'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">PSC Filed</p>
                <p className="font-medium">{currentCompany.pscFiled ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">First Annual Return Filed</p>
                <p className="font-medium">{currentCompany.firstAnnualReturnFiled ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Filing Fee</p>
                <p className="font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {currentCompany.filingFee 
                    ? '₦' + currentCompany.filingFee.toLocaleString('en-NG')
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium">{currentCompany.notes || '-'}</p>
              </div>
            </div>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/cac-compliance/companies">
              <Button icon={<ArrowLeftOutlined className="w-4 h-4" />} size="large" />
            </Link>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: getRiskColor(currentCompany.complianceRiskLevel) }}
              >
                {currentCompany.name?.charAt(0) || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{currentCompany.name}</h1>
                  <RiskBadge level={currentCompany.complianceRiskLevel} />
                </div>
                <p className="text-gray-500">{currentCompany.rcNumber}</p>
              </div>
            </div>
          </div>
          <Button
            icon={<SyncOutlined className="w-4 h-4" />}
            onClick={handleRunAudit}
            loading={isLoading}
            size="large"
          >
            Run Audit
          </Button>
        </div>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Card styles={{ body: { padding: '16px' } }}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Company Type</p>
              <p className="font-semibold">{companyTypeLabels[currentCompany.type] || currentCompany.type}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card styles={{ body: { padding: '16px' } }}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Incorporated</p>
              <p className="font-semibold">
                {currentCompany.incorporationDate
                  ? new Date(currentCompany.incorporationDate).toLocaleDateString('en-GB')
                  : '-'}
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card styles={{ body: { padding: '16px' } }}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Directors</p>
              <p className="font-semibold">{currentCompany.numDirectors}</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card styles={{ body: { padding: '16px' } }}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Liability</p>
              <p 
                className="font-bold text-lg"
                style={{ 
                  color: totalLiability > 0 ? '#dc2626' : '#16a34a',
                  fontFamily: "'IBM Plex Mono', monospace"
                }}
              >
                {formatCurrency(totalLiability)}
              </p>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="cac-compliance-tabs"
          />
        </Card>

        <Modal
          title="Create Filing Task"
          open={isTaskModalOpen}
          onCancel={() => { setIsTaskModalOpen(false); taskForm.resetFields(); }}
          footer={null}
          width={500}
        >
          <Form form={taskForm} layout="vertical" onFinish={handleCreateTask} className="mt-4">
            <Form.Item name="taskType" label="Task Type" rules={[{ required: true }]}>
              <Select placeholder="Select task type" size="large">
                {taskTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input placeholder="Task title" size="large" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={3} placeholder="Optional description..." />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="priority" label="Priority" initialValue="medium">
                  <Select size="large">
                    <Option value="low">Low</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="high">High</Option>
                    <Option value="urgent">Urgent</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dueDate" label="Due Date">
                  <Input type="date" size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item className="mb-0">
              <div className="flex justify-end gap-3">
                <Button onClick={() => { setIsTaskModalOpen(false); taskForm.resetFields(); }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Create Task
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Generate Advisory Letter"
          open={isLetterModalOpen}
          onCancel={() => { setIsLetterModalOpen(false); letterForm.resetFields(); }}
          footer={null}
          width={500}
        >
          <Form form={letterForm} layout="vertical" onFinish={handleGenerateLetter} className="mt-4">
            <Form.Item name="templateType" label="Template Type" rules={[{ required: true }]}>
              <Select placeholder="Select template" size="large">
                {letterTemplates.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="customNote" label="Additional Note (Optional)">
              <TextArea rows={4} placeholder="Any additional notes..." />
            </Form.Item>
            <Form.Item className="mb-0">
              <div className="flex justify-end gap-3">
                <Button onClick={() => { setIsLetterModalOpen(false); letterForm.resetFields(); }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Generate Letter
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={selectedLetter?.subject || 'Letter Preview'}
          open={isLetterPreviewOpen}
          onCancel={() => setIsLetterPreviewOpen(false)}
          width={800}
          footer={
            <Space>
              <Button icon={<PrinterOutlined className="w-4 h-4" />} onClick={handlePrintLetter}>
                Print / Save PDF
              </Button>
              {selectedLetter?.status === 'draft' && (
                <Button
                  type="primary"
                  icon={<SendOutlined className="w-4 h-4" />}
                  onClick={handleMarkLetterSent}
                >
                  Mark as Sent
                </Button>
              )}
            </Space>
          }
        >
          <div
            className="prose max-w-none p-8 bg-white rounded-lg shadow-inner"
            dangerouslySetInnerHTML={{ __html: selectedLetter?.content || '' }}
            style={{
              fontFamily: "'Times New Roman', serif",
              fontSize: "12pt",
              lineHeight: 1.6,
              minHeight: 400,
            }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default CACCompanyDetail;
