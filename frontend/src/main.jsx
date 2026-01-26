import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/store/store.js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthContextProvider from "./contexts/authContext.jsx";
import "./ClientDashboard.css";
import "../../frontend/src/components/tasks/TaskList.css";
import "./index.css";

import PhotoContextProvider from "./contexts/photoContext.jsx";
import { DataFetcherContext } from "./contexts/dataFetcherContext.jsx";
import ReportDataProvider from "../providers/ReportDataProvider.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID; //google oauth client id

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthContextProvider>
          <ReportDataProvider>
            <PhotoContextProvider>
              <DataFetcherContext>
                <App />
              </DataFetcherContext>
            </PhotoContextProvider>
          </ReportDataProvider>
        </AuthContextProvider>
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>,
);
