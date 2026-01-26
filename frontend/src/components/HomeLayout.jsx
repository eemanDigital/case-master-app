// import Header from "./Header";
import { Outlet } from "react-router-dom";

// Add this to your existing HomeLayout component
import { useTheme } from "../providers/ThemeProvider";

// Inside your HomeLayout component, get the theme
const HomeLayout = () => {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "dark:bg-gray-900 dark:text-gray-100"
          : "bg-white text-gray-900"
      }`}>
      <Outlet />
    </div>
  );
};

export default HomeLayout;
