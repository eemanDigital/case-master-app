import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  selectIsLoggedIn,
  selectUser,
  selectIsLoading,
} from "../../redux/features/auth/authSlice";
import { Alert } from "antd";
import LoadingSpinner from "../LoadingSpinner";

// for login
export const ShowOnLogin = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  if (isLoggedIn) {
    return <>{children}</>;
  }
  return null;
};
// Prop types for ShowOnLogin
ShowOnLogin.propTypes = {
  children: PropTypes.node.isRequired,
};

// for logout
export const ShowOnLogout = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);

  if (!isLoggedIn) {
    return <>{children}</>;
  }
  return null;
};

// Prop types for ShowOnLogout
ShowOnLogout.propTypes = {
  children: PropTypes.node.isRequired,
};

// allow access to only admin and super-admin - to be used for route
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

// Prop types for ShowAdminRoute
ShowAdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export const BillingAndPaymentsRoute = ({ element }) => {
  return <ShowAdminRoute>{element}</ShowAdminRoute>;
};

BillingAndPaymentsRoute.propTypes = {
  element: PropTypes.node.isRequired,
};

// allow access to only admin and super-admin - to be used for component
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

ShowAdminComponent.propTypes = {
  children: PropTypes.node.isRequired,
};

// Allow access to only verified users
export const ShowOnlyVerifiedUser = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading); // Assuming you have a loading state in your auth slice

  // While loading, show a spinner or some loading indication
  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-[50vh] bg-gray-100 mt-4">
  //       {/* <LoadingSpinner />
  //        */}
  //       loading...
  //     </div>
  //   );
  // }

  // Check if user is logged in and verified
  if (user?.data?.isVerified) {
    return <>{children}</>;
  }

  // If not verified or not logged in, show alert
  return (
    <div className="flex items-center justify-center min-h-[50vh] bg-gray-100 mt-4">
      <div className="max-w-md w-full p-4">
        <Alert
          message="Access Denied for Now"
          description="Verify your account to gain access."
          type="info"
          showIcon
          className="w-full"
        />
      </div>
    </div>
  );
};
// Prop types for ShowOnlyVerifiedUser
ShowOnlyVerifiedUser.propTypes = {
  children: PropTypes.node.isRequired,
};
