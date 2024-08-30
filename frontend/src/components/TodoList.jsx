import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Card, Empty, Modal } from "antd";
import { UnorderedListOutlined } from "@ant-design/icons";
import TodoTask from "./TodoTask";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import TodoForm from "../pages/TodoForm";
// import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const TodoList = ({ title }) => {
  const { todos, error, loading, fetchData } = useDataGetterHook();
  const [optimisticTodos, setOptimisticTodos] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchData("todos", "todos");
  }, []);

  const addOptimisticTodo = (todo) => {
    setOptimisticTodos((prev) => [...prev, todo]);
  };

  const removeOptimisticTodo = (id) => {
    setOptimisticTodos((prev) => prev.filter((todo) => todo?._id !== id));
  };

  const allTodos = [...(todos?.data?.todos || []), ...optimisticTodos];

  if (loading.todos)
    return <div className="min-h-max-[200px]"> loading...</div>;
  if (error.todos) return toast.error(error.todos);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const userTodos = (userId) =>
    todos?.data?.todos?.filter(
      (doc) => doc.userId === userId && doc.isCompleted === false
    );

  // console.log(userTodos(user?.data?._id));
  return (
    <>
      <Card
        hoverable
        // className="bg-orange-50 w-full sm:w-64 md:w-80 lg:w-96 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
        className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow h-[180px]  flex flex-col justify-center items-center"
        onClick={showModal}>
        <div className="space-y-2">
          <div className="text-orange-700 flex items-center ">
            <UnorderedListOutlined className="mr-2 p-3 rounded-full text-orange-700 bg-orange-200 text-2xl" />
            {title}
          </div>
          {allTodos.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <h1 className="text-sm text-orange-700">No tasks for today</h1>
              }
            />
          ) : (
            <h1 className="text-lg  font-medium text-orange-700">
              {userTodos(user?.data?._id).length} task(s) pending
            </h1>
          )}
        </div>
      </Card>

      <Modal
        title={
          <span className="text-xl text-blue-600 font-semibold">{title}</span>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width="90%"
        className="p-0">
        <div className="p-4 w-full max-h-[80vh] overflow-y-auto">
          <section className="flex flex-col bg-white pt-2 p-2 rounded-md">
            <div className="mt-4">
              <TodoTask tasks={allTodos || []} />
              <TodoForm
                addOptimisticTodo={addOptimisticTodo}
                removeOptimisticTodo={removeOptimisticTodo}
              />
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
};

TodoList.propTypes = {
  title: PropTypes.string.isRequired,
};

export default TodoList;
