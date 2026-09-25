/* eslint-disable no-unused-vars -- React import is required by vitest's classic JSX runtime (vitest.config.js has no react plugin) */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Form, Segmented } from "antd";

function Repro() {
  const [form] = Form.useForm();
  const publishOnSave = Form.useWatch("publishOnSave", form) === "publish";
  return (
    <>
      <Form form={form} initialValues={{ publishOnSave: "draft" }}>
        <Form.Item name="publishOnSave" style={{ marginBottom: 0 }}>
          <Segmented
            options={[
              { label: "Save as Draft", value: "draft" },
              { label: "Save & Publish", value: "publish" },
            ]}
          />
        </Form.Item>
      </Form>
      <span data-testid="value">{publishOnSave ? "PUBLISH" : "DRAFT"}</span>
    </>
  );
}

describe("Publishing Segmented (Save as Draft / Save & Publish)", () => {
  it("updates form store + watch when an option is clicked", () => {
    render(<Repro />);
    expect(screen.getByTestId("value")).toHaveTextContent("DRAFT");
    fireEvent.click(screen.getByText("Save & Publish"));
    expect(screen.getByTestId("value")).toHaveTextContent("PUBLISH");
  });
});