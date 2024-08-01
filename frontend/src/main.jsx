import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/store/store.js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthContextProvider from "./context/authContext.jsx";

import "./index.css";
import PhotoContextProvider from "./context/photoContext.jsx";
import { DataFetcherContext } from "./context/dataFetcherContext.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID; //google oauth client id

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthContextProvider>
          <PhotoContextProvider>
            <DataFetcherContext>
              <App />
            </DataFetcherContext>
          </PhotoContextProvider>
        </AuthContextProvider>
      </GoogleOAuthProvider>
    </Provider>
  </React.StrictMode>
);
