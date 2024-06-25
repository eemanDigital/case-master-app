// import PropTypes from "prop-types";
import { Button } from "antd";
import TodoTask from "./TodoTask";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const TodoHeader = ({ title }) => {
  // custom hook for data fetch
  const { todos, error, loading } = useDataGetterHook();

  if (loading.todos) return <p>Loading...</p>;
  if (error.todos) return <p>Error: {error.todos}</p>;

  const todosData = todos?.data?.todos || [];

  return (
    <div className="flex justify-between items-center shadow-md px-4 pt-2 p-24 rounded-md">
      <h1>{title}</h1>
      <Button className="bg-blue-500 rounded-none text-white">Add</Button>
      {todosData.map((todo) => (
        <TodoTask
          key={todo._id}
          desc={todo.description}
          isCompleted={todo.isCompleted}
          priority={todo.priority}
          createdAt={todo.createdAt}
          dueDate={todo.dueDate}
        />
      ))}
    </div>
  );
};

export default TodoHeader;
