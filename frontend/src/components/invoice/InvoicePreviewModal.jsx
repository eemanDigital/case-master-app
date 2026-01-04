// components/invoice/InvoicePreviewModal.jsx - FIXED VERSION
import React, { useEffect, useState } from "react";
import {
  Modal,
  Card,
  Descriptions,
  Divider,
  Typography,
  Tag,
  Spin,
} from "antd";
import {
  calculateInvoiceTotals,
  formatCurrency,
  formatBillingMethodDisplay,
} from "../../utils/invoiceCalculations";

const { Text, Title } = Typography;

const InvoicePreviewModal = ({
  visible,
  onClose,
  formValues,
  clientOptions = [],
  casesOptions = [],
}) => {
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);

  // Recalculate when modal opens or formValues change
  useEffect(() => {
    if (visible) {
      setLoading(true);
      const timer = setTimeout(() => {
        try {
          const calculatedTotals = calculateInvoiceTotals(formValues);
          setTotals(calculatedTotals);
        } catch (error) {
          console.error("Preview calculation error:", error);
          setTotals({
            servicesWithAmounts: [],
            servicesTotal: 0,
            expensesTotal: 0,
            subtotal: 0,
            discountAmount: 0,
            taxAmount: 0,
            total: 0,
          });
        } finally {
          setLoading(false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [visible, formValues]);

  const getClientName = () => {
    const client = clientOptions.find((c) => c.value === formValues?.client);
    return client?.label || "Not selected";
  };

  const getCaseName = () => {
    if (!formValues?.case) return "Not linked to case";
    const caseItem = casesOptions.find((c) => c.value === formValues.case);
    return caseItem?.label || formValues.case;
  };

  if (loading) {
    return (
      <Modal
        title="Invoice Preview"
        open={visible}
        onCancel={onClose}
        width={900}
        footer={null}>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="Calculating invoice..." />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Title level={4} className="mb-0">
            Invoice Preview
          </Title>
          <Tag color="blue">Draft</Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      destroyOnClose>
      {/* Basic Information */}
      <Card className="mb-4" size="small">
        <Descriptions title="Invoice Details" column={2} bordered>
          <Descriptions.Item label="Client" span={2}>
            <Text strong>{getClientName()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Case" span={2}>
            {getCaseName()}
          </Descriptions.Item>
          <Descriptions.Item label="Title" span={2}>
            <Text strong>{formValues?.title || "Not provided"}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {formValues?.description || "No description"}
          </Descriptions.Item>
          <Descriptions.Item label="Due Date">
            {formValues?.dueDate?.format?.("MMMM DD, YYYY") || "Not set"}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Terms">
            {formValues?.paymentTerms || "Net 30 days"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Services Section */}
      {totals?.servicesWithAmounts?.length > 0 && (
        <Card title="Services Rendered" className="mb-4" size="small">
          <div className="space-y-3">
            {totals.servicesWithAmounts.map((service, index) => (
              <div
                key={index}
                className="flex justify-between items-start border-b pb-3 last:border-b-0">
                <div className="flex-1">
                  <div className="font-semibold text-base">
                    {service.description}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatBillingMethodDisplay(service)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Category:{" "}
                    <span className="capitalize">
                      {service.category?.replace("_", " ")}
                    </span>
                    {service.date && (
                      <span className="ml-2">
                        • Date:{" "}
                        {typeof service.date === "string"
                          ? new Date(service.date).toLocaleDateString()
                          : service.date?.format?.("MMM DD, YYYY") ||
                            "Not specified"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-lg text-blue-600">
                    {formatCurrency(service.amount)}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t-2 font-bold text-lg">
              <span>Services Subtotal:</span>
              <span className="text-blue-600">
                {formatCurrency(totals.servicesTotal)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Expenses Section */}
      {formValues?.expenses?.length > 0 && (
        <Card title="Expenses" className="mb-4" size="small">
          <div className="space-y-3">
            {formValues.expenses.map((expense, index) => (
              <div
                key={index}
                className="flex justify-between items-start border-b pb-3 last:border-b-0">
                <div className="flex-1">
                  <div className="font-semibold text-base">
                    {expense.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="capitalize">
                      {expense.category?.replace("_", " ")}
                    </span>
                    {expense.receiptNumber && (
                      <span className="ml-2">
                        • Receipt: {expense.receiptNumber}
                      </span>
                    )}
                    <span className="ml-2">
                      •{" "}
                      {expense.isReimbursable
                        ? "Reimbursable"
                        : "Non-reimbursable"}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-lg text-green-600">
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t-2 font-bold text-lg">
              <span>Expenses Subtotal:</span>
              <span className="text-green-600">
                {formatCurrency(totals?.expensesTotal || 0)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Financial Summary */}
      <Card title="Financial Summary" className="bg-gray-50" size="small">
        <div className="space-y-3">
          {totals?.servicesTotal > 0 && (
            <div className="flex justify-between text-base">
              <span>Services Total:</span>
              <span className="font-semibold">
                {formatCurrency(totals.servicesTotal)}
              </span>
            </div>
          )}

          {totals?.expensesTotal > 0 && (
            <div className="flex justify-between text-base">
              <span>Expenses Total:</span>
              <span className="font-semibold">
                {formatCurrency(totals.expensesTotal)}
              </span>
            </div>
          )}

          {formValues?.previousBalance > 0 && (
            <div className="flex justify-between text-base">
              <span>Previous Balance:</span>
              <span className="font-semibold">
                {formatCurrency(formValues.previousBalance)}
              </span>
            </div>
          )}

          <Divider className="my-3" />

          <div className="flex justify-between text-base font-semibold">
            <span>Subtotal:</span>
            <span>{formatCurrency(totals?.subtotal || 0)}</span>
          </div>

          {totals?.discountAmount > 0 && (
            <div className="flex justify-between text-base text-green-600">
              <span>
                Discount
                {formValues?.discountType === "percentage" &&
                  ` (${formValues?.discount}%)`}
                {formValues?.discountReason &&
                  ` - ${formValues.discountReason}`}
                :
              </span>
              <span className="font-semibold">
                -{formatCurrency(totals.discountAmount)}
              </span>
            </div>
          )}

          {totals?.taxAmount > 0 && (
            <div className="flex justify-between text-base">
              <span>Tax ({formValues?.taxRate || 0}%):</span>
              <span className="font-semibold">
                {formatCurrency(totals.taxAmount)}
              </span>
            </div>
          )}

          <Divider className="my-3" />

          <div className="flex justify-between text-xl font-bold">
            <span>Invoice Total:</span>
            <span className="text-blue-600">
              {formatCurrency(totals?.total || 0)}
            </span>
          </div>

          {formValues?.notes && (
            <>
              <Divider className="my-3" />
              <div>
                <Text strong>Notes:</Text>
                <div className="mt-2 text-gray-600">{formValues.notes}</div>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <Text type="secondary" className="text-sm">
          <strong>Note:</strong> This is a preview. The actual invoice will be
          calculated by the system and may include additional formatting.
        </Text>
      </div>
    </Modal>
  );
};

export default InvoicePreviewModal;
