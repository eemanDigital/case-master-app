import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CreateRetainer from "../../components/retainer/CreateRetainer";
import RetainerDetails from "../../components/retainer/RetainerDetails";

/**
 * Wrapper component for CreateRetainer to work with React Router
 * Use this in your dashboard routes
 */
export const CreateRetainerPage = () => {
  const { matterId } = useParams();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

 

  const handleCancel = () => {
    setVisible(false);
    // Navigate back to retainer list
    navigate("/dashboard/matters/retainers");
  };

  const handleSuccess = () => {
    setVisible(false);
    // Navigate to the newly created retainer's details page
    navigate(`/dashboard/matters/retainers/${matterId}/details`);
  };

  return (
    <CreateRetainer
      visible={visible}
      matterId={matterId}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
    />
  );
};

/**
 * Wrapper component for RetainerDetails to work with React Router
 * Use this in your dashboard routes
 *
 * @param {boolean} editMode - Whether to open in edit mode initially
 */
export const RetainerDetailsPage = ({ editMode = false }) => {
  const { matterId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    // Navigate back to retainer list
    navigate("/dashboard/matters/retainers");
  };

  return (
    <RetainerDetails
      matterId={matterId}
      onClose={handleClose}
      initialEditMode={editMode}
    />
  );
};

// Export both components as default for easy importing
export default {
  CreateRetainerPage,
  RetainerDetailsPage,
};
