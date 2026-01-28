import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Modal, message } from "antd";
import MatterForm from "./MatterForm";
import {
  createMatter,
  updateMatter,
  getMatter,
  resetValidationErrors,
} from "../../../redux/features/matter/matterSlice";
import { formatMatterForForm } from "../../../utils/mattersFormatter";

const MatterFormContainer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const mode = id ? "edit" : "create";

  const { currentMatter, isLoading, validationErrors } = useSelector(
    (state) => state.matter,
  );

  // Fetch matter data for edit mode
  useEffect(() => {
    if (mode === "edit" && id) {
      dispatch(getMatter(id));
    }

    // Reset validation errors on mount
    return () => {
      dispatch(resetValidationErrors());
    };
  }, [dispatch, id, mode]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      console.log("Container received form data:", formData);

      // Validate required fields before submission
      if (!formData.matterType) {
        message.error("Matter type is required");
        return;
      }

      if (!formData.client) {
        message.error("Client is required");
        return;
      }

      if (!formData.accountOfficer || formData.accountOfficer.length === 0) {
        message.error("At least one account officer is required");
        return;
      }

      if (mode === "create") {
        const result = await dispatch(createMatter(formData)).unwrap();
        if (result) {
          message.success("Matter created successfully");
          navigate(`/matters/${result.data.matter._id}`);
        }
      } else {
        const result = await dispatch(
          updateMatter({
            matterId: id,
            matterData: formData,
          }),
        ).unwrap();

        if (result) {
          message.success("Matter updated successfully");
          navigate(`/matters/${id}`);
        }
      }
    } catch (error) {
      console.error("Submission error:", error);

      // Handle specific error messages
      if (error?.message) {
        message.error(error.message);
      } else if (error?.data?.message) {
        message.error(error.data.message);
      } else {
        message.error("An error occurred while saving the matter");
      }
    }
  };

  const handleCancel = () => {
    Modal.confirm({
      title: "Are you sure?",
      content: "All unsaved changes will be lost.",
      okText: "Yes",
      cancelText: "No",
      onOk: () => {
        navigate(-1);
      },
    });
  };

  // Format initial values for the form
  const initialValues =
    mode === "edit" && currentMatter ? formatMatterForForm(currentMatter) : {};

  return (
    <MatterForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      loading={isLoading}
      mode={mode}
      onCancel={handleCancel}
      apiErrors={validationErrors}
      key={currentMatter?._id || "create"}
    />
  );
};

export default MatterFormContainer;
