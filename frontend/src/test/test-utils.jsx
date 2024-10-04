import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { GoogleOAuthProvider } from "@react-oauth/google";
import authReducer from "../redux/features/auth/authSlice";

// Create a custom render function
const customRender = (
  ui, // React component to render
  {
    preloadedState, // optional initial state for the redux store
    store = configureStore({
      reducer: { auth: authReducer },
      preloadedState,
    }),
    ...renderOptions //other options for render function
  } = {}
) => {
  return render(
    <Provider store={store}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <MemoryRouter>{ui}</MemoryRouter>
      </GoogleOAuthProvider>
    </Provider>,
    renderOptions
  );
};

export * from "@testing-library/react";
export { customRender as render };
