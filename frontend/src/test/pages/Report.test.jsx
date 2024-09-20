// import { render, screen, fireEvent } from "@testing-library/react";
// import { BrowserRouter } from "react-router-dom";
// import { Provider } from "react-redux";
// import configureMockStore from "redux-mock-store";
// import thunk from "redux-thunk";
// import { describe, it, expect, beforeEach } from "vitest";
// import CreateCaseReportForm from "../pages/CreateCaseReportForm";
// const middlewares = [thunk];
// const mockStore = configureMockStore(middlewares);

// describe("CreateCaseReportForm Component", () => {
//   let store;

//   beforeEach(() => {
//     store = mockStore({
//       auth: {
//         user: {
//           data: {
//             firstName: "John",
//             email: "john@example.com",
//           },
//         },
//       },
//     });
//   });

//   it("renders the form", () => {
//     render(
//       <Provider store={store}>
//         <BrowserRouter>
//           <CreateCaseReportForm />
//         </BrowserRouter>
//       </Provider>
//     );

//     expect(screen.getByText(/Case Report/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Report Date/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Write update here.../i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Matter adjourned for/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Case Reported/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Client's Name/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Case Reporter/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/Next Adjourned Date/i)).toBeInTheDocument();
//   });

//   it("handles input changes", () => {
//     render(
//       <Provider store={store}>
//         <BrowserRouter>
//           <CreateCaseReportForm />
//         </BrowserRouter>
//       </Provider>
//     );

//     const updateInput = screen.getByLabelText(/Write update here.../i);
//     const adjournedForInput = screen.getByLabelText(/Matter adjourned for/i);
//     const caseReportedSelect = screen.getByLabelText(/Case Reported/i);
//     const clientEmailSelect = screen.getByLabelText(/Client's Name/i);
//     const reportedBySelect = screen.getByLabelText(/Case Reporter/i);

//     fireEvent.change(updateInput, { target: { value: "Update text" } });
//     fireEvent.change(adjournedForInput, {
//       target: { value: "Adjourned for text" },
//     });
//     fireEvent.change(caseReportedSelect, { target: { value: "Case 1" } });
//     fireEvent.change(clientEmailSelect, {
//       target: { value: "client@example.com" },
//     });
//     fireEvent.change(reportedBySelect, { target: { value: "John" } });

//     expect(updateInput.value).toBe("Update text");
//     expect(adjournedForInput.value).toBe("Adjourned for text");
//     expect(caseReportedSelect.value).toBe("Case 1");
//     expect(clientEmailSelect.value).toBe("client@example.com");
//     expect(reportedBySelect.value).toBe("John");
//   });

//   it("submits the form", () => {
//     render(
//       <Provider store={store}>
//         <BrowserRouter>
//           <CreateCaseReportForm />
//         </BrowserRouter>
//       </Provider>
//     );

//     const submitButton = screen.getByRole("button", { name: /Submit/i });

//     fireEvent.click(submitButton);

//     const actions = store.getActions();
//     expect(actions).toContainEqual(
//       expect.objectContaining({ type: "reports/POST" })
//     );
//   });
// });
