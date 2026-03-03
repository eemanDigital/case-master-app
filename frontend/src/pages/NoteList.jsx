import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import {
  List,
  Card,
  Modal,
  Tooltip,
  Pagination,
  Input,
  Select,
  Button,
  Tag,
  Empty,
  Spin,
  Space,
  Segmented,
  Badge,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  StarFilled,
  PushpinFilled,
  StarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

import useDebouncedValue from "../hooks/useDebouncedValue.jsx";
import {
  fetchNotes,
  deleteNote,
  togglePin,
  toggleFavorite,
  fetchNoteStats,
  fetchTrashNotes,
  restoreNote,
  setFilters,
} from "../redux/features/notes/notesSlice";

import ButtonWithIcon from "../components/ButtonWithIcon";
import GoBackButton from "../components/GoBackButton";

const { Text, Title } = Typography;

const CATEGORIES = [
  { value: "case-notes", label: "Case Notes", color: "blue" },
  { value: "legal-research", label: "Legal Research", color: "purple" },
  { value: "client-info", label: "Client Info", color: "green" },
  { value: "court-ruling", label: "Court Ruling", color: "red" },
  { value: "procedure", label: "Procedure", color: "orange" },
  { value: "general", label: "General", color: "default" },
];

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "updated", label: "Recently Updated" },
  { value: "a-z", label: "A - Z" },
  { value: "z-a", label: "Z - A" },
];

