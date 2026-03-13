import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, message, Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import PropertyForm from "../../components/property/PropertyForm";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  createPropertyDetails,
  selectActionLoading,
} from "../../redux/features/property/propertySlice";

const CreateProperty = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();
  const loading = useSelector(selectActionLoading);

  // Check if matterId exists (should come from Matter creation)
  useEffect(() => {
    if (!matterId) {
      message.error("Matter ID is required");
      const returnPath = `/dashboard/matters/property/:matterId/create`;
      navigate(
        `/dashboard/matters/create?type=property&returnTo=${encodeURIComponent(returnPath)}`,
      );
    }
  }, [matterId, navigate]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(
        createPropertyDetails({ matterId, data: values }),
      ).unwrap();

      // Navigate to details page
      navigate(`/dashboard/matters/property/${matterId}/details`);
    } catch (error) {
      console.error("Failed to create property details:", error);
    }
  };

  if (!matterId) {
    return <LoadingScreen />;
  }

  return (
    <div className="create-property">
      <div className="mb-6">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/dashboard/matters/property")}
            size="large">
            Back to Property List
          </Button>
        </Space>
      </div>

      <Card
        title={
          <div className="text-xl font-bold">
            Create Property Matter Details
          </div>
        }
        className="mb-6">
        <PropertyForm onSubmit={handleSubmit} loading={loading} mode="create" />
      </Card>
    </div>
  );
};

export default CreateProperty;
