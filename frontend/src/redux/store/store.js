import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import loadingReducer from "../features/loader/loadingSlice";
import emailReducer from "../features/emails/emailSlice";
// import appDataReducer from "../features/appData/appDataSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loading: loadingReducer,
    email: emailReducer,
    // appData: appDataReducer,
  },
});
