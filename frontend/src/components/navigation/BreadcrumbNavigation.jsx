import { Breadcrumb } from "antd";
import { useLocation, Link } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";

const BreadcrumbNavigation = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split("/").filter(i => i);

  const breadcrumbNameMap = {
    dashboard: "Dashboard",
    matters: "Matters",
    cases: "Cases",
    "case-reports": "Reports",
    staff: "Staff",
    "staff-status": "Status",
    "cause-list": "Cause List",
    tasks: "Tasks",
    clients: "Clients",
    documents: "Documents",
    billings: "Billing",
    profile: "Profile",
    create: "Create",
    edit: "Edit",
  };

  const extraBreadcrumbItems = pathSnippets.map((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
    return {
      key: url,
      title: breadcrumbNameMap[snippet] || snippet.charAt(0).toUpperCase() + snippet.slice(1),
    };
  });

  const breadcrumbItems = [
    {
      title: (
        <Link to="/dashboard">
          <HomeOutlined />
        </Link>
      ),
      key: "home",
    },
    ...extraBreadcrumbItems,
  ];

  return (
    <Breadcrumb
      items={breadcrumbItems}
      style={{ margin: "0" }}
      className="text-sm"
    />
  );
};

export default BreadcrumbNavigation;