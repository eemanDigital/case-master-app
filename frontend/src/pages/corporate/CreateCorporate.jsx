import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, message } from "antd";
import CorporateForm from "../../components/corporate/CorporateForm";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  createCorporateDetails,
  selectActionLoading,
} from "../../redux/features/corporate/corporateSlice";

const CreateCorporate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();
  const loading = useSelector(selectActionLoading);

  // Check if matterId exists (should come from Matter creation)
  useEffect(() => {
    if (!matterId) {
      message.error("Matter ID is required");
      const returnPath = `/dashboard/matters/corporate/:matterId/create`;
      navigate(
        `/dashboard/matters/create?type=corporate&returnTo=${encodeURIComponent(returnPath)}`,
      );
    }
  }, [matterId, navigate]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(
        createCorporateDetails({ matterId, data: values }),
      ).unwrap();

      // Navigate to details page
      navigate(`/dashboard/matters/corporate/${matterId}`);
    } catch (error) {
      console.error("Failed to create corporate details:", error);
    }
  };

  if (!matterId) {
    return <LoadingScreen />;
  }

  return (
    <div className="create-corporate">
      <Card title="Create Corporate Matter Details" className="mb-6">
        <CorporateForm
          onSubmit={handleSubmit}
          loading={loading}
          mode="create"
        />
      </Card>
    </div>
  );
};

export default CreateCorporate;