const NoteList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notes, pagination, filters, isLoading, stats, trashNotes } =
    useSelector((state) => state.notes);

  const currentUser = user?.data?._id;

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const fetchParams = useMemo(
    () => ({
      page: pagination.currentPage,
      limit: 12,
      search: debouncedSearch || undefined,
      category: selectedCategory || undefined,
      sort: sortBy,
      ...(filters.isPinned === "true" && { isPinned: "true" }),
      ...(filters.isFavorite === "true" && { isFavorite: "true" }),
    }),
    [
      debouncedSearch,
      selectedCategory,
      sortBy,
      pagination.currentPage,
      filters,
    ],
  );

  useEffect(() => {
    if (activeTab === "all") {
      dispatch(fetchNotes(fetchParams));
    } else if (activeTab === "pinned") {
      dispatch(fetchNotes({ ...fetchParams, isPinned: "true" }));
    } else if (activeTab === "favorites") {
      dispatch(fetchNotes({ ...fetchParams, isFavorite: "true" }));
    } else if (activeTab === "trash") {
      dispatch(fetchTrashNotes());
    }
    dispatch(fetchNoteStats());
  }, [dispatch, activeTab, fetchParams]);

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleCategoryFilter = useCallback((value) => {
    setSelectedCategory(value);
  }, []);

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
  }, []);

  const handlePageChange = useCallback(
    (page) => {
      dispatch(setFilters({}));
      navigate(`?page=${page}`);
    },
    [dispatch, navigate],
  );

  const handleDeleteNote = useCallback(
    async (noteId) => {
      Modal.confirm({
        title: "Move to Trash?",
        content:
          "This note will be moved to trash and can be restored within 30 days.",
        okText: "Move to Trash",
        okType: "default",
        cancelText: "Cancel",
        onOk: async () => {
          await dispatch(deleteNote({ id: noteId }));
          dispatch(fetchNotes(fetchParams));
        },
      });
    },
    [dispatch, fetchParams],
  );

  const handlePermanentDelete = useCallback(
    async (noteId) => {
      Modal.confirm({
        title: "Delete Permanently?",
        content:
          "This action cannot be undone. The note will be permanently deleted.",
        okText: "Delete Forever",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          await dispatch(deleteNote({ id: noteId, hard: true }));
          dispatch(fetchTrashNotes());
        },
      });
    },
    [dispatch],
  );

  const handleRestore = useCallback(
    async (noteId) => {
      await dispatch(restoreNote(noteId));
      dispatch(fetchTrashNotes());
    },
    [dispatch],
  );

  const handleTogglePin = useCallback(
    async (noteId, e) => {
      e?.stopPropagation();
      await dispatch(togglePin(noteId));
    },
    [dispatch],
  );

  const handleToggleFavorite = useCallback(
    async (noteId, e) => {
      e?.stopPropagation();
      await dispatch(toggleFavorite(noteId));
    },
    [dispatch],
  );

  const getCategoryInfo = (category) =>
    CATEGORIES.find((c) => c.value === category) || CATEGORIES[5];

  const getNoteActions = (note) => [
    <Tooltip title="Edit Note" key="edit">
      <Link to={`/dashboard/update-note/${note._id}`}>
        <EditOutlined className="text-blue-500 hover:text-blue-700" />
      </Link>
    </Tooltip>,
    <Tooltip title={note.isPinned ? "Unpin" : "Pin"} key="pin">
      <PushpinFilled
        className={`${note.isPinned ? "text-orange-500" : "text-gray-400 hover:text-orange-500"}`}
        onClick={(e) => handleTogglePin(note._id, e)}
      />
    </Tooltip>,
    <Tooltip
      title={note.isFavorite ? "Remove from favorites" : "Add to favorites"}
      key="favorite">
      {note.isFavorite ? (
        <StarFilled
          className="text-yellow-500"
          onClick={(e) => handleToggleFavorite(note._id, e)}
        />
      ) : (
        <StarOutlined
          className="text-gray-400 hover:text-yellow-500"
          onClick={(e) => handleToggleFavorite(note._id, e)}
        />
      )}
    </Tooltip>,
    <Tooltip title="Delete" key="delete">
      <DeleteOutlined
        className="text-red-500 hover:text-red-700"
        onClick={() => handleDeleteNote(note._id)}
      />
    </Tooltip>,
  ];

  const getTrashActions = (note) => [
    <Tooltip title="Restore" key="restore">
      <Button type="link" size="small" onClick={() => handleRestore(note._id)}>
        Restore
      </Button>
    </Tooltip>,
    <Tooltip title="Delete Permanently" key="delete">
      <DeleteOutlined
        className="text-red-500 hover:text-red-700"
        onClick={() => handlePermanentDelete(note._id)}
      />
    </Tooltip>,
  ];

  const renderNoteCard = (note) => {
    const categoryInfo = getCategoryInfo(note.category);

    const unescapeHtml = (str) => {
      if (!str) return "";
      return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };

    const getPlainText = (html) => {
      if (!html) return "";
      const unescaped = unescapeHtml(html);
      return unescaped.replace(/<[^>]*>/g, "").trim();
    };

    const plainContent = getPlainText(note.content);

    return (
      <List.Item>
        <Card
          hoverable
          className="w-full h-full shadow-md transition-all duration-300 ease-in-out hover:shadow-lg border-t-4"
          style={{
            borderTopColor: note.color || "#3b82f6",
            backgroundColor:
              note.color && note.color !== "#ffffff" ? note.color : undefined,
          }}
          actions={
            activeTab === "trash" ? getTrashActions(note) : getNoteActions(note)
          }
          onClick={() =>
            activeTab !== "trash" && navigate(`/dashboard/note/${note._id}`)
          }>
          <Card.Meta
            title={
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold text-gray-800 truncate flex-1">
                  {note.title}
                </span>
                <Space size={4}>
                  {note.isPinned && (
                    <PushpinFilled className="text-orange-500 text-xs" />
                  )}
                  {note.isFavorite && (
                    <StarFilled className="text-yellow-500 text-xs" />
                  )}
                </Space>
              </div>
            }
            description={
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag color={categoryInfo.color} className="text-xs">
                    {categoryInfo.label}
                  </Tag>
                  {note.tags?.length > 0 && (
                    <Text type="secondary" className="text-xs">
                      {note.tags
                        .slice(0, 2)
                        .map((t) => `#${t}`)
                        .join(" ")}
                      {note.tags.length > 2 && ` +${note.tags.length - 2}`}
                    </Text>
                  )}
                </div>
                <Text type="secondary" className="text-xs block mb-2">
                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {note.updatedAt !== note.createdAt && (
                    <span className="ml-2">
                      (Updated: {new Date(note.updatedAt).toLocaleDateString()})
                    </span>
                  )}
                </Text>
                <div
                  className="text-gray-700 text-base m-0"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                  {plainContent.substring(0, 150)}
                  {plainContent.length > 150 && "..."}
                </div>
              </div>
            }
          />
        </Card>
      </List.Item>
    );
  };

  const userNotes = useMemo(() => {
    if (!notes || activeTab === "trash")
      return activeTab === "trash" ? trashNotes : [];
    return notes.filter((note) => note?.user === currentUser);
  }, [notes, currentUser, activeTab, trashNotes]);

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span className="text-gray-500">
          {activeTab === "trash"
            ? "Trash is empty"
            : activeTab === "pinned"
              ? "No pinned notes"
              : activeTab === "favorites"
                ? "No favorite notes"
                : "No notes yet. Create your first note!"}
        </span>
      }>
      {activeTab === "all" && (
        <Link to="/dashboard/add-notes">
          <Button type="primary" icon={<PlusOutlined />}>
            Create Note
          </Button>
        </Link>
      )}
    </Empty>
  );

  const renderFilterBar = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search notes..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
            allowClear
          />
          <Select
            placeholder="Category"
            value={selectedCategory || undefined}
            onChange={handleCategoryFilter}
            allowClear
            options={CATEGORY_OPTIONS}
            className="w-40"
          />
          <Select
            placeholder="Sort by"
            value={sortBy}
            onChange={handleSortChange}
            options={SORT_OPTIONS}
            className="w-40"
            suffixIcon={<SortAscendingOutlined />}
          />
        </div>
        <Space>
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: "all", label: "All" },
              {
                value: "pinned",
                label: (
                  <>
                    <PushpinFilled /> Pinned
                  </>
                ),
              },
              {
                value: "favorites",
                label: (
                  <>
                    <StarFilled /> Favorites
                  </>
                ),
              },
              {
                value: "trash",
                label: (
                  <>
                    <DeleteOutlined /> Trash
                  </>
                ),
              },
            ]}
          />
        </Space>
      </div>
    </div>
  );

  const renderStats = () => {
    if (!stats) return null;
    return (
      <div className="flex gap-4 mb-4">
        <Badge count={stats.pinnedCount} showZero color="orange">
          <Tag icon={<PushpinFilled />} color="orange">
            Pinned
          </Tag>
        </Badge>
        <Badge count={stats.favoriteCount} showZero color="gold">
          <Tag icon={<StarFilled />} color="gold">
            Favorites
          </Tag>
        </Badge>
        <Badge count={stats.trashCount} showZero color="red">
          <Tag icon={<DeleteOutlined />} color="red">
            Trash
          </Tag>
        </Badge>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto font-poppins p-4">
      <GoBackButton />

      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Title level={3} className="mb-0">
            Your Notes
          </Title>
          {renderStats()}
        </div>

        <div className="flex items-center gap-2">
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "grid", icon: <AppstoreOutlined /> },
              { value: "list", icon: <UnorderedListOutlined /> },
            ]}
          />
          {activeTab === "all" && (
            <Link to="/dashboard/add-notes">
              <ButtonWithIcon icon={<PlusOutlined />} text="Create Note" />
            </Link>
          )}
        </div>
      </div>

      {renderFilterBar()}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      ) : userNotes.length === 0 ? (
        <div className="py-20">{renderEmptyState()}</div>
      ) : (
        <>
          <List
            grid={{
              gutter: 16,
              xs: 1,
              sm: 2,
              md: viewMode === "grid" ? 3 : 1,
              lg: viewMode === "grid" ? 4 : 1,
              xl: viewMode === "grid" ? 4 : 1,
              xxl: viewMode === "grid" ? 4 : 1,
            }}
            listRenderProps={{
              style:
                viewMode === "list"
                  ? { display: "flex", flexDirection: "column" }
                  : {},
            }}
            dataSource={userNotes}
            renderItem={renderNoteCard}
          />
          {activeTab !== "trash" && pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                current={pagination.currentPage}
                total={pagination.totalDocs}
                pageSize={pagination.pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} notes`
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NoteList;
