// pages/advisory/AdvisoryCreatePage.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";

import AdvisoryDetailForm from "../../components/advisory/AdvisoryDetailForm";
import {
  createAdvisoryDetails,
  selectAdvisoryLoading,
} from "../../redux/features/advisory/advisorySlice";
import { ADVISORY_LOADING_KEYS } from "../../utils/advisoryConstants";

const AdvisoryCreatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();
  const loading = useSelector(
    selectAdvisoryLoading(ADVISORY_LOADING_KEYS.UPDATE_DETAILS),
  );
  const firmId = useSelector((state) => state.auth.user?.firmId);

  const handleSubmit = async (values) => {
    try {
      const result = await dispatch(
        createAdvisoryDetails({ matterId, data: values }),
      );

      if (result.meta.requestStatus === "fulfilled") {
        message.success("Advisory created successfully");
        navigate(`/dashboard/matters/advisory/${matterId}/details`);
      } else {
        message.error("Failed to create advisory");
      }
    } catch (error) {
      message.error("Error creating advisory");
    }
  };

  return (
    <div className="page-container">
      <AdvisoryDetailForm
        mode="create"
        matterId={matterId}
        firmId={firmId}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default AdvisoryCreatePage;
