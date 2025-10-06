import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Card, Empty, Modal, Tag, Statistic, Progress, Button } from "antd";
import {
  CheckCircleOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  EyeIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import TodoTask from "./TodoTask";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import TodoForm from "../pages/TodoForm";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const TodoList = () => {
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

  // Calculate todo statistics
  const todoStats = () => {
    const userTodoList = allTodos.filter(
      (todo) => todo.userId === user?.data?._id
    );
    const pendingTodos = userTodoList.filter((todo) => !todo.isCompleted);
    const completedTodos = userTodoList.filter((todo) => todo.isCompleted);
    const completionRate =
      userTodoList.length > 0
        ? Math.round((completedTodos.length / userTodoList.length) * 100)
        : 0;

    return {
      total: userTodoList.length,
      pending: pendingTodos.length,
      completed: completedTodos.length,
      completionRate,
      pendingTodos,
    };
  };

  const stats = todoStats();

  if (loading.todos) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-0 rounded-2xl h-[200px] animate-pulse">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading tasks...</div>
          </div>
        </div>
      </Card>
    );
  }

  if (error.todos) {
    toast.error(error.todos);
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-0 rounded-2xl h-[200px]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ClipboardDocumentListIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-red-600">Failed to load tasks</div>
          </div>
        </div>
      </Card>
    );
  }

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      {/* Todo Widget Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">My Tasks</span>
          </div>
        }
        className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
        onClick={showModal}
        hoverable
        extra={
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <EyeIcon className="w-4 h-4" />
            Manage
          </div>
        }>
        <div className="flex items-center justify-between h-32">
          {/* Progress Section */}
          <div className="flex-1 space-y-4">
            {stats.total === 0 ? (
              <div className="text-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-gray-500 text-sm">No tasks yet</span>
                  }
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.completionRate}%
                    </span>
                  </div>
                  <Progress
                    percent={stats.completionRate}
                    size="small"
                    strokeColor={
                      stats.completionRate >= 75
                        ? "#10B981"
                        : stats.completionRate >= 50
                        ? "#F59E0B"
                        : "#EF4444"
                    }
                    showInfo={false}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ClockCircleOutlined className="text-orange-500" />
                      <span className="text-lg font-bold text-gray-900">
                        {stats.pending}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircleOutlined className="text-green-500" />
                      <span className="text-lg font-bold text-gray-900">
                        {stats.completed}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Done</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions & Status */}
          <div className="flex-1 pl-4 border-l border-gray-200 space-y-3">
            {stats.pending > 0 ? (
              <div className="text-center">
                <Tag
                  color={
                    stats.pending > 5
                      ? "red"
                      : stats.pending > 2
                      ? "orange"
                      : "blue"
                  }
                  className="w-full justify-center py-1">
                  {stats.pending} pending task{stats.pending !== 1 ? "s" : ""}
                </Tag>
                <div className="text-xs text-gray-500 mt-2">
                  Click to manage
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <CheckBadgeIcon className="w-8 h-8 text-green-500 mx-auto" />
                <div className="text-sm text-gray-600">All caught up!</div>
              </div>
            )}

            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                showModal();
              }}>
              Add Task
            </Button>
          </div>
        </div>
      </Card>

      {/* Todo Management Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                Task Management
              </div>
              <div className="text-sm text-gray-500">
                Manage your personal tasks and to-dos
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl">
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="text-gray-600 text-sm">Total Tasks</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.total}
              </div>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="text-gray-600 text-sm">Pending</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.pending}
              </div>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="text-gray-600 text-sm">Completed</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.completed}
              </div>
            </Card>
          </div>

          {/* Progress Overview */}
          {stats.total > 0 && (
            <Card className="border-0 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-900">
                  Overall Progress
                </span>
                <Tag
                  color={
                    stats.completionRate >= 75
                      ? "success"
                      : stats.completionRate >= 50
                      ? "warning"
                      : "error"
                  }>
                  {stats.completionRate}% Complete
                </Tag>
              </div>
              <Progress
                percent={stats.completionRate}
                strokeColor={
                  stats.completionRate >= 75
                    ? "#10B981"
                    : stats.completionRate >= 50
                    ? "#F59E0B"
                    : "#EF4444"
                }
                size="large"
              />
            </Card>
          )}

          {/* Task List */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <UnorderedListOutlined />
                <span className="font-semibold">Your Tasks</span>
                <Tag color="blue">{stats.total} tasks</Tag>
              </div>
            }
            className="border-0 shadow-sm">
            <TodoTask tasks={allTodos || []} />
          </Card>

          {/* Add New Task */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                <span className="font-semibold">Add New Task</span>
              </div>
            }
            className="border-0 shadow-sm">
            <TodoForm
              addOptimisticTodo={addOptimisticTodo}
              removeOptimisticTodo={removeOptimisticTodo}
            />
          </Card>
        </div>
      </Modal>
    </>
  );
};

TodoList.propTypes = {
  // Add any prop types if needed
};

export default TodoList;
