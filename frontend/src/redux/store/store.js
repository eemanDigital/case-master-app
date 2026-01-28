import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import { thunk } from "redux-thunk";
import loadingReducer from "../features/loader/loadingSlice";
import emailReducer from "../features/emails/emailSlice";
import deleteReducer from "../features/delete/deleteSlice";
import matterReducer from "../features/matter/matterSlice";
// import appDataReducer from "../features/appData/appDataSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loading: loadingReducer,
    email: emailReducer,
    delete: deleteReducer,
    matter: matterReducer,
    // appData: appDataReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["matter/create/fulfilled"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["meta.arg", "payload.timestamp"],
        // Ignore these paths in the state
        ignoredPaths: [
          "matter.currentMatter.dateOpened",
          "matter.currentMatter.expectedClosureDate",
        ],
      },
    }).concat(thunk),
  // devTools: process.env.NODE_ENV !== 'production',
});
