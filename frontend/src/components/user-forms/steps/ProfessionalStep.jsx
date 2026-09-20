// components/user-forms/steps/ProfessionalStep.jsx - NEW USER MODEL
// Shows the section matching the selected user type and professional role.
import { Form } from "antd";
import { Alert } from "antd";
import PropTypes from "prop-types";
import ClientFormSection from "../sections/ClientFormSection";
import StaffFormSection from "../sections/StaffFormSection";
import LawyerFormSection from "../sections/LawyerFormSection";

const ProfessionalStep = ({ selectedUserType }) => {
  const form = Form.useFormInstance();
  const role = Form.useWatch("role", form);

  const isClient = selectedUserType === "client";
  const isLawyerRole = !isClient && role === "lawyer";

  return (
    <div className="professional-step">
      {isClient ? (
        <ClientFormSection />
      ) : isLawyerRole ? (
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