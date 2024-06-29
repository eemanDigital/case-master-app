import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Descriptions, Button, Card, Spin, Alert, Modal } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import useModal from "../hooks/useModal";

const PaymentMadeOnCase = ({ clientId, caseId }) => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal();

  const navigate = useNavigate();

  useEffect(() => {
    if (clientId && caseId) {
      dataFetcher(
        `payments/totalPaymentSum/client/${clientId}/case/${caseId}`,
        "GET"
      );
    }
  }, [clientId, caseId]);

  if (loading) return <Spin tip="Loading..." />;
  if (error)
    return (
      <Alert
        message="Error"
        description={error.message}
        type="error"
        showIcon
      />
    );

  const paymentAmount = data?.data ? data.data : 0;

  return (
    <>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
      <Button type="primary" onClick={showModal} className="mx-2 bg-blue-500">
        Payment made on case
      </Button>

      <Modal
        title="Payment Details on Case"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}>
        <Card className="text-black w-[100%] mt-4" bordered={false}>
          <Descriptions
            bordered
            column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
            size="middle">
            <Descriptions.Item label="Total Payment">
              ₦{paymentAmount?.toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Modal>
    </>
  );
};

export default PaymentMadeOnCase;
