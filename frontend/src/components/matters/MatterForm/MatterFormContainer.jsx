import React, { useEffect } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const mode = id ? "edit" : "create";

  // Get query parameters
  const typeParam = searchParams.get("type"); // e.g., "litigation"
  const returnToParam = searchParams.get("returnTo"); // e.g., "/dashboard/matters/litigation/:matterId/create"

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

      // If typeParam is provided, set it in formData
      if (typeParam && !formData.matterType) {
        formData.matterType = typeParam;
      }

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

          const createdMatterId = result.data.matter._id;

          // Check if there's a returnTo path
          if (returnToParam) {
            // Replace :matterId placeholder with actual ID
            const redirectPath = returnToParam.replace(
              ":matterId",
              createdMatterId,
            );
            navigate(redirectPath);
          } else {
            // Default navigation based on matter type
            switch (formData.matterType) {
              case "litigation":
                navigate(
                  `/dashboard/matters/litigation/${createdMatterId}/create`,
                );
                break;
              case "corporate":
                navigate(
                  `/dashboard/matters/corporate/${createdMatterId}/create`,
                );
                break;
              case "advisory":
                navigate(
                  `/dashboard/matters/advisory/${createdMatterId}/create`,
                );
                break;
              case "property":
                navigate(
                  `/dashboard/matters/property/${createdMatterId}/create`,
                );
                break;
              case "retainer":
                navigate(
                  `/dashboard/matters/retainer/${createdMatterId}/create`,
                );
                break;
              case "general":
                navigate(
                  `/dashboard/matters/general/${createdMatterId}/create`,
                );
                break;
              default:
                navigate(`/dashboard/matters/${createdMatterId}`);
            }
          }
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
          navigate(`/dashboard/matters/${id}`);
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
        // Navigate back or to matters list
        if (location.state?.from) {
          navigate(location.state.from);
        } else if (typeParam) {
          // If came from specific type, go back to that list
          navigate(`/dashboard/matters/${typeParam}`);
        } else {
          navigate("/dashboard/matters");
        }
      },
    });
  };

  // Format initial values for the form
  const initialValues =
    mode === "edit" && currentMatter
      ? formatMatterForForm(currentMatter)
      : typeParam
        ? { matterType: typeParam } // Pre-fill matter type if provided
        : {};

  return (
    <MatterForm
      initialValues={initialValues}
      onSubmit={handleSubmit}
      loading={isLoading}
      mode={mode}
      onCancel={handleCancel}
      apiErrors={validationErrors}
      key={currentMatter?._id || "create"}
      presetMatterType={typeParam} // Pass as prop to disable matter type field
    />
  );
};

export default MatterFormContainer;
