import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Input,
  Select,
  Radio,
  Button,
  Tag,
  Empty,
  Pagination,
  Spin,
  Row,
  Col,
  Space,
  Typography,
  Badge,
  Tooltip,
  Alert,
  Steps,
} from "antd";
import {
  FileProtectOutlined,
  AuditOutlined,
  MailOutlined,
  BankOutlined,
  HomeOutlined,
  EditOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  FileAddOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import TemplatePreviewModal from "../../components/templates/TemplatePreviewModal";
import GenerateDocumentModal from "../../components/templates/GenerateDocumentModal";
import CreateTemplateModal from "../../components/templates/CreateTemplateModal";
import {
  getAllTemplates,
  selectTemplates,
  selectTemplateLoading,
  selectTemplatePagination,
  resetTemplateState,
  duplicateTemplate,
} from "../../redux/features/templates/templateSlice";
import { selectUser } from "../../redux/features/auth/authSlice";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const categoryIcons = {
  contract: <FileProtectOutlined />,
  "court-process": <AuditOutlined />,
  correspondence: <MailOutlined />,
  corporate: <BankOutlined />,
  conveyancing: <HomeOutlined />,
  custom: <EditOutlined />,
};

const categoryColors = {
  contract: "blue",
  "court-process": "red",
  correspondence: "cyan",
  corporate: "purple",
  conveyancing: "orange",
  custom: "green",
};

const categoryLabels = {
  contract: "Contract",
  "court-process": "Court Process",
  correspondence: "Correspondence",
  corporate: "Corporate",
  conveyancing: "Conveyancing",
  custom: "Custom",
};

const practiceAreaOptions = [
  { value: "corporate-commercial", label: "Corporate/Commercial" },
  { value: "litigation", label: "Litigation" },
  { value: "property-conveyancing", label: "Property/Conveyancing" },
  { value: "employment-labour", label: "Employment/Labour" },
  { value: "family", label: "Family" },
  { value: "intellectual-property", label: "Intellectual Property" },
  { value: "banking-finance", label: "Banking/Finance" },
  { value: "oil-gas", label: "Oil & Gas" },
  { value: "tax", label: "Tax" },
  { value: "criminal", label: "Criminal" },
  { value: "general", label: "General" },
];

const TemplateLibrary = () => {
  const dispatch = useDispatch();
  const templates = useSelector(selectTemplates);
  const loading = useSelector(selectTemplateLoading);
  const pagination = useSelector(selectTemplatePagination);
  const user = useSelector(selectUser);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [practiceAreas, setPracticeAreas] = useState([]);
  const [source, setSource] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [previewModal, setPreviewModal] = useState({
    visible: false,
    template: null,
  });
  const [generateModal, setGenerateModal] = useState({
    visible: false,
    template: null,
  });
  const [createModal, setCreateModal] = useState(false);

  const canCreateTemplate =
    user?.data?.role === "admin" ||
    user?.data?.role === "super-admin" ||
    user?.data?.role === "lawyer" ||
    user?.data?.userType === "admin" ||
    user?.data?.userType === "super-admin" ||
    user?.data?.userType === "lawyer" ||
    user?.data?.additionalRoles?.includes("admin") ||
    user?.data?.additionalRoles?.includes("super-admin") ||
    user?.data?.additionalRoles?.includes("lawyer") ||
    user?.data?.isLawyer === true;

  useEffect(() => {
    fetchTemplates();
    return () => {
      dispatch(resetTemplateState());
    };
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [search, category, practiceAreas, source, pagination.current]);

  const fetchTemplates = () => {
    const params = {
      page: pagination.current,
      limit: pagination.limit,
      search: search || undefined,
      category: category !== "all" ? category : undefined,
      practiceArea: practiceAreas.length > 0 ? practiceAreas : undefined,
      isSystemTemplate: source === "all" ? undefined : source === "system",
    };
    dispatch(getAllTemplates(params));
  };

  const handleSearch = (value) => {
    setSearch(value);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
  };

  const handlePracticeAreaChange = (value) => {
    setPracticeAreas(value);
  };

  const handleSourceChange = (e) => {
    setSource(e.target.value);
  };

  const handlePageChange = (page) => {
    dispatch(getAllTemplates({ ...getFilterParams(), page }));
  };

  const getFilterParams = () => ({
    page: pagination.current,
    limit: pagination.limit,
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    practiceArea: practiceAreas.length > 0 ? practiceAreas : undefined,
    isSystemTemplate: source === "all" ? undefined : source === "system",
  });

  const handlePreview = (template) => {
    setPreviewModal({ visible: true, template });
  };

  const handleUseTemplate = (template) => {
    setGenerateModal({ visible: true, template });
  };

  const handleDuplicate = async (templateId) => {
    await dispatch(duplicateTemplate(templateId));
    fetchTemplates();
  };

  console.log("Templates:", templates);

  const renderTemplateCard = (template) => (
    <Card
      key={template._id}
      hoverable
      className="template-card"
      style={{ height: "100%" }}
      actions={[
        <Tooltip title="Preview" key="preview">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(template)}
          />
        </Tooltip>,
        <Tooltip title="Use Template" key="use">
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            onClick={() => handleUseTemplate(template)}
            size="small">
            Use
          </Button>
        </Tooltip>,
      ]}>
      <Card.Meta
        avatar={
          <Badge
            count={categoryIcons[template.category]}
            style={{ backgroundColor: categoryColors[template.category] }}
          />
        }
        title={
          <Space>
            <Text strong>{template.title}</Text>
            {template.isSystemTemplate ? (
              <Tag color="blue">System</Tag>
            ) : (
              <Tag color="green">Firm</Tag>
            )}
          </Space>
        }
        description={
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ marginBottom: 8, fontSize: 13 }}>
            {template.description || "No description available"}
          </Paragraph>
        }
      />
      <Space
        direction="vertical"
        size={4}
        style={{ width: "100%", marginTop: 12 }}>
        <Tag color={categoryColors[template.category]}>
          {categoryLabels[template.category]}
        </Tag>
        {template.practiceArea && (
          <Tag>
            {practiceAreaOptions.find((p) => p.value === template.practiceArea)
              ?.label || template.practiceArea}
          </Tag>
        )}
        <Text type="secondary" style={{ fontSize: 12 }}>
          {template.placeholders?.length || 0} placeholders • Used{" "}
          {template.usageCount || 0} times
        </Text>
      </Space>
    </Card>
  );

  const renderTemplateListItem = (template) => (
    <Card
      key={template._id}
      hoverable
      style={{ marginBottom: 12 }}
      size="small">
      <Row gutter={16} align="middle">
        <Col flex="80px">
          <Badge
            count={categoryIcons[template.category]}
            style={{ backgroundColor: categoryColors[template.category] }}
          />
        </Col>
        <Col flex="auto">
          <Space>
            <Text strong>{template.title}</Text>
            <Tag color={categoryColors[template.category]}>
              {categoryLabels[template.category]}
            </Tag>
            {template.isSystemTemplate ? (
              <Tag color="blue">System</Tag>
            ) : (
              <Tag color="green">Firm</Tag>
            )}
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {template.placeholders?.length || 0} placeholders • Used{" "}
            {template.usageCount || 0} times
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => handlePreview(template)}>
              Preview
            </Button>
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={() => handleUseTemplate(template)}>
              Use
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="template-library-page" style={{ padding: 24 }}>
      <Row gutter={24}>
        <Col xs={24} lg={6}>
          <Card
            title="Filters"
            size="small"
            style={{ position: "sticky", top: 20 }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Search
                placeholder="Search templates..."
                allowClear
                onSearch={handleSearch}
                prefix={<SearchOutlined />}
              />

              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  <FilterOutlined /> Category
                </Text>
                <Radio.Group
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{ width: "100%" }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Radio value="all">All Categories</Radio>
                    <Radio value="contract">Contracts</Radio>
                    <Radio value="court-process">Court Processes</Radio>
                    <Radio value="correspondence">Correspondence</Radio>
                    <Radio value="corporate">Corporate</Radio>
                    <Radio value="conveyancing">Conveyancing</Radio>
                    <Radio value="custom">Custom</Radio>
                  </Space>
                </Radio.Group>
              </div>

              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Practice Area
                </Text>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Select practice areas"
                  value={practiceAreas}
                  onChange={handlePracticeAreaChange}
                  options={practiceAreaOptions}
                  allowClear
                />
              </div>

              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Source
                </Text>
                <Radio.Group
                  value={source}
                  onChange={handleSourceChange}
                  style={{ width: "100%" }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Radio value="all">All Templates</Radio>
                    <Radio value="system">System Templates</Radio>
                    <Radio value="firm">My Firm's Templates</Radio>
                  </Space>
                </Radio.Group>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card
            title={
              <Space>
                <Title level={4} style={{ margin: 0 }}>
                  Legal Templates Library
                </Title>
                <Tag color="geekblue">{pagination.totalRecords} templates</Tag>
              </Space>
            }
            extra={
              <Space>
                <Radio.Group
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  size="small">
                  <Radio.Button value="grid">
                    <AppstoreOutlined />
                  </Radio.Button>
                  <Radio.Button value="list">
                    <UnorderedListOutlined />
                  </Radio.Button>
                </Radio.Group>
                {canCreateTemplate && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setCreateModal(true)}>
                    Create Template
                  </Button>
                )}
              </Space>
            }>
            {loading ? (
              <div style={{ textAlign: "center", padding: 48 }}>
                <Spin size="large" />
              </div>
            ) : templates?.length === 0 ? (
              <Empty description="No templates found" />
            ) : (
              <>
                {viewMode === "grid" ? (
                  <Row gutter={[16, 16]}>
                    {templates?.map((template) => (
                      <Col xs={24} sm={12} md={8} key={template._id}>
                        {renderTemplateCard(template)}
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {templates?.map((template) =>
                      renderTemplateListItem(template),
                    )}
                  </Space>
                )}

                <div style={{ marginTop: 24, textAlign: "right" }}>
                  <Pagination
                    current={pagination.current}
                    total={pagination.totalRecords}
                    pageSize={pagination.limit}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                  />
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      <TemplatePreviewModal
        visible={previewModal.visible}
        template={previewModal.template}
        onClose={() => setPreviewModal({ visible: false, template: null })}
        onUse={() => {
          setPreviewModal({ visible: false, template: null });
          setGenerateModal({ visible: true, template: previewModal.template });
        }}
      />

      <GenerateDocumentModal
        visible={generateModal.visible}
        template={generateModal.template}
        onClose={() => setGenerateModal({ visible: false, template: null })}
      />

      <CreateTemplateModal
        visible={createModal}
        onClose={() => setCreateModal(false)}
        onSuccess={fetchTemplates}
      />
    </div>
  );
};

export default TemplateLibrary;
