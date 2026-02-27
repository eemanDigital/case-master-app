import { useState, useCallback, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import moment from "moment-timezone";
import {
  Button,
  Form,
  Divider,
  Typography,
  Card,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Input,
} from "antd";
import { paymentInitialValue } from "../utils/initialValues";
import useMattersSelectOptions from "../hooks/useMattersSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import useInvoiceRefSelectOptions from "../hooks/useInvoiceRefSelectOptions";
import { PlusOutlined } from "@ant-design/icons";
import { methodOptions, paymentStatusOptions } from "../data/options";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import ButtonWithIcon from "../components/ButtonWithIcon";

const { TextArea } = Input;

const CreatePaymentForm = ({
  invoiceId,
  clientId,
  matterId,
  otherActivity,
  invoiceNumber,
  currentBalance,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState(paymentInitialValue);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [linkType, setLinkType] = useState("matter");
  const [form] = Form.useForm();
  const { fetchData } = useDataGetterHook();
  const { dataFetcher, loading } = useDataFetch();
  const { mattersOptions, loading: mattersLoading } = useMattersSelectOptions({
    status: "active",
    limit: 100,
  });
  const { clientOptions } = useClientSelectOptions();
  const { invoiceRefOptions } = useInvoiceRefSelectOptions();
  const { open, showModal, handleOk, handleCancel: closeModal } = useModal();

  useEffect(() => {
    if (invoiceId) {
      const selected = invoiceRefOptions.find((opt) => opt.value === invoiceId);
      if (selected) {
        setSelectedInvoice(selected);
        form.setFieldsValue({
          invoice: invoiceId,
          client: clientId,
          matter: matterId,
          otherActivity: otherActivity,
        });
      }
    }
  }, [invoiceId, clientId, matterId, otherActivity, invoiceRefOptions, form]);

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return;
    }

    const paymentData = {
      invoice: values.invoice,
      client: values.client,
      matter: values.matter || undefined,
      otherActivity: values.otherActivity || undefined,
      amount: values.amount,
      method: values.method,
      paymentDate: values.paymentDate
        ? values.paymentDate.toISOString()
        : new Date().toISOString(),
      reference: values.reference || "",
      notes: values.notes || "",
      status: values.status || "completed",
      transactionId: values.transactionId || "",
    };

    const result = await dataFetcher("payments", "POST", paymentData);
    await fetchData("payments", "payments");

    if (result?.error) {
      toast.error("Submission Failed: " + (result?.error || result));
    } else {
      toast.success("Payment recorded successfully!");
      if (onSuccess) {
        onSuccess();
      }
      form.resetFields();
      setSelectedInvoice(null);
    }
  }, [form, dataFetcher, fetchData, onSuccess]);

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  const handleInvoiceChange = (invoiceId) => {
    if (invoiceId) {
      const selected = invoiceRefOptions.find(
        (option) => option.value === invoiceId
      );
      if (selected) {
        setSelectedInvoice(selected);
        form.setFieldsValue({
          client: selected.clientId,
          matter: selected.matterId,
          otherActivity: selected.otherActivity,
        });
      }
    } else {
      setSelectedInvoice(null);
      form.setFieldsValue({
        client: undefined,
        matter: undefined,
        otherActivity: undefined,
      });
    }
  };

  const requiredRule = [{ required: true, message: "This field is required" }];

  return (
    <>
      <ButtonWithIcon
        onClick={showModal}
        icon={<PlusOutlined className="mr-2" />}
        text="Record Payment"
      />

      <Form layout="vertical" form={form} name="payment form">
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Record Payment</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="invoice"
                label="Invoice"
                rules={requiredRule}
                initialValue={invoiceId || formData?.invoice}>
                <Select
                  placeholder="Select invoice"
                  showSearch
                  filterOption={filterOption}
                  options={invoiceRefOptions.map((option) => ({
                    value: option.value,
                    label: option.label || option.invoiceNumber,
                  }))}
                  allowClear
                  onChange={handleInvoiceChange}
                  disabled={!!invoiceId}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="client"
                label="Client"
                initialValue={clientId || formData?.client}>
                <Select
                  placeholder="Client will be auto-filled from invoice"
                  showSearch
                  filterOption={filterOption}
                  options={clientOptions}
                  allowClear
                  disabled={!!invoiceId}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="linkType"
                label="Link To"
                initialValue="matter">
                <Select
                  onChange={(value) => {
                    setLinkType(value);
                    if (value === "matter") {
                      form.setFieldsValue({ otherActivity: "" });
                    } else {
                      form.setFieldsValue({ matter: null });
                    }
                  }}>
                  <Select.Option value="matter">Matter</Select.Option>
                  <Select.Option value="other">Other Activity</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {linkType === "matter" ? (
              <Col xs={24} md={12}>
                <Form.Item
                  name="matter"
                  label="Matter"
                  initialValue={matterId || formData?.matter}>
                  <Select
                    placeholder="Matter (optional)"
                    showSearch
                    filterOption={filterOption}
                    options={mattersOptions}
                    allowClear
                    loading={mattersLoading}
                    disabled={!!invoiceId}
                  />
                </Form.Item>
              </Col>
            ) : (
              <Col xs={24} md={12}>
                <Form.Item
                  name="otherActivity"
                  label="Other Activity"
                  initialValue={otherActivity || formData?.otherActivity}>
                  <Input placeholder="e.g., Contract Review, Legal Advisory, etc." />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={12}>
              <Form.Item
                name="amount"
                label="Payment Amount"
                rules={[
                  ...requiredRule,
                  {
                    type: "number",
                    min: 0.01,
                    message: "Amount must be greater than 0",
                  },
                ]}
                initialValue={formData?.amount}>
                <InputNumber
                  className="w-full"
                  min={0.01}
                  step={0.01}
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="paymentDate"
                label="Payment Date"
                rules={requiredRule}
                initialValue={
                  formData?.paymentDate
                    ? moment(formData.paymentDate).local()
                    : moment()
                }>
                <DatePicker
                  className="w-full"
                  format="YYYY-MM-DD"
                  disabledDate={(current) =>
                    current && current > moment().endOf("day")
                  }
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="method"
                label="Payment Method"
                rules={requiredRule}
                initialValue={formData?.method || "bank_transfer"}>
                <Select
                  placeholder="Select payment method"
                  options={methodOptions}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Payment Status"
                initialValue="completed">
                <Select
                  placeholder="Select payment status"
                  options={paymentStatusOptions}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="reference"
                label="Payment Reference"
                initialValue={formData?.reference}>
                <Input placeholder="e.g., BT-20240115-001, CHQ-789456" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="transactionId"
                label="Transaction ID"
                initialValue={formData?.transactionId}>
                <Input placeholder="Bank transaction ID, cheque number, etc." />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="notes"
                label="Notes"
                initialValue={formData?.notes}>
                <TextArea
                  rows={3}
                  placeholder="Additional notes about this payment..."
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedInvoice && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Typography.Text strong className="text-blue-700">
                Invoice Information:
              </Typography.Text>
              <div className="mt-2 text-sm text-gray-600">
                <div>Invoice: {selectedInvoice.label}</div>
                {selectedInvoice.balance && (
                  <div>
                    Current Balance: ₦{selectedInvoice.balance.toLocaleString()}
                  </div>
                )}
                {selectedInvoice.total && (
                  <div>
                    Invoice Total: ₦{selectedInvoice.total.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        <Divider />
        <Form.Item className="text-right mb-0">
          <Button
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                closeModal();
              }
              form.resetFields();
              setSelectedInvoice(null);
            }}
            className="mr-2">
            Cancel
          </Button>
          <Button
            loading={loading}
            onClick={onSubmit}
            type="primary"
            htmlType="submit"
            size="large">
            Record Payment
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default CreatePaymentForm;
