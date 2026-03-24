import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Spin,
  Popconfirm,
  Tooltip,
  Dropdown,
  Avatar,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  BankOutlined,
  FilterOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  CloseOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  fetchCompanies,
  createCompany,
  deleteCompany,
  clearCurrentCompany,
} from '../../redux/features/cacCompliance';

const { Option } = Select;
const { Text } = Typography;

const formatCurrency = (amount) => {
  return '₦' + (amount || 0).toLocaleString('en-NG');
};

const companyTypes = [
  { value: 'small_private', label: 'Small Private Company', color: '#8b5cf6', category: 'company' },
  { value: 'private', label: 'Private Company', color: '#3b82f6', category: 'company' },
  { value: 'public', label: 'Public Company', color: '#ef4444', category: 'company' },
  { value: 'company_limited_by_guarantee', label: 'Company Limited by Guarantee', color: '#22c55e', category: 'company' },
  { value: 'single_member', label: 'Single Member Company', color: '#f59e0b', category: 'company' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)', color: '#6366f1', category: 'llp' },
  { value: 'lp', label: 'Limited Partnership (LP)', color: '#8b5cf6', category: 'lp' },
  { value: 'business_name', label: 'Business Name', color: '#10b981', category: 'business' },
  { value: 'incorporated_trustees', label: 'Incorporated Trustees', color: '#ec4899', category: 'trustees' },
];

const getCompanyTypeConfig = (type) => {
  return companyTypes.find(t => t.value === type) || { label: type, color: '#6b7280' };
};

const RiskTag = ({ level }) => {
  const configs = {
    red: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'RED' },
    amber: { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'AMBER' },
    green: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', label: 'GREEN' },
  };
  const c = configs[level] || configs.green;
  
  return (
    <Tag
      className="font-bold text-xs px-2 py-0.5 rounded"
      style={{ 
        backgroundColor: c.bg, 
        color: c.text, 
        border: `1px solid ${c.border}`,
        letterSpacing: '0.5px'
      }}
    >
      {c.label}
    </Tag>
  );
};

const CompanyTypeTag = ({ type }) => {
  const config = getCompanyTypeConfig(type);
  return (
    <Tag 
      className="text-xs"
      style={{ borderColor: config.color, color: config.color }}
    >
      {config.label}
    </Tag>
  );
};

const LiablityDisplay = ({ amount }) => {
  const isOverdue = amount > 0;
  return (
    <Text
      strong
      style={{ 
        fontFamily: "'IBM Plex Mono', monospace",
        color: isOverdue ? '#dc2626' : '#16a34a',
        fontSize: '13px'
      }}
    >
      {formatCurrency(amount)}
    </Text>
  );
};

const CACCompaniesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { companies, companiesPagination, isLoading } = useSelector((state) => state.cacCompliance);
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [risk, setRisk] = useState(searchParams.get('risk') || 'all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState(null);
  const [form] = Form.useForm();

  // Entity types that require share capital field
  const requiresShareCapital = (type) => {
    return ['small_private', 'private', 'public', 'company_limited_by_guarantee', 'single_member'].includes(type);
  };

  // Entity types that require PSC filing
  const requiresPSC = (type) => {
    return ['small_private', 'private', 'public', 'company_limited_by_guarantee', 'single_member', 'llp'].includes(type);
  };

  const loadCompanies = useCallback(() => {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (risk !== 'all') {
      const riskLevels = risk.split(',');
      if (riskLevels.length === 1) {
        params.risk = risk;
      }
    }
    dispatch(fetchCompanies(params));
  }, [dispatch, page, search, risk]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentCompany());
    };
  }, [dispatch]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleRiskChange = (value) => {
    setRisk(value);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (value !== 'all') {
      params.set('risk', value);
    } else {
      params.delete('risk');
    }
    setSearchParams(params);
  };

  const handleCreateCompany = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        incorporationDate: new Date(values.incorporationDate),
      };
      await dispatch(createCompany(payload)).unwrap();
      message.success({ content: 'Company created successfully', duration: 3 });
      setIsModalOpen(false);
      form.resetFields();
      loadCompanies();
    } catch (error) {
      message.error({ content: error || 'Failed to create company', duration: 4 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async (id) => {
    try {
      await dispatch(deleteCompany(id)).unwrap();
      message.success({ content: 'Company deactivated', duration: 3 });
      loadCompanies();
    } catch (error) {
      message.error({ content: error || 'Failed to delete company', duration: 4 });
    }
  };

  const actionItems = (record) => [
    {
      key: 'view',
      label: (
        <Space>
          <EyeOutlined className="w-4 h-4" />
          View Details
        </Space>
      ),
      onClick: () => navigate(`/dashboard/cac-compliance/companies/${record._id}`),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: (
        <Space className="text-red-500">
          <DeleteOutlined className="w-4 h-4" />
          Deactivate
        </Space>
      ),
      onClick: () => handleDeleteCompany(record._id),
    },
  ];

  const columns = [
    {
      title: 'Company',
      key: 'company',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            className="font-semibold"
            style={{ 
              backgroundColor: record.complianceRiskLevel === 'red' ? '#fef2f2' : 
                             record.complianceRiskLevel === 'amber' ? '#fffbeb' : '#f0fdf4',
              color: record.complianceRiskLevel === 'red' ? '#dc2626' : 
                     record.complianceRiskLevel === 'amber' ? '#d97706' : '#16a34a',
              border: `2px solid ${record.complianceRiskLevel === 'red' ? '#fecaca' : 
                                   record.complianceRiskLevel === 'amber' ? '#fde68a' : '#bbf7d0'}`
            }}
          >
            {record.name?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>
          <div>
            <Link
              to={`/dashboard/cac-compliance/companies/${record._id}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {record.name}
            </Link>
            <p className="text-xs text-gray-500">{record.rcNumber}</p>
          </div>
        </div>
      ),
      sorter: (a, b) => a.name?.localeCompare(b.name),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type) => <CompanyTypeTag type={type} />,
      filters: companyTypes.map(t => ({ text: t.label, value: t.value })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Risk',
      dataIndex: 'complianceRiskLevel',
      key: 'complianceRiskLevel',
      width: 100,
      render: (level) => <RiskTag level={level} />,
      sorter: (a, b) => {
        const order = { red: 0, amber: 1, green: 2 };
        return (order[a.complianceRiskLevel] || 3) - (order[b.complianceRiskLevel] || 3);
      },
    },
    {
      title: 'Incorporated',
      dataIndex: 'incorporationDate',
      key: 'incorporationDate',
      width: 120,
      render: (date) => (
        <Text className="text-sm">
          {date ? new Date(date).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric'
          }) : '-'}
        </Text>
      ),
      sorter: (a, b) => new Date(a.incorporationDate) - new Date(b.incorporationDate),
    },
    {
      title: 'Liability',
      dataIndex: 'totalEstimatedLiability',
      key: 'totalEstimatedLiability',
      width: 140,
      align: 'right',
      render: (amount) => <LiablityDisplay amount={amount} />,
      sorter: (a, b) => a.totalEstimatedLiability - b.totalEstimatedLiability,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 160,
      render: (assigned) => assigned ? (
        <div className="flex items-center gap-2">
          <Avatar size={24} className="bg-blue-500">
            {assigned.firstName?.charAt(0) || 'U'}
          </Avatar>
          <Text className="text-sm">
            {assigned.firstName} {assigned.lastName?.charAt(0) || ''}.
          </Text>
        </div>
      ) : (
        <Text type="secondary" className="text-sm">Unassigned</Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown 
          menu={{ items: actionItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button 
            type="text" 
            icon={<MoreOutlined className="w-4 h-4" />} 
            className="hover:bg-gray-100"
          />
        </Dropdown>
      ),
    },
  ];

  const stats = useMemo(() => {
    const total = companiesPagination?.total || 0;
    const red = companies.filter(c => c.complianceRiskLevel === 'red').length;
    const amber = companies.filter(c => c.complianceRiskLevel === 'amber').length;
    const green = companies.filter(c => c.complianceRiskLevel === 'green').length;
    return { total, red, amber, green };
  }, [companies, companiesPagination]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <BankOutlined className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Client Companies</h1>
              <p className="text-sm text-gray-500">
                Manage {stats.total} client companies
              </p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined className="w-4 h-4" />}
            size="large"
            onClick={() => setIsModalOpen(true)}
            className="shadow-lg"
          >
            Add Company
          </Button>
        </div>

        <Row gutter={16} className="mb-4">
          <Col span={24}>
            <Card styles={{ body: { padding: '16px 20px' } }}>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Search by name or RC number..."
                    prefix={<SearchOutlined className="w-4 h-4 text-gray-400" />}
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    onPressEnter={(e) => handleSearch(e.target.value)}
                    style={{ width: 280 }}
                    allowClear
                    className="shadow-sm"
                  />
                  <Select
                    value={risk}
                    onChange={handleRiskChange}
                    style={{ width: 160 }}
                    className="shadow-sm"
                    suffixIcon={<FilterOutlined className="w-4 h-4" />}
                  >
                    <Option value="all">All Risk Levels</Option>
                    <Option value="red">
                      <Space>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Red ({stats.red})
                      </Space>
                    </Option>
                    <Option value="amber">
                      <Space>
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Amber ({stats.amber})
                      </Space>
                    </Option>
                    <Option value="green">
                      <Space>
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Green ({stats.green})
                      </Space>
                    </Option>
                  </Select>
                  {(search || risk !== 'all') && (
                    <Button 
                      type="link" 
                      onClick={() => {
                        setSearch('');
                        setRisk('all');
                        setSearchParams({});
                      }}
                      icon={<CloseOutlined className="w-4 h-4" />}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Tag color="red">{stats.red} Red</Tag>
                  <Tag color="orange">{stats.amber} Amber</Tag>
                  <Tag color="green">{stats.green} Green</Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Spin spinning={isLoading} tip="Loading companies...">
            <Table
              dataSource={companies}
              columns={columns}
              rowKey="_id"
              scroll={{ x: 1000 }}
              pagination={{
                current: page,
                pageSize: companiesPagination?.limit || 20,
                total: companiesPagination?.total || 0,
                onChange: setPage,
                showSizeChanger: false,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} companies`,
              }}
              onRow={(record) => ({
                className: 'hover:bg-slate-50 cursor-pointer transition-colors',
                onClick: () => navigate(`/dashboard/cac-compliance/companies/${record._id}`),
              })}
            />
          </Spin>
        </Card>

        <Modal
          title={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <PlusOutlined className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Add New Client Company</h3>
                <p className="text-sm text-gray-500 font-normal">Enter company details for compliance monitoring</p>
              </div>
            </div>
          }
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
          }}
          footer={null}
          width={640}
          className="rounded-xl"
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateCompany}
            requiredMark="optional"
            className="mt-6"
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Company Name"
                  rules={[{ required: true, message: 'Please enter company name' }]}
                >
                  <Input 
                    placeholder="Enter company name" 
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="rcNumber"
                  label="RC Number"
                  rules={[{ required: true, message: 'Please enter RC number' }]}
                >
                  <Input 
                    placeholder="e.g., RC 123456" 
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="Entity Type"
                  rules={[{ required: true, message: 'Please select entity type' }]}
                >
                  <Select 
                    placeholder="Select type"
                    size="large"
                    className="rounded-lg"
                    onChange={(value) => {
                      setSelectedEntityType(value);
                      // Set default share capital based on entity type
                      if (requiresShareCapital(value)) {
                        form.setFieldsValue({ shareCapital: 100000 });
                      } else {
                        form.setFieldsValue({ shareCapital: undefined });
                      }
                    }}
                  >
                    {companyTypes.map((type) => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="incorporationDate"
                  label="Date of Incorporation"
                  rules={[{ required: true, message: 'Please select incorporation date' }]}
                >
                  <Input 
                    type="date" 
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="numDirectors"
                  label={requiresShareCapital(selectedEntityType) ? 'Number of Directors' : 'Number of Partners/Proprietors'}
                  rules={[{ required: true, message: 'Please enter number' }]}
                  initialValue={1}
                >
                  <Input 
                    type="number" 
                    min={1} 
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              {requiresShareCapital(selectedEntityType) && (
                <Col span={12}>
                  <Form.Item
                    name="shareCapital"
                    label="Share Capital (₦)"
                    tooltip="Used to calculate filing fee bracket"
                    initialValue={100000}
                  >
                    <Input 
                      type="number" 
                      min={0}
                      size="large"
                      className="rounded-lg"
                      placeholder="e.g., 1000000"
                    />
                  </Form.Item>
                </Col>
              )}
              {requiresPSC(selectedEntityType) && (
                <Col span={12}>
                  <Form.Item
                    name="pscFiled"
                    label="PSC Filed"
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <Select size="large">
                      <Option value={true}>Yes</Option>
                      <Option value={false}>No</Option>
                    </Select>
                  </Form.Item>
                </Col>
              )}
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="firstAnnualReturnFiled"
                  label="First Annual Return Filed"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Select size="large">
                    <Option value={true}>Yes</Option>
                    <Option value={false}>No</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="notes"
              label="Notes (Optional)"
            >
              <Input.TextArea 
                rows={3} 
                placeholder="Any additional notes..." 
                className="rounded-lg"
              />
            </Form.Item>
            <Form.Item className="mb-0">
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    setIsModalOpen(false);
                    form.resetFields();
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
                  className="px-8"
                >
                  Create Company
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default CACCompaniesList;
