import { useState, useEffect } from "react";
import { Layout, Button, Drawer } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import SideBar from "./SideBar.jsx";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser.jsx";

const { Header, Content, Sider } = Layout;

const DashboardLayout = () => {
  useRedirectLogoutUser("/users/login");

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      if (!newIsMobile) {
        setDrawerVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setDrawerVisible(false);
    }
  }, [location, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setDrawerVisible(!drawerVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <Layout
      style={{ minHeight: "100vh", maxWidth: "100vw", overflow: "hidden" }}>
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="transition-all duration-300 ease-in-out"
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
          }}>
          <SideBar isMobile={isMobile} />
        </Sider>
      )}
      <Layout
        className={`site-layout transition-all duration-300 ease-in-out ${
          isMobile ? "ml-0" : collapsed ? "ml-20" : "ml-52"
        }`}>
        <Header className="bg-white p-0 flex items-center sticky top-0 z-10">
          <Button
            type="text"
            icon={
              isMobile || collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={toggleSidebar}
            className="text-xl h-16 w-16"
          />
        </Header>
        <Content
          className=" w-[100%]  sm:p-4 m-0 p-3 bg-gray-200 rounded-lg overflow-auto"
          style={{ height: "calc(100vh - 64px)" }}>
          <Outlet />
        </Content>
      </Layout>
      {isMobile && (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setDrawerVisible(false)}
          visible={drawerVisible}
          bodyStyle={{ padding: 0 }}
          width={200}>
          <SideBar
            isMobile={isMobile}
            closeDrawer={() => setDrawerVisible(false)}
          />
        </Drawer>
      )}
    </Layout>
  );
};

export default DashboardLayout;
