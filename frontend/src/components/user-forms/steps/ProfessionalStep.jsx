// components/user-forms/steps/ProfessionalStep.jsx
import { Tabs } from "antd";
import PropTypes from "prop-types";
import ClientFormSection from "../sections/ClientFormSection";
import StaffFormSection from "../sections/StaffFormSection";
import LawyerFormSection from "../sections/LawyerFormSection";
import AdminFormSection from "../sections/AdminFormSection";

const { TabPane } = Tabs;

const ProfessionalStep = ({ selectedUserType }) => {
  return (
    <div className="professional-step">
      <Tabs activeKey={selectedUserType} className="user-type-tabs">
        <TabPane tab="Client Details" key="client">
          <ClientFormSection />
        </TabPane>

        <TabPane tab="Staff Details" key="staff">
          <StaffFormSection />
        </TabPane>

        <TabPane tab="Lawyer Details" key="lawyer">
          <LawyerFormSection />
        </TabPane>

        <TabPane tab="Admin Details" key="admin">
          <AdminFormSection />
        </TabPane>
      </Tabs>
    </div>
  );
};

ProfessionalStep.propTypes = {
  selectedUserType: PropTypes.oneOf(["client", "staff", "lawyer", "admin"])
    .isRequired,
};

export default ProfessionalStep;
