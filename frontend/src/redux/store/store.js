import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import loadingReducer from "../features/loader/loadingSlice";
import emailReducer from "../features/emails/emailSlice";
import deleteReducer from "../features/delete/deleteSlice";
// import appDataReducer from "../features/appData/appDataSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loading: loadingReducer,
    email: emailReducer,
    delete: deleteReducer,
    // appData: appDataReducer,
  },
});
