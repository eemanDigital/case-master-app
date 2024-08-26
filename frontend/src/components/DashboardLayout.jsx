import { useState } from "react";
import { Layout, Button } from "antd";
import { Outlet } from "react-router-dom";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import SideBar from "./SideBar.jsx";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser.jsx";
// import DashboardNav from "./DashboardNav.jsx";

const { Header, Content } = Layout;

const DashboardLayout = () => {
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout className="min-h-screen">
      <SideBar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout
        className="site-layout"
        style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header className="bg-white p-0 flex items-center">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            className="text-xl h-16 w-16"
          />
          {/* <DashboardNav /> */}
        </Header>
        <Content
          className="m-4 p-6 bg-gray-300  rounded-lg overflow-auto"
          style={{
            minHeight: 280,
          }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
