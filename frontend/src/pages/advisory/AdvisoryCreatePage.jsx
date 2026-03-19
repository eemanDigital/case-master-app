import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { message } from "antd";
import AdvisoryDetailForm from "../../components/advisory/AdvisoryDetailForm";
import LoadingScreen from "../../components/common/LoadingScreen";
import PageHeader from "../../components/common/PageHeader";
import MatterContextCard from "../../components/common/MatterContextCard";
import {
  createAdvisoryDetails,
  selectAdvisoryLoading,
} from "../../redux/features/advisory/advisorySlice";
import { getMatter } from "../../redux/features/matter/matterSlice";
import { ADVISORY_LOADING_KEYS } from "../../utils/advisoryConstants";

const AdvisoryCreatePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { matterId } = useParams();
  const loading = useSelector(selectAdvisoryLoading(ADVISORY_LOADING_KEYS.UPDATE_DETAILS));
  const { currentMatter, isLoading: matterLoading } = useSelector((state) => state.matter);

  useEffect(() => {
    if (!matterId) {
      const returnPath = `/dashboard/matters/advisory/:matterId/create`;
      navigate(
        `/dashboard/matters/create?type=advisory&returnTo=${encodeURIComponent(returnPath)}`,
      );
      return;
    }
    dispatch(getMatter(matterId));
  }, [matterId, dispatch, navigate]);

  const handleSubmit = async (values) => {
    try {
      const result = await dispatch(createAdvisoryDetails({ matterId, data: values }));

      if (result.meta.requestStatus === "fulfilled") {
        message.success("Advisory created successfully");
        navigate(`/dashboard/matters/advisory/${matterId}/details`);
      } else {
        message.error("Failed to create advisory");
      }
    } catch (error) {
      message.error(error?.message || "Error creating advisory");
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
        title="Create Advisory Details"
        subtitle={`Adding advisory details for ${currentMatter.matterNumber || "Matter"}`}
        showBack
        backPath="/dashboard/matters/advisory"
      />

      <div className="max-w-6xl mx-auto p-6">
        <MatterContextCard matter={currentMatter} />
        <AdvisoryDetailForm
          mode="create"
          matterId={matterId}
          onSubmit={handleSubmit}
          loading={loading}
          matterData={currentMatter}
        />
      </div>
    </div>
  );
};

export default AdvisoryCreatePage;
