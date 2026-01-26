import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spin, Alert, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import MatterForm from "../../components/matters/MatterForm";
import { useMatters } from "../../hooks/useMatters";

const EditMatterPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    fetchMatterById,
    updateMatter,
    loading: updateLoading,
  } = useMatters();

  useEffect(() => {
    loadMatter();
  }, [id]);

  const loadMatter = async () => {
    try {
      setLoading(true);
      const matter = await fetchMatterById(id, true);

      if (matter) {
        // Transform the data for the form
        const formValues = {
          ...matter,
          client: matter.client?._id,
          accountOfficer: matter.accountOfficer?.map((officer) => officer._id),
        };

        setInitialValues(formValues);
      } else {
        setError("Matter not found");
      }
    } catch (err) {
      setError("Failed to load matter details");
      console.error("Error loading matter:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      await updateMatter(id, data);
      navigate(`/matters/${id}`);
    } catch (error) {
      console.error("Failed to update matter:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={() => navigate("/matters")}>
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Matter</h1>
        <p className="text-gray-600">Update the matter details below</p>
      </div>

      <Card>
        <MatterForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          loading={updateLoading}
          mode="edit"
        />
      </Card>
    </div>
  );
};

export default EditMatterPage;
