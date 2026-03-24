import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Space,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Popconfirm,
  Row,
  Col,
  Badge,
  Empty,
  Statistic,
  Typography,
  Tooltip,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  DeleteOutlined,
  SyncOutlined,
  CalendarOutlined,
  DollarOutlined,
  SearchOutlined,
  CloseOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import {
  fetchTasks,
  fetchOverdueTasks,
  createTask,
  updateTask,
  deleteTask,
  fetchCompanies,
} from '../../redux/features/cacCompliance';

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

const formatCurrency = (amount) => {
  return '₦' + (amount || 0).toLocaleString('en-NG');
};

const taskTypes = [
  { value: 'file_annual_return', label: 'File Annual Return', color: '#3b82f6' },
  { value: 'file_psc', label: 'File PSC', color: '#ef4444' },
  { value: 'update_psc', label: 'Update PSC', color: '#f97316' },
  { value: 'file_director_change', label: 'File Director Change', color: '#8b5cf6' },
  { value: 'file_address_change', label: 'File Address Change', color: '#06b6d4' },
  { value: 'file_share_capital', label: 'File Share Capital', color: '#10b981' },
  { value: 'file_allotment', label: 'File Allotment', color: '#f59e0b' },
  { value: 'register_charge', label: 'Register Charge', color: '#ec4899' },
  { value: 'file_agm_resolution', label: 'File AGM Resolution', color: '#6366f1' },
  { value: 'general_filing', label: 'General Filing', color: '#6b7280' },
];

const getTaskTypeConfig = (type) => {
  return taskTypes.find(t => t.value === type) || { label: type, color: '#6b7280' };
};

const getPriorityConfig = (priority) => {
  const configs = {
    urgent: { color: '#dc2626', bg: '#fef2f2', label: 'URGENT' },
    high: { color: '#ea580c', bg: '#fff7ed', label: 'HIGH' },
    medium: { color: '#0284c7', bg: '#f0f9ff', label: 'MEDIUM' },
    low: { color: '#16a34a', bg: '#f0fdf4', label: 'LOW' },
  };
  return configs[priority] || configs.medium;
};

const getStatusConfig = (status) => {
  const configs = {
    pending: { color: '#d97706', bg: '#fffbeb', label: 'PENDING' },
    in_progress: { color: '#0284c7', bg: '#f0f9ff', label: 'IN PROGRESS' },
    filed: { color: '#16a34a', bg: '#f0fdf4', label: 'FILED' },
    cancelled: { color: '#6b7280', bg: '#f3f4f6', label: 'CANCELLED' },
  };
  return configs[status] || configs.pending;
};

const TaskTypeTag = ({ type }) => {
  const config = getTaskTypeConfig(type);
  return (
    <Tag
      className="font-medium"
      style={{ 
        backgroundColor: `${config.color}15`,
        color: config.color,
        borderColor: `${config.color}40`
      }}
    >
      {config.label}
    </Tag>
  );
};

const PriorityBadge = ({ priority }) => {
  const config = getPriorityConfig(priority);
  return (
    <Tag
      className="font-bold text-xs px-2 py-0.5 rounded"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        letterSpacing: '0.5px'
      }}
    >
      {config.label}
    </Tag>
  );
};

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <Tag
      className="font-medium"
      style={{
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </Tag>
  );
};

const DaysDisplay = ({ dueDate }) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  const config = days < 0
    ? { color: '#dc2626', bg: '#fef2f2', text: `${Math.abs(days)}d overdue` }
    : days === 0
    ? { color: '#d97706', bg: '#fffbeb', text: 'Due today' }
    : days <= 7
    ? { color: '#ea580c', bg: '#fff7ed', text: `${days}d left` }
    : { color: '#6b7280', bg: '#f3f4f6', text: `${days}d left` };
  
  return (
    <Tag
      className="font-semibold"
      style={{
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.text}
    </Tag>
  );
};

