import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/store/store.js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthContextProvider from "./context/authContext.jsx";

// import "antd/dist/antd.css"; // Import Ant Design CSS here
import "./index.css";
import "./ClientDashboard.css";

import PhotoContextProvider from "./context/photoContext.jsx";
import { DataFetcherContext } from "./context/dataFetcherContext.jsx";
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
  </React.StrictMode>
);
