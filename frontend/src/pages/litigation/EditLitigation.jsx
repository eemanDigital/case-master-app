import { React, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { message, Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import PageHeader from "../../components/common/PageHeader";
import LoadingScreen from "../../components/common/LoadingScreen";
import LitigationForm from "../../components/litigation/LitigationForm";
import {
  fetchLitigationDetails,
  updateLitigationDetails,
  selectSelectedDetails,
  selectDetailsLoading,
  selectActionLoading,
  clearSelectedMatter,
} from "../../redux/features/litigation/litigationSlice";

const { confirm } = Modal;

const EditLitigation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();

  const litigationDetails = useSelector(selectSelectedDetails);
  const detailsLoading = useSelector(selectDetailsLoading);
  const actionLoading = useSelector(selectActionLoading);

  // Track if form is dirty for unsaved changes warning
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    // Fetch litigation details
    dispatch(fetchLitigationDetails(matterId));

    // Cleanup on unmount
    return () => {
      dispatch(clearSelectedMatter());
    };
  }, [matterId, dispatch]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (formDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formDirty]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(
        updateLitigationDetails({
          matterId,
          data: values,
        }),
      ).unwrap();

      setFormDirty(false);
      message.success("Litigation details updated successfully");
      navigate(`/dashboard/matters/litigation/${matterId}`);
    } catch (error) {
      // Error is handled by Redux thunk
      console.error("Update litigation error:", error);
    }
  };

  const handleCancel = () => {
    if (formDirty) {
      confirm({
        title: "Unsaved Changes",
        icon: <ExclamationCircleOutlined />,
        content: "You have unsaved changes. Are you sure you want to leave?",
        okText: "Leave",
        okType: "danger",
        cancelText: "Stay",
        onOk: () => {
          navigate(`/litigation/${matterId}`);
        },
      });
    } else {
      navigate(`/litigation/${matterId}`);
    }
  };

  if (detailsLoading) {
    return <LoadingScreen tip="Loading litigation details..." fullScreen />;
  }

  if (!litigationDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Litigation Details Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            No litigation details exist for this matter yet.
          </p>
          <button
            onClick={() => navigate(`/litigation/${matterId}/create`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create Litigation Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Edit Litigation Details"
        subtitle={`Suit No: ${litigationDetails.suitNo}`}
        showBack
        backPath={`/dashboard/matters/litigation/${matterId}`}
      />

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <LitigationForm
            mode="edit"
            initialValues={litigationDetails}
            onSubmit={handleSubmit}
            loading={actionLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default EditLitigation;
