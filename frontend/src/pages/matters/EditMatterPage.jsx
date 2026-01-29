import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spin, Alert, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import MatterForm from "../../components/matters/MatterForm";
import { getMatter, updateMatter } from "../../features/matter/matterSlice";

const EditMatterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentMatter, isLoading, isError, message } = useSelector(
    (state) => state.matter,
  );

  // Fetch matter once
  useEffect(() => {
    if (id) {
      dispatch(getMatter(id));
    }
  }, [id, dispatch]);

  // Prepare form values safely
  const initialValues = useMemo(() => {
    if (!currentMatter) return null;

    return {
      ...currentMatter,
      client: currentMatter.client?._id,
      accountOfficer: currentMatter.accountOfficer?.map(
        (officer) => officer._id,
      ),
    };
  }, [currentMatter]);

  const handleSubmit = async (data) => {
    if (!currentMatter?._id) return;

    await dispatch(
      updateMatter({
        matterId: currentMatter._id,
        matterData: data,
      }),
    ).unwrap();

    navigate(`/matters/${currentMatter._id}`);
  };

  // Loading
  if (isLoading && !currentMatter) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description={message || "Failed to load matter"}
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate("/matters")}>
              Back to Matters
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/matters/${id}`)}
          className="mb-4">
          Back to Matter
        </Button>

        <h1 className="text-2xl font-bold">Edit Matter</h1>
        <p className="text-gray-600">Update the matter details below</p>
      </div>

      <Card>
        {initialValues && (
          <MatterForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            loading={isLoading}
            mode="edit"
          />
        )}
      </Card>
    </div>
  );
};

export default EditMatterPage;