const KanbanColumn = ({ title, status, tasks, onUpdateStatus, onDelete }) => {
  const statusConfig = getStatusConfig(status);
  const color = statusConfig.color;
  
  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      <div 
        className="rounded-t-xl px-4 py-3 font-semibold flex items-center justify-between"
        style={{ backgroundColor: `${color}15` }}
      >
        <span style={{ color }}>{title}</span>
        <Badge 
          count={tasks.length} 
          style={{ backgroundColor: color }}
          className="font-bold"
        />
      </div>
      <div 
        className="rounded-b-xl p-3 space-y-3 min-h-[400px]"
        style={{ 
          backgroundColor: '#f8fafc',
          borderLeft: `3px solid ${color}`,
          borderRight: `1px solid #e2e8f0`,
          borderBottom: `1px solid #e2e8f0`
        }}
      >
        {tasks.map((task) => (
          <Card
            key={task._id}
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {}}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <TaskTypeTag type={task.taskType} />
                <PriorityBadge priority={task.priority} />
              </div>
              <p className="font-medium text-sm">{task.title}</p>
              {task.companyId && (
                <Link 
                  to={`/dashboard/cac-compliance/companies/${task.companyId._id}`}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.companyId.name}
                </Link>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <DaysDisplay dueDate={task.dueDate} />
                <Space size="small">
                  <Select
                    value={task.status}
                    onChange={(value) => onUpdateStatus(task._id, value)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    style={{ width: 100 }}
                  >
                    <Option value="pending">Pending</Option>
                    <Option value="in_progress">In Progress</Option>
                    <Option value="filed">Filed</Option>
                    <Option value="cancelled">Cancelled</Option>
                  </Select>
                </Space>
              </div>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
};

const CACTasksPage = () => {
  const dispatch = useDispatch();
  const { tasks, overdueTasks, tasksPagination, isLoading } = useSelector((state) => state.cacTasks);
  const { companies } = useSelector((state) => state.cacCompliance);
  
  const [status, setStatus] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const [priority, setPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taskForm] = Form.useForm();

  const loadData = useCallback(() => {
    const params = { limit: 100 };
    if (status !== 'all') params.status = status;
    if (companyId) params.companyId = companyId;
    if (priority !== 'all') params.priority = priority;
    
    dispatch(fetchTasks(params));
    dispatch(fetchOverdueTasks());
  }, [dispatch, status, companyId, priority]);

  useEffect(() => {
    dispatch(fetchCompanies({ limit: 100 }));
    loadData();
  }, [loadData, dispatch]);

  const filteredTasks = useMemo(() => {
    if (!search) return tasks;
    return tasks.filter(t => 
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.companyId?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [tasks, search]);

  const kanbanTasks = useMemo(() => {
    return {
      pending: filteredTasks.filter(t => t.status === 'pending'),
      in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
      filed: filteredTasks.filter(t => t.status === 'filed'),
      cancelled: filteredTasks.filter(t => t.status === 'cancelled'),
    };
  }, [filteredTasks]);

  const stats = useMemo(() => {
    const overdue = overdueTasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const filed = tasks.filter(t => t.status === 'filed').length;
    return { overdue, pending, inProgress, filed, total: tasks.length };
  }, [tasks, overdueTasks]);

  const handleCreateTask = async (values) => {
    setSubmitting(true);
    try {
      await dispatch(createTask(values)).unwrap();
      message.success({ content: 'Filing task created', duration: 3 });
      setIsModalOpen(false);
      taskForm.resetFields();
      loadData();
    } catch (error) {
      message.error({ content: error || 'Failed to create task', duration: 4 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await dispatch(updateTask({ id: taskId, data: { status: newStatus } })).unwrap();
      message.success({ content: 'Task updated', duration: 3 });
      loadData();
    } catch (error) {
      message.error({ content: error || 'Failed to update task', duration: 4 });
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await dispatch(deleteTask(taskId)).unwrap();
      message.success({ content: 'Task cancelled', duration: 3 });
      loadData();
    } catch (error) {
      message.error({ content: error || 'Failed to delete task', duration: 4 });
    }
  };

  const columns = [
    {
      title: 'Company',
      key: 'company',
      width: 200,
      fixed: 'left',
      render: (_, record) => record.companyId ? (
        <Link
          to={`/dashboard/cac-compliance/companies/${record.companyId._id}`}
          className="font-medium hover:text-blue-600 transition-colors"
        >
          {record.companyId.name}
        </Link>
      ) : '-',
      sorter: (a, b) => a.companyId?.name?.localeCompare(b.companyId?.name || '') || 0,
    },
    {
      title: 'Task Type',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 180,
      render: (type) => <TaskTypeTag type={type} />,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title) => <Text className="font-medium">{title}</Text>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => <PriorityBadge priority={priority} />,
      sorter: (a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] || 3) - (order[b.priority] || 3);
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 140,
      render: (date) => (
        <div className="flex flex-col">
          <Text className="text-sm">
            {new Date(date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
          <DaysDisplay dueDate={date} />
        </div>
      ),
      sorter: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    },
    {
      title: 'Penalty',
      dataIndex: 'applicablePenalty',
      key: 'applicablePenalty',
      width: 120,
      align: 'right',
      render: (penalty) => penalty > 0 ? (
        <Text 
          strong 
          style={{ 
            fontFamily: "'IBM Plex Mono', monospace",
            color: '#dc2626'
          }}
        >
          {formatCurrency(penalty)}
        </Text>
      ) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => <StatusBadge status={status} />,
      sorter: (a, b) => a.status?.localeCompare(b.status || ''),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Select
            value={record.status}
            onChange={(value) => handleUpdateTaskStatus(record._id, value)}
            size="small"
            style={{ width: 110 }}
          >
            <Option value="pending">Pending</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="filed">Filed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Popconfirm
            title="Cancel this task?"
            onConfirm={() => handleDeleteTask(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined className="w-4 h-4" />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
              <CheckCircleOutlined className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Filing Tasks</h1>
              <p className="text-sm text-gray-500">Manage CAC filing tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Space>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<UnorderedListOutlined className="w-4 h-4" />}
                onClick={() => setViewMode('list')}
              />
              <Button
                type={viewMode === 'kanban' ? 'primary' : 'default'}
                icon={<AppstoreOutlined className="w-4 h-4" />}
                onClick={() => setViewMode('kanban')}
              />
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined className="w-4 h-4" />}
              size="large"
              onClick={() => setIsModalOpen(true)}
              className="shadow-lg"
            >
              New Task
            </Button>
          </div>
        </div>

        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Card styles={{ body: { padding: '16px' } }}>
              <Statistic
                title={<span className="text-xs text-gray-500">Total Tasks</span>}
                value={stats.total}
                prefix={<UnorderedListOutlined className="w-4 h-4" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card styles={{ body: { padding: '16px' } }}>
              <Statistic
                title={<span className="text-xs text-gray-500">Overdue</span>}
                value={stats.overdue}
                prefix={<WarningOutlined className="w-4 h-4" />}
                valueStyle={{ color: stats.overdue > 0 ? '#dc2626' : '#16a34a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card styles={{ body: { padding: '16px' } }}>
              <Statistic
                title={<span className="text-xs text-gray-500">Pending</span>}
                value={stats.pending}
                prefix={<ClockCircleOutlined className="w-4 h-4" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card styles={{ body: { padding: '16px' } }}>
              <Statistic
                title={<span className="text-xs text-gray-500">Filed</span>}
                value={stats.filed}
                prefix={<CheckCircleOutlined className="w-4 h-4" />}
                valueStyle={{ color: '#16a34a' }}
              />
            </Card>
          </Col>
        </Row>

        {stats.overdue > 0 && (
          <Card 
            className="border-red-300 bg-red-50"
            styles={{ body: { padding: '16px' } }}
          >
            <div className="flex items-center gap-3 mb-3">
              <WarningOutlined className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-700">
                {stats.overdue} Overdue Task{stats.overdue !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {overdueTasks.slice(0, 5).map((task) => (
                <Tag
                  key={task._id}
                  className="py-1 px-3"
                  color="red"
                  onClose={() => handleDeleteTask(task._id)}
                  closable
                >
                  {task.title} - {task.companyId?.name || 'Unknown'}
                </Tag>
              ))}
              {stats.overdue > 5 && (
                <Tag className="py-1 px-3">+{stats.overdue - 5} more</Tag>
              )}
            </div>
          </Card>
        )}

        <Card styles={{ body: { padding: '16px' } }}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <Space wrap>
              <Input
                placeholder="Search tasks..."
                prefix={<SearchOutlined className="w-4 h-4 text-gray-400" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                value={status}
                onChange={(value) => setStatus(value)}
                style={{ width: 140 }}
                suffixIcon={<FilterOutlined className="w-4 h-4" />}
              >
                <Option value="all">All Status</Option>
                <Option value="pending">Pending</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="filed">Filed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
              <Select
                value={companyId}
                onChange={(value) => setCompanyId(value)}
                style={{ width: 200 }}
                placeholder="Filter by company"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option.children.props.children[1].props.children
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {companies.map((company) => (
                  <Option key={company._id} value={company._id}>
                    {company.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={priority}
                onChange={(value) => setPriority(value)}
                style={{ width: 130 }}
              >
                <Option value="all">All Priority</Option>
                <Option value="urgent">Urgent</Option>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
              {(search || status !== 'all' || companyId || priority !== 'all') && (
                <Button 
                  type="link" 
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                    setCompanyId(null);
                    setPriority('all');
                  }}
                  icon={<CloseOutlined className="w-4 h-4" />}
                >
                  Clear
                </Button>
              )}
            </Space>
            <Text type="secondary">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </Text>
          </div>

          {viewMode === 'kanban' ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                <KanbanColumn
                  title="Pending"
                  status="pending"
                  tasks={kanbanTasks.pending}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
                <KanbanColumn
                  title="In Progress"
                  status="in_progress"
                  tasks={kanbanTasks.in_progress}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
                <KanbanColumn
                  title="Filed"
                  status="filed"
                  tasks={kanbanTasks.filed}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
                <KanbanColumn
                  title="Cancelled"
                  status="cancelled"
                  tasks={kanbanTasks.cancelled}
                  onUpdateStatus={handleUpdateTaskStatus}
                  onDelete={handleDeleteTask}
                />
              </div>
            </div>
          ) : (
            <Spin spinning={isLoading}>
              <Table
                dataSource={filteredTasks}
                columns={columns}
                rowKey="_id"
                scroll={{ x: 1200 }}
                pagination={{
                  current: tasksPagination?.page || 1,
                  pageSize: tasksPagination?.limit || 50,
                  total: tasksPagination?.total || filteredTasks.length,
                  onChange: (page) => dispatch(fetchTasks({ page, status, companyId, priority })),
                  showSizeChanger: false,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                }}
                locale={{ emptyText: <Empty description="No tasks found" /> }}
              />
            </Spin>
          )}
        </Card>

        <Modal
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <PlusOutlined className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Create Filing Task</h3>
                <p className="text-sm text-gray-500 font-normal">Add a new CAC filing task</p>
              </div>
            </div>
          }
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            taskForm.resetFields();
          }}
          footer={null}
          width={560}
          destroyOnClose
        >
          <Form
            form={taskForm}
            layout="vertical"
            onFinish={handleCreateTask}
            requiredMark="optional"
            className="mt-6"
          >
            <Form.Item
              name="companyId"
              label="Company"
              rules={[{ required: true, message: 'Please select a company' }]}
            >
              <Select
                placeholder="Select company"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  option.children.props.children[1].props.children
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {companies.map((company) => (
                  <Option key={company._id} value={company._id}>
                    {company.name} ({company.rcNumber})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="taskType"
                  label="Task Type"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select type" size="large">
                    {taskTypes.map((t) => (
                      <Option key={t.value} value={t.value}>
                        {t.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="Priority"
                  initialValue="medium"
                >
                  <Select placeholder="Select priority" size="large">
                    <Option value="low">Low</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="high">High</Option>
                    <Option value="urgent">Urgent</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Task title" size="large" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description (Optional)"
            >
              <TextArea rows={3} placeholder="Additional details..." />
            </Form.Item>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true, message: 'Please select a due date' }]}
            >
              <Input type="date" size="large" />
            </Form.Item>
            <Form.Item className="mb-0">
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    setIsModalOpen(false);
                    taskForm.resetFields();
                  }}
                  size="large"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  size="large"
                >
                  Create Task
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CACTasksPage;
