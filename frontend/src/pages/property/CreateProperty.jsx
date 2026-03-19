import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import PropertyForm from "../../components/property/PropertyForm";
import LoadingScreen from "../../components/common/LoadingScreen";
import PageHeader from "../../components/common/PageHeader";
import MatterContextCard from "../../components/common/MatterContextCard";
import {
  createPropertyDetails,
  selectActionLoading,
} from "../../redux/features/property/propertySlice";
import { getMatter } from "../../redux/features/matter/matterSlice";

const CreateProperty = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();
  const loading = useSelector(selectActionLoading);
  const { currentMatter, isLoading: matterLoading } = useSelector((state) => state.matter);

  useEffect(() => {
    if (!matterId) {
      const returnPath = `/dashboard/matters/property/:matterId/create`;
      navigate(
        `/dashboard/matters/create?type=property&returnTo=${encodeURIComponent(returnPath)}`,
      );
      return;
    }
    dispatch(getMatter(matterId));
  }, [matterId, dispatch, navigate]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(createPropertyDetails({ matterId, data: values })).unwrap();
      message.success("Property details created successfully");
      navigate(`/dashboard/matters/property/${matterId}/details`);
    } catch (error) {
      console.error("Failed to create property details:", error);
      message.error(error?.message || "Failed to create property details");
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
        title="Create Property Details"
        subtitle={`Adding property details for ${currentMatter.matterNumber || "Matter"}`}
        showBack
        backPath="/dashboard/matters/property"
      />

      <div className="max-w-6xl mx-auto p-6">
        <MatterContextCard matter={currentMatter} />
        <PropertyForm
          onSubmit={handleSubmit}
          loading={loading}
          mode="create"
          matterData={currentMatter}
        />
      </div>
    </div>
  );
};

export default CreateProperty;
