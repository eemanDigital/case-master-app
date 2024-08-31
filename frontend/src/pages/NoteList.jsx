import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { List, Card, Modal, Tooltip, Pagination } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

import { useDataGetterHook } from "../hooks/useDataGetterHook";
import useTextShorten from "../hooks/useTextShorten";
import { deleteData } from "../redux/features/delete/deleteSlice";
import SearchBar from "../components/SearchBar";
import ButtonWithIcon from "../components/ButtonWithIcon";

const NoteList = () => {
  const { fetchData, loading, error, notes } = useDataGetterHook();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const currentUser = user?.data?._id;
  const { shortenText } = useTextShorten();
  const [searchResults, setSearchResults] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    fetchData("notes", "notes");
  }, [fetchData]);

  // search bar handler
  // render all cases initially before filter
  useEffect(() => {
    if (notes?.data?.notes) {
      setSearchResults(notes?.data?.notes);
    }
  }, [notes?.data?.notes]); // Only depend on users.data to avoid unnecessary re-renders

  // handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(notes?.data?.notes);
      return;
    }

    const results = notes?.data?.notes?.filter((d) => {
      const titleMatch = d.title?.toLowerCase().includes(searchTerm);
      const contentMatch = d.content?.toLowerCase().includes(searchTerm);

      return titleMatch || contentMatch;
    });
    setSearchResults(results);
  };

  // delete note handler
  const deleteNote = async (id) => {
    try {
      await dispatch(deleteData(`notes/${id}`));
      await fetchData("notes", "notes");
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  if (loading.notes)
    return (
      <div className="flex justify-center items-center ">
        <span className="text-lg">Loading notes...</span>
      </div>
    );
  if (error.notes)
    return (
      <div className="text-red-600 text-center mt-8 text-lg">
        Error loading notes: {error.notes}
      </div>
    );

  const userNotes =
    searchResults?.filter((note) => note?.user === currentUser) || [];

  const paginatedNotes = userNotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="max-w-7xl mx-auto font-poppins">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 ">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">Your Notes</h1>

        <Link to="/dashboard/add-notes">
          <ButtonWithIcon
            onClick={() => {}}
            icon={<PlusOutlined />}
            text="Create Note"
          />
        </Link>

        <SearchBar onSearch={handleSearchChange} />
      </div>
      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 2,
          md: 3,
          lg: 3,
          xl: 3,
          xxl: 3,
        }}
        dataSource={paginatedNotes}
        renderItem={(note) => (
          <List.Item>
            <Card
              hoverable
              className="w-full h-full shadow-md transition-all duration-300 ease-in-out hover:shadow-lg border-t-4 border-blue-500"
              actions={[
                <Tooltip title="Edit Note" key="edit">
                  <Link to={`/dashboard/update-note/${note._id}`}>
                    <EditOutlined className="text-blue-500 hover:text-blue-700" />
                  </Link>
                </Tooltip>,
                <Tooltip title="Delete Note" key="delete">
                  <DeleteOutlined
                    className="text-red-500 hover:text-red-700"
                    onClick={() =>
                      Modal.confirm({
                        title: "Are you sure you want to delete this note?",
                        onOk: () => deleteNote(note?._id),
                      })
                    }
                  />
                </Tooltip>,
              ]}>
              <Card.Meta
                title={
                  <span className="text-lg font-semibold text-gray-800">
                    {note.title}
                  </span>
                }
                description={
                  <div>
                    <p className="text-gray-500 mb-2 text-sm">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700 text-base">
                      {shortenText(note?.content, 100, note._id)}
                    </p>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
      <div className="mt-8 flex justify-center">
        <Pagination
          current={currentPage}
          total={userNotes.length}
          pageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default NoteList;
