import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthContextProvider from "./context/authContext.jsx";

import "./index.css";
import PhotoContextProvider from "./context/photoContext.jsx";
import { DataFetcherContext } from "./context/dataFetcherContext.jsx";

const googleClientId = import.meta.env.VITE_CALENDER_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <AuthContextProvider>
      <PhotoContextProvider>
        <DataFetcherContext>
          <React.StrictMode>
            <App />
          </React.StrictMode>
        </DataFetcherContext>
      </PhotoContextProvider>
    </AuthContextProvider>
  </GoogleOAuthProvider>
);
