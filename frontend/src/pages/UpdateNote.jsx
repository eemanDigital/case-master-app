import { useState, useEffect, useCallback, useRef } from "react";
import { Form, Input, Button, Card, Select, Space, Typography, message, Tooltip, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import { 
  SaveOutlined, BgColorsOutlined, 
  PushpinOutlined, StarOutlined, StarFilled, 
  PushpinFilled, QuestionCircleOutlined, LoadingOutlined,
  ArrowLeftOutlined 
} from "@ant-design/icons";
import { fetchNote, updateNote } from "../redux/features/notes/notesSlice";
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

const UpdateNote = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [tags, setTags] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  
  const { currentNote } = useSelector((state) => state.notes);
  const autoSaveTimerRef = useRef(null);

  const contentValue = Form.useWatch("content", form) || "";
  const titleValue = Form.useWatch("title", form) || "";

  useEffect(() => {
    const loadNote = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchNote(id)).unwrap();
      } catch (error) {
        message.error("Failed to load note");
        navigate("/dashboard/notes");
      } finally {
        setIsLoading(false);
      }
    };
    loadNote();
  }, [dispatch, id, navigate]);

  useEffect(() => {
    if (currentNote) {
      form.setFieldsValue({
        title: currentNote.title,
        content: currentNote.content,
      });
      setIsPinned(currentNote.isPinned || false);
      setIsFavorite(currentNote.isFavorite || false);
      setSelectedColor(currentNote.color || "#ffffff");
      setSelectedCategory(currentNote.category || "general");
      setTags(currentNote.tags || []);
    }
  }, [currentNote, form]);

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

  const handleAutoSave = useCallback(async () => {
    try {
      const values = form.getFieldsValue(["title", "content"]);
      if (values.title && values.content) {
        await dispatch(updateNote({
          id,
          noteData: {
            ...values,
            category: selectedCategory,
            color: selectedColor,
            isPinned,
            isFavorite,
            tags,
          }
        })).unwrap();
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        message.success("Draft auto-saved");
      }
    } catch (error) {
      console.error("Auto-save failed", error);
    }
  }, [dispatch, id, form, selectedCategory, selectedColor, isPinned, isFavorite, tags]);

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      await dispatch(updateNote({
        id,
        noteData: {
          title: values.title,
          content: values.content,
          category: selectedCategory,
          color: selectedColor,
          isPinned,
          isFavorite,
          tags,
        }
      })).unwrap();
      
      message.success("Note updated successfully!");
      navigate("/dashboard/notes");
    } catch (error) {
      message.error(error || "Failed to update note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(["title", "content"]);
      await dispatch(updateNote({
        id,
        noteData: {
          ...values,
          category: selectedCategory,
          color: selectedColor,
          isPinned,
          isFavorite,
          tags,
        }
      })).unwrap();
      message.success("Changes saved!");
      setHasUnsavedChanges(false);
    } catch (error) {
      message.error("Please fill in required fields first");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <GoBackButton />
      
      <Card className="mt-4 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <Title level={3} className="mb-0">Update Note</Title>
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
          name="update_note_form"
          onFinish={onFinish}
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
                <Tooltip title="Auto-save changes">
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
                      <span style={{ 
                        display: 'inline-block', 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%',
                        backgroundColor: c.color === 'default' ? '#d9d9d9' : c.color 
                      }} />
                      {c.label}
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

          {currentNote && (
            <div className="text-xs text-gray-500 mb-4">
              Created: {new Date(currentNote.createdAt).toLocaleString()} | 
              Last updated: {new Date(currentNote.updatedAt).toLocaleString()}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              onClick={handleSaveAndContinue}
              icon={<SaveOutlined />}
            >
              Save Changes
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
                Update Note
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default UpdateNote;
