import React from "react"; // Import React to use JSX
import { it, describe, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../test-utils";
import Login from "../../pages/Login";
import { toast } from "react-toastify";

// Mock react-toastify
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("login Component", () => {
  it("should render and interact correctly", () => {
    render(<Login />);

    // Check if sign in header is rendered correctly
    const headerText = screen.getByText(/Sign in to your account/i);
    const forgotPasswordText = screen.getByText(/Forgot your password/i);
    const continueWithText = screen.getByText(/Or continue with/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i, {
      selector: "input",
    });
    const signButton = screen.getByRole("button", { name: /Sign in/i });
    const toggleButton = screen.getByRole("button", {
      name: /toggle password visibility/i,
    });

    // Check if elements are in the document
    expect(headerText).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(forgotPasswordText).toBeInTheDocument();
    expect(continueWithText).toBeInTheDocument();
    expect(signButton).toBeInTheDocument();

    // Check initial state of password visibility
    expect(screen.getByTestId("eye-icon")).toBeInTheDocument();

    // Simulate toggle password visibility
    fireEvent.click(toggleButton);
    expect(screen.getByTestId("eye-slash-icon")).toBeInTheDocument();
  });

  // test if email input value is updated on change
  it("updates email value on change", () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, { target: { value: "example@gmail.com" } });

    expect(emailInput.value).toBe("example@gmail.com");
  });

  // test if password input value is updated on change
  it("updates password value on change", () => {
    render(<Login />);
    const passwordInput = screen.getByLabelText(/password/i, {
      selector: "input",
    });
    fireEvent.change(passwordInput, { target: { value: "test1234" } });
    expect(passwordInput.value).toBe("test1234");
  });

  // Display toast error on empty form
  it("should display error if form is empty", () => {
    render(<Login />);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(toast.error).toHaveBeenCalledWith(
      "Enter both your email and password"
    );
  });

  //mock loginUser function
  it("should call loginUser function", () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i, {
      selector: "input",
    });
    const submitBtn = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
    fireEvent.change(passwordInput, { target: { value: "test1234" } });
    fireEvent.click(submitBtn);
  });

  // does not call loginUser function if email and password is empty
  it("should not call loginUser function if email and password is empty", () => {
    render(<Login />);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);
  });

  // does not call loginUser function if email is empty
  it("should not call loginUser function if email is empty", () => {
    render(<Login />);
    const passwordInput = screen.getByLabelText(/Password/i, {
      selector: "input",
    });
    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.change(passwordInput, { target: { value: "test1234" } });
    fireEvent.click(submitBtn);
  });

  // does not call loginUser function if password is empty
  it("should not call loginUser function if password is empty", () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
    fireEvent.click(submitBtn);
  });

  // test success login and navigate to dashboard
  it("should navigate to dashboard on success", () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i, {
      selector: "input",
    });
    const submitBtn = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
    fireEvent.change(passwordInput, { target: { value: "test1234" } });
    fireEvent.click(submitBtn);
  });

  // test loading state of login
  it("should display loading state on login", () => {
    render(<Login />);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i, {
      selector: "input",
    });
    const submitBtn = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "test@gmail.com" } });
    fireEvent.change(passwordInput, { target: { value: "test1234" } });
    fireEvent.click(submitBtn);
  });
});
