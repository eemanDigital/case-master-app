import { useState, useEffect, useCallback, useRef } from "react";
import { Form, Input, Button, Card, Select, Tag, Checkbox, Space, Typography, message, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import { 
  SaveOutlined, BgColorsOutlined, TagsOutlined, 
  PushpinOutlined, StarOutlined, StarFilled, 
  PushpinFilled, QuestionCircleOutlined, LoadingOutlined 
} from "@ant-design/icons";
import { createNote } from "../redux/features/notes/notesSlice";
import createMaxLengthRule from "../utils/createMaxLengthRule";
import GoBackButton from "../components/GoBackButton";

const { Title, Text } = Typography;

const CATEGORIES = [
  { value: "case-notes", label: "Case Notes", color: "blue", description: "Notes related to specific cases" },
  { value: "legal-research", label: "Legal Research", color: "purple", description: "Research findings and case law" },
  { value: "client-info", label: "Client Info", color: "green", description: "Client-related information" },
  { value: "court-ruling", label: "Court Ruling", color: "red", description: "Court decisions and judgments" },
  { value: "procedure", label: "Procedure", color: "orange", description: "Legal procedures and processes" },
  { value: "general", label: "General", color: "default", description: "General notes" },
];

const COLORS = [
  { value: "#ffffff", label: "White" },
  { value: "#fef3c7", label: "Yellow" },
  { value: "#dcfce7", label: "Green" },
  { value: "#dbeafe", label: "Blue" },
  { value: "#fce7f3", label: "Pink" },
  { value: "#e0e7ff", label: "Indigo" },
  { value: "#fed7aa", label: "Orange" },
  { value: "#f3f4f6", label: "Gray" },
];

const QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ],
};

const NoteForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  
  const autoSaveTimerRef = useRef(null);
  const draftRef = useRef(null);

  const contentValue = Form.useWatch("content", form) || "";
  const titleValue = Form.useWatch("title", form) || "";

  useEffect(() => {
    if (contentValue || titleValue) {
      setHasUnsavedChanges(true);
    }
  }, [contentValue, titleValue]);

  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges && (titleValue || contentValue)) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, titleValue, contentValue, hasUnsavedChanges]);

  useEffect(() => {
    const savedDraft = localStorage.getItem("note_draft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        form.setFieldsValue({
          title: draft.title,
          content: draft.content,
        });
        setSelectedCategory(draft.category || "general");
        setSelectedColor(draft.color || "#ffffff");
        setIsPinned(draft.isPinned || false);
        setIsFavorite(draft.isFavorite || false);
        setTags(draft.tags || []);
        message.info("Draft restored from previous session");
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, [form]);

  const saveDraft = useCallback(() => {
    const draft = {
      title: form.getFieldValue("title"),
      content: form.getFieldValue("content"),
      category: selectedCategory,
      color: selectedColor,
      isPinned,
      isFavorite,
      tags,
      timestamp: Date.now(),
    };
    localStorage.setItem("note_draft", JSON.stringify(draft));
    draftRef.current = draft;
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  }, [form, selectedCategory, selectedColor, isPinned, isFavorite, tags]);

  const handleAutoSave = useCallback(() => {
    saveDraft();
    message.success("Draft auto-saved");
  }, [saveDraft]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem("note_draft");
    draftRef.current = null;
  }, []);

  const handleTagInput = (value) => {
    setTagInput(value);
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag) && tags.length < 10) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      await dispatch(createNote({
        title: values.title,
        content: values.content,
        category: selectedCategory,
        color: selectedColor,
        isPinned,
        isFavorite,
        tags,
      })).unwrap();
      
      clearDraft();
      message.success("Note created successfully!");
      navigate("/dashboard/notes");
    } catch (error) {
      message.error(error || "Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await form.validateFields();
      saveDraft();
      message.success("Draft saved! You can continue editing.");
    } catch (error) {
      message.error("Please fill in required fields first");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <GoBackButton />
      
      <Card className="mt-4 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <Title level={3} className="mb-0">Create Note</Title>
          <Space>
            {hasUnsavedChanges && (
              <Text type="secondary" className="text-sm">
                <LoadingOutlined className="mr-1" />
                Unsaved changes
              </Text>
            )}
            {lastSaved && (
              <Text type="secondary" className="text-xs">
                Last saved: {lastSaved.toLocaleTimeString()}
              </Text>
            )}
          </Space>
        </div>

        <Form
          form={form}
          layout="vertical"
          name="create_note_form"
          onFinish={onFinish}
          initialValues={{ title: "", content: "" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-3">
              <Form.Item
                label="Note Title"
                name="title"
                rules={[
                  { required: true, message: "Please provide a title for the note!" },
                  createMaxLengthRule(100, "Title should not exceed 100 characters"),
                ]}
              >
                <Input 
                  placeholder="Enter note title" 
                  size="large"
                  showCount
                  maxLength={100}
                />
              </Form.Item>
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Actions</label>
              <Space>
                <Tooltip title={isPinned ? "Unpin" : "Pin note"}>
                  <Button
                    type={isPinned ? "primary" : "default"}
                    icon={isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                    onClick={() => setIsPinned(!isPinned)}
                    shape="circle"
                  />
                </Tooltip>
                <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                  <Button
                    type={isFavorite ? "primary" : "default"}
                    icon={isFavorite ? <StarFilled /> : <StarOutlined />}
                    onClick={() => setIsFavorite(!isFavorite)}
                    shape="circle"
                  />
                </Tooltip>
                <Tooltip title="Auto-save draft">
                  <Button
                    type={autoSaveEnabled ? "primary" : "default"}
                    icon={<SaveOutlined />}
                    onClick={() => {
                      setAutoSaveEnabled(!autoSaveEnabled);
                      message.info(autoSaveEnabled ? "Auto-save disabled" : "Auto-save enabled");
                    }}
                    shape="circle"
                  />
                </Tooltip>
              </Space>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Form.Item
              label="Category"
              className="mb-0"
            >
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={CATEGORIES.map(c => ({
                  value: c.value,
                  label: (
                    <Space>
                      <Tag color={c.color}>{c.label}</Tag>
                    </Space>
                  ),
                }))}
                placeholder="Select category"
              />
            </Form.Item>

            <Form.Item
              label={<Space>Color <QuestionCircleOutlined title="Card background color" /></Space>}
              className="mb-0"
            >
              <Select
                value={selectedColor}
                onChange={setSelectedColor}
                className="w-full"
              >
                {COLORS.map(color => (
                  <Select.Option key={color.value} value={color.value}>
                    <Space>
                      <span 
                        style={{ 
                          display: 'inline-block', 
                          width: 16, 
                          height: 16, 
                          backgroundColor: color.value,
                          border: '1px solid #d9d9d9',
                          borderRadius: 2
                        }} 
                      />
                      {color.label}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<Space>Tags <QuestionCircleOutlined title="Add up to 10 tags" /></Space>}
              className="mb-0"
            >
              <Select
                mode="tags"
                value={tags}
                onChange={setTags}
                placeholder="Add tags..."
                tokenSeparators={[',']}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="content"
            label="Content"
            rules={[
              { required: true, message: "Please provide content for the note!" },
            ]}
          >
            <ReactQuill
              theme="snow"
              modules={QUILL_MODULES}
              placeholder="Enter note content..."
              style={{ height: "300px" }}
            />
          </Form.Item>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              onClick={handleSaveAndContinue}
              icon={<SaveOutlined />}
            >
              Save Draft
            </Button>
            
            <Space>
              <Button onClick={() => navigate("/dashboard/notes")}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isSubmitting}
                icon={<SaveOutlined />}
              >
                Save Note
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default NoteForm;
