import { useDispatch, useSelector } from "react-redux";
import {
  selectIsLoggedIn,
  selectUser,
} from "../../redux/features/auth/authSlice";
import { Alert } from "antd";

// for login
export const ShowOnLogin = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  if (isLoggedIn) {
    return <>{children}</>;
  }
  return null;
};

// for logout
export const ShowOnLogout = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  if (!isLoggedIn) {
    return <>{children}</>;
  }
  return null;
};

export const ShowAdminRoute = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);

  if (
    (isLoggedIn && user?.data?.role === "admin") ||
    user?.data?.role === "super-admin"
  ) {
    return <>{children}</>;
  }
  return (
    <Alert
      message="Access Denied"
      description="You are not eligible to visit this page."
      type="error"
      showIcon
    />
  );
};
export const BillingAndPaymentsRoute = ({ element }) => {
  return <ShowAdminRoute>{element}</ShowAdminRoute>;
};

export const ShowAdminComponent = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);

  if (
    (isLoggedIn && user?.data?.role === "admin") ||
    user?.data?.role === "super-admin"
  ) {
    return <>{children}</>;
  }
  return null;
};
// export const ShowOnLoginAndRedirect = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { isLoggedIn, isLoading } = useSelector((state) => state.auth);
//   const [checkedLogin, setCheckedLogin] = useState(false);

//   useEffect(() => {
//     if (!isLoggedIn) {
//       dispatch(getUser()); // Dispatch the action to get the user
//     } else {
//       setCheckedLogin(true);
//     }
//   }, [isLoggedIn, dispatch]);

//   useEffect(() => {
//     if (!isLoggedIn && !isLoading) {
//       // toast.error("You need to login to access your dashboard");
//       navigate("/login"); // Redirect to login page
//     }
//   }, [isLoggedIn, isLoading, navigate]);

//   if (!checkedLogin) {
//     return null; // Render nothing until login status is checked
//   }

//   // If logged in and checked, render the child routes
//   return <Outlet />;
// };
