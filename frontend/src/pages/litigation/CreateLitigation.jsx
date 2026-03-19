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
import { getMatter } from "../../redux/features/matter/matterSlice";

const CreateLitigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { matterId } = useParams();
  const loading = useSelector(selectActionLoading);
  const { currentMatter, isLoading: matterLoading } = useSelector((state) => state.matter);

  useEffect(() => {
    if (!matterId) {
      const returnPath = `/dashboard/matters/litigation/:matterId/create`;
      navigate(
        `/dashboard/matters/create?type=litigation&returnTo=${encodeURIComponent(returnPath)}`,
        {
          state: { from: location.pathname },
        },
      );
      return;
    }
    dispatch(getMatter(matterId));
  }, [matterId, navigate, location.pathname, dispatch]);

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

  if (!matterId || matterLoading) {
    return <LoadingScreen tip="Loading matter details..." fullScreen />;
  }

  if (!currentMatter) {
    return <LoadingScreen tip="Fetching matter data..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Create Litigation Details"
        subtitle={`Adding litigation details for ${currentMatter.matterNumber || "Matter"}`}
        showBack
        backPath="/dashboard/matters/litigation"
      />

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <LitigationForm
            mode="create"
            onSubmit={handleSubmit}
            loading={loading}
            matterData={currentMatter}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateLitigation;
