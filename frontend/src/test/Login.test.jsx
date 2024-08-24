// import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// import { BrowserRouter } from "react-router-dom";
// import { Provider } from "react-redux";
// import configureMockStore from "redux-mock-store";
// import thunk from "redux-thunk";
// import { describe, it, expect, beforeEach } from "vitest";
// import Login from "../pages/Login";
// import { login } from "../redux/features/auth/authSlice";

// // Set up middlewares and mock store
// const middlewares = [thunk];
// const mockStore = configureMockStore(middlewares);

// describe("Login Component", () => {
//   let store;

//   beforeEach(() => {
//     // Initial mock store state
//     store = mockStore({
//       auth: {
//         isError: false,
//         isSuccess: false,
//         isLoading: false,
//         message: "",
//         isLoggedIn: false,
//         twoFactor: false,
//       },
//     });
//   });

//   it("renders the login form", () => {
//     render(
//       <Provider store={store}>
//         <BrowserRouter>
//           <Login />
//         </BrowserRouter>
//       </Provider>
//     );

//     // Assertions to check if form elements are rendered
//     expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
//     expect(
//       screen.getByRole("button", { name: /sign in/i })
//     ).toBeInTheDocument();
//     expect(screen.getByText(/forgot your password\?/i)).toBeInTheDocument();
//   });

//   it("handles input changes", () => {
//     render(
//       <Provider store={store}>
//         <BrowserRouter>
//           <Login />
//         </BrowserRouter>
//       </Provider>
//     );

//     const emailInput = screen.getByLabelText(/email address/i);
//     const passwordInput = screen.getByLabelText(/password/i);

//     // Simulate user input
//     fireEvent.change(emailInput, { target: { value: "test@example.com" } });
//     fireEvent.change(passwordInput, { target: { value: "password123" } });

//     // Assert input values
//     expect(emailInput.value).toBe("test@example.com");
//     expect(passwordInput.value).toBe("password123");
//   });

//   it("submits the form and dispatches login action", async () => {
//     render(
//       <Provider store={store}>
//         <BrowserRouter>
//           <Login />
//         </BrowserRouter>
//       </Provider>
//     );

//     const emailInput = screen.getByLabelText(/email address/i);
//     const passwordInput = screen.getByLabelText(/password/i);
//     const loginButton = screen.getByRole("button", { name: /sign in/i });

//     // Simulate user input
//     fireEvent.change(emailInput, { target: { value: "test@example.com" } });
//     fireEvent.change(passwordInput, { target: { value: "password123" } });

//     // Simulate form submission
//     fireEvent.click(loginButton);

//     // Wait for the action to be dispatched
//     await waitFor(() => {
//       const actions = store.getActions();
//       expect(actions).toContainEqual(
//         login({ email: "test@example.com", password: "password123" })
//       );
//     });
//   });
// });
