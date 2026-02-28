import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, Typography, Tag, Space, Button, Spin, Divider, Empty } from "antd";
import { 
  EditOutlined, ArrowLeftOutlined, PushpinFilled, 
  StarFilled, CalendarOutlined 
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchNote, togglePin, toggleFavorite, deleteNote } from "../redux/features/notes/notesSlice";
import GoBackButton from "../components/GoBackButton";

const { Title, Text, Paragraph } = Typography;

const CATEGORIES = {
  "case-notes": { label: "Case Notes", color: "blue" },
  "legal-research": { label: "Legal Research", color: "purple" },
  "client-info": { label: "Client Info", color: "green" },
  "court-ruling": { label: "Court Ruling", color: "red" },
  "procedure": { label: "Procedure", color: "orange" },
  "general": { label: "General", color: "default" },
};

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentNote, isLoading } = useSelector((state) => state.notes);
  const [isLoadingNote, setIsLoadingNote] = useState(true);

  useEffect(() => {
    const loadNote = async () => {
      setIsLoadingNote(true);
      try {
        await dispatch(fetchNote(id)).unwrap();
      } catch (error) {
        navigate("/dashboard/notes");
      } finally {
        setIsLoadingNote(false);
      }
    };
    loadNote();
  }, [dispatch, id, navigate]);

  const handleTogglePin = () => {
    dispatch(togglePin(id));
  };

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(id));
  };

  const getCategoryInfo = (category) => CATEGORIES[category] || CATEGORIES.general;

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const unescapeHtml = (str) => {
    if (!str) return "";
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  };

  const renderContent = (content) => {
    if (!content) return "";
    const unescaped = unescapeHtml(content);
    if (unescaped.includes("<") && unescaped.includes(">")) {
      return <div dangerouslySetInnerHTML={{ __html: unescaped }} style={{ lineHeight: 1.8, fontSize: "16px", minHeight: "200px" }} />;
    }
    return <div style={{ lineHeight: 1.8, fontSize: "16px", whiteSpace: "pre-wrap" }}>{unescaped}</div>;
  };

  if (isLoadingNote || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <GoBackButton />
        <Empty description="Note not found" className="mt-8">
          <Link to="/dashboard/notes">
            <Button type="primary">Back to Notes</Button>
          </Link>
        </Empty>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(currentNote.category);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <GoBackButton />
      
      <Card 
        className="mt-4 shadow-md"
        style={{ 
          borderTopColor: currentNote.color || "#3b82f6",
          backgroundColor: currentNote.color && currentNote.color !== "#ffffff" ? currentNote.color : undefined
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Tag color={categoryInfo.color}>{categoryInfo.label}</Tag>
              {currentNote.isPinned && (
                <Tag icon={<PushpinFilled />} color="orange">Pinned</Tag>
              )}
              {currentNote.isFavorite && (
                <Tag icon={<StarFilled />} color="gold">Favorite</Tag>
              )}
            </div>
            <Title level={2} className="mb-2">{currentNote.title}</Title>
          </div>
          
          <Space>
            <Button 
              icon={currentNote.isPinned ? <PushpinFilled /> : <PushpinFilled />}
              type={currentNote.isPinned ? "primary" : "default"}
              onClick={handleTogglePin}
            >
              {currentNote.isPinned ? "Pinned" : "Pin"}
            </Button>
            <Button 
              icon={currentNote.isFavorite ? <StarFilled /> : <StarFilled />}
              type={currentNote.isFavorite ? "primary" : "default"}
              onClick={handleToggleFavorite}
            >
              {currentNote.isFavorite ? "Favorited" : "Favorite"}
            </Button>
            <Link to={`/dashboard/update-note/${id}`}>
              <Button type="primary" icon={<EditOutlined />}>
                Edit
              </Button>
            </Link>
          </Space>
        </div>

        {currentNote.tags && currentNote.tags.length > 0 && (
          <div className="mb-4">
            {currentNote.tags.map((tag) => (
              <Tag key={tag} className="mb-1">#{tag}</Tag>
            ))}
          </div>
        )}

        <Divider />

        <div className="note-content">
          {renderContent(currentNote.content)}
        </div>

        <Divider />

        <div className="flex items-center justify-between text-gray-500">
          <Space>
            <CalendarOutlined />
            <Text type="secondary">
              Created: {new Date(currentNote.createdAt).toLocaleString()}
            </Text>
          </Space>
          {currentNote.updatedAt !== currentNote.createdAt && (
            <Text type="secondary">
              Last updated: {new Date(currentNote.updatedAt).toLocaleString()}
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NoteDetail;
