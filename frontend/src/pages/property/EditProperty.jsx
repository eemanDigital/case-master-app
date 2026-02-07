import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, Spin, message, Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import PropertyForm from "../../components/property/PropertyForm";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  fetchPropertyDetails,
  updatePropertyDetails,
  selectSelectedDetails,
  selectDetailsLoading,
  selectActionLoading,
} from "../../redux/features/property/propertySlice";

const EditProperty = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();

  const details = useSelector(selectSelectedDetails);
  const detailsLoading = useSelector(selectDetailsLoading);
  const actionLoading = useSelector(selectActionLoading);

  useEffect(() => {
    if (!matterId) {
      message.error("Matter ID is required");
      navigate("/dashboard/matters/property");
      return;
    }

    dispatch(fetchPropertyDetails(matterId));
  }, [matterId, dispatch, navigate]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(
        updatePropertyDetails({ matterId, data: values }),
      ).unwrap();

      message.success("Property details updated successfully");
      navigate(`/dashboard/matters/property/${matterId}`);
    } catch (error) {
      console.error("Failed to update property details:", error);
      message.error(error?.message || "Failed to update property details");
    }
  };

  const handleBack = () => {
    navigate(`/dashboard/matters/property/${matterId}`);
  };

  if (detailsLoading) {
    return <LoadingScreen />;
  }

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500 mb-4">Property details not found</p>
        <Button onClick={() => navigate("/dashboard/matters/property")}>
          Back to Property List
        </Button>
      </div>
    );
  }

  return (
    <div className="edit-property">
      <div className="mb-6">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            size="large">
            Back to Details
          </Button>
        </Space>
      </div>

      <Card
        title={<div className="text-xl font-bold">Edit Property Details</div>}
        className="mb-6">
        <PropertyForm
          initialValues={details}
          onSubmit={handleSubmit}
          loading={actionLoading}
          mode="edit"
        />
      </Card>
    </div>
  );
};

export default EditProperty;
