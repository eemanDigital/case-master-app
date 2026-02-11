// pages/advisory/AdvisoryEditPage.jsx
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { message, Spin } from "antd";

import AdvisoryDetailForm from "../../components/advisory/AdvisoryDetailForm";
import {
  fetchAdvisoryDetails,
  updateAdvisoryDetails,
  selectAdvisoryLoading,
} from "../../redux/features/advisory/advisorySlice";
import { ADVISORY_LOADING_KEYS } from "../../utils/advisoryConstants";

const AdvisoryEditPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();

  // const loading = useSelector((state) => state.advisory.loading);
  const loading = useSelector(
    selectAdvisoryLoading(ADVISORY_LOADING_KEYS.UPDATE_DETAILS),
  );
  const detail = useSelector((state) => state.advisory.currentDetail);
  const firmId = useSelector((state) => state.auth.user?.firmId);

  console.log(loading);

  useEffect(() => {
    dispatch(fetchAdvisoryDetails(matterId));
  }, [dispatch, matterId]);

  const handleSubmit = async (values) => {
    try {
      const result = await dispatch(
        updateAdvisoryDetails({ matterId, data: values }),
      );

      if (result.meta.requestStatus === "fulfilled") {
        message.success("Advisory updated successfully");
        navigate(`/dashboard/matters/advisory/${matterId}/details`);
      } else {
        message.error("Failed to update advisory");
      }
    } catch (error) {
      message.error("Error updating advisory");
    }
  };

  if (loading && !detail) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <AdvisoryDetailForm
        mode="edit"
        initialData={detail}
        matterId={matterId}
        firmId={firmId}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
};

export default AdvisoryEditPage;
