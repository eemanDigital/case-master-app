// components/user-forms/steps/ProfessionalStep.jsx - NEW USER MODEL
// Shows the section matching the selected user type and professional role.
import { Form, Select, Alert } from "antd";
import PropTypes from "prop-types";
import ClientFormSection from "../sections/ClientFormSection";
import StaffFormSection from "../sections/StaffFormSection";
import LawyerFormSection from "../sections/LawyerFormSection";
import { roles } from "../../../data/options";

const ProfessionalStep = ({ selectedUserType }) => {
  const form = Form.useFormInstance();
  const role = Form.useWatch("role", form);

  const isClient = selectedUserType === "client";
  const isLawyerRole = !isClient && role === "lawyer";

  // Clients have no selectable role — it is derived from userType. The field is
  // still registered (hidden) so the value survives and is submitted.
  if (isClient) {
    return (
      <div className="professional-step">
        <Form.Item name="role" hidden>
          <input type="hidden" />
        </Form.Item>
        <ClientFormSection />
      </div>
    );
  }

  return (
    <div className="professional-step">
      {/* The role selector decides which section below is rendered, so it must
          stay mounted outside of those sections. Registering `role` inside a
          branch unmounts the very field being watched and re-renders forever. */}
      <Form.Item
        name="role"
        label="Professional Role"
        rules={[{ required: true, message: "Please select a role" }]}
      >
        <Select
          size="large"
          options={roles.filter((r) => r.value && r.value !== "client")}
          placeholder="Select role"
        />
      </Form.Item>

      {isLawyerRole ? (
        <LawyerFormSection />
      ) : (
        <>
          <Alert
            message="Staff Details"
            description="Provide the employment information for this staff member."
            type="info"
            showIcon
            className="mb-4"
          />
          <StaffFormSection />
        </>
      )}
    </div>
  );
};

ProfessionalStep.propTypes = {
  selectedUserType: PropTypes.oneOf(["client", "staff"]).isRequired,
};

export default ProfessionalStep;
