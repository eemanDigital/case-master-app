import { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import PageHeader from "../../components/common/PageHeader";
import LitigationForm from "../../components/litigation/LitigationForm";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  createLitigationDetails,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";

const CreateLitigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { matterId } = useParams();
  const loading = useSelector(selectActionLoading);

  // Check if matterId exists, if not redirect to matter creation
  useEffect(() => {
    if (!matterId) {
      // Redirect to matter creation with return path
      const returnPath = `/dashboard/matters/litigation/:matterId/create`;
      navigate(
        `/dashboard/matters/create?type=litigation&returnTo=${encodeURIComponent(returnPath)}`,
        {
          state: { from: location.pathname },
        },
      );
    }
  }, [matterId, navigate, location.pathname]);

  const handleSubmit = async (values) => {
    try {
      if (!matterId) {
        message.error("Matter ID is required. Redirecting...");
        return;
      }

      await dispatch(
        createLitigationDetails({
          matterId,
          data: values,
        }),
      ).unwrap();

      message.success("Litigation details created successfully");
      navigate(`/dashboard/matters/litigation/${matterId}`);
    } catch (error) {
      console.error("Create litigation error:", error);
      message.error(error?.message || "Failed to create litigation details");
    }
  };

  // If no matterId, show loading while redirecting
  if (!matterId) {
    return <LoadingScreen tip="Redirecting to matter creation..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Create Litigation Details"
        subtitle="Add litigation-specific information to the matter"
        showBack
        backPath="/dashboard/matters/litigation"
      />

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <LitigationForm
            mode="create"
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateLitigation;
