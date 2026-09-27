/* eslint-disable no-unused-vars, react/prop-types -- React import is required by vitest's classic JSX runtime (vitest.config.js has no react plugin) */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Form } from "antd";

globalThis.React = React;
const { default: ProfessionalStep } = await import(
  "../components/user-forms/steps/ProfessionalStep"
);

let renders = 0;
function Counted() {
  renders += 1;
  if (renders > 200) throw new Error("RENDER LOOP");
  return <ProfessionalStep selectedUserType="staff" />;
}

function Harness({ initialValues = {} }) {
  const [form] = Form.useForm();
  return (
    <Form form={form} initialValues={initialValues} preserve>
      <Counted />
    </Form>
  );
}

const openSelect = (index) => {
  const selectors = document.querySelectorAll(".ant-select-selector");
  fireEvent.mouseDown(selectors[index]);
  return Array.from(document.querySelectorAll(".ant-select-item-option"));
};

describe("ProfessionalStep role branching", () => {
  it("does not loop when a lawyer is selected, and can switch back to staff", () => {
    renders = 0;
    render(<Harness />);

    const roleOptions = openSelect(0);
    const lawyerOption = roleOptions.find((o) => o.textContent === "Lawyer");
    act(() => fireEvent.click(lawyerOption));

    expect(renders).toBeLessThan(200);
    expect(
      screen.getByText("Legal Credentials Required")
    ).toBeInTheDocument();

    const backOptions = openSelect(0);
    act(() =>
      fireEvent.click(backOptions.find((o) => o.textContent === "HR"))
    );

    expect(renders).toBeLessThan(200);
    expect(
      screen.getByText("Staff Details")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Legal Credentials Required")
    ).not.toBeInTheDocument();
  });

  it("does not loop when role is pre-seeded to lawyer", () => {
    renders = 0;
    expect(() => render(<Harness initialValues={{ role: "lawyer" }} />)).not.toThrow();
    expect(renders).toBeLessThan(200);
  });
});
