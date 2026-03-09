import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import loadingReducer from "../features/loader/loadingSlice";
import emailReducer from "../features/emails/emailSlice";
import deleteReducer from "../features/delete/deleteSlice";
import matterReducer from "../features/matter/matterSlice";
import litigationReducer from "../features/litigation/litigationSlice";
import corporateReducer from "../features/corporate/corporateSlice";
import propertyReducer from "../features/property/propertySlice";
import retainerReducer from "../features/retainer/retainerSlice";
import generalReducer from "../features/general/generalSlice";
import advisoryReducer from "../features/advisory/advisorySlice";
import calenderReducer from "../features/calender/calenderSlice";
import taskReducer from "../features/task/taskSlice";
import notesReducer from "../features/notes/notesSlice";
import templateReducer from "../features/templates/templateSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loading: loadingReducer,
    email: emailReducer,
    delete: deleteReducer,
    matter: matterReducer,
    litigation: litigationReducer,
    corporate: corporateReducer,
    property: propertyReducer,
    retainer: retainerReducer,
    general: generalReducer,
    advisory: advisoryReducer,
    calendar: calenderReducer,
    task: taskReducer,
    notes: notesReducer,
    template: templateReducer,
  },
  // Thunk is included by default, no need to concat it!
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Only keep these if you absolutely MUST pass non-serializable
        // objects (like File objects or Class instances) to actions.
        ignoredActions: ["matter/create/fulfilled"],
        ignoredActionPaths: ["meta.arg", "payload.timestamp"],
        // If you convert your dates to strings, you can delete these ignoredPaths
        ignoredPaths: [
          "matter.currentMatter.dateOpened",
          "matter.currentMatter.expectedClosureDate",
          "litigation.filters.dateRange",
          "calendar/createEvent/pending",
          "calendar/createEvent/fulfilled",
          "calendar/updateEvent/pending",
          "calendar/updateEvent/fulfilled",
        ],
      },
    }),
  // devTools: true in development, false in production
  // devTools: import.meta.env.MODE !== "production",
});
