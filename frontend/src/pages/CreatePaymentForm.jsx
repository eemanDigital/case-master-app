import { useState, useCallback } from "react";
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
  Modal,
  Input,
} from "antd";
import { paymentInitialValue } from "../utils/initialValues";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import useInvoiceRefSelectOptions from "../hooks/useInvoiceRefSelectOptions";
import { PlusOutlined } from "@ant-design/icons";
import { methodOptions, paymentStatusOptions } from "../data/options";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import ButtonWithIcon from "../components/ButtonWithIcon";

const { TextArea } = Input;

const CreatePaymentForm = () => {
  const [formData, setFormData] = useState(paymentInitialValue);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [form] = Form.useForm();
  const { fetchData } = useDataGetterHook();
  const { dataFetcher, loading } = useDataFetch();
  const { casesOptions } = useCaseSelectOptions();
  const { clientOptions } = useClientSelectOptions();
  const { invoiceRefOptions } = useInvoiceRefSelectOptions();
  const { open, showModal, handleOk, handleCancel } = useModal();

  // Function to handle form submission
  const onSubmit = useCallback(async () => {
    let values;
    try {
      // Validate form fields
      values = await form.validateFields();
    } catch (errorInfo) {
      // Exit if validation fails
      return;
    }

    // Format the data according to the new schema
    const paymentData = {
      invoice: values.invoice,
      client: values.client,
      case: values.case,
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

    // Submit form data
    const result = await dataFetcher("payments", "POST", paymentData);
    // Fetch updated data
    await fetchData("payments", "payments");

    // Handle the result of the submission
    if (result?.error) {
      // Display error message if submission failed
      toast.error("Submission Failed: " + (result?.error || result));
    } else {
      // Display success message if submission succeeded
      toast.success("Payment recorded successfully!");
      handleCancel();
      // Reset form fields
      form.resetFields();
      setSelectedInvoice(null);
    }
  }, [form, dataFetcher, fetchData, handleCancel]);

  // Function to filter options in select inputs
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // Handle invoice selection to auto-populate client and case
  // const handleInvoiceChange = (invoiceId) => {
  //   if (invoiceId) {
  //     // Find the selected invoice from options to get client and case info
  //     const selected = invoiceRefOptions.find(
  //       (option) => option.value === invoiceId
  //     );
  //     if (selected) {
  //       setSelectedInvoice(selected);
  //       // Auto-populate client and case if available in the option data
  //       form.setFieldsValue({
  //         client: selected.clientId,
  //         case: selected.caseId,
  //       });
  //     }
  //   } else {
  //     setSelectedInvoice(null);
  //     form.setFieldsValue({
  //       client: undefined,
  //       case: undefined,
  //     });
  //   }
  // };

  // Handle invoice selection to auto-populate client and case
  const handleInvoiceChange = (invoiceId) => {
    if (invoiceId) {
      // Find the selected invoice from options to get client and case info
      const selected = invoiceRefOptions.find(
        (option) => option.value === invoiceId
      );
      if (selected) {
        setSelectedInvoice(selected);
        // Auto-populate client and case if available in the option data
        form.setFieldsValue({
          client: selected.clientId,
          case: selected.caseId,
        });
      }
    } else {
      setSelectedInvoice(null);
      form.setFieldsValue({
        client: undefined,
        case: undefined,
      });
    }
  };

  // Validation rule for required fields
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
            {/* Invoice Selection */}
            <Col xs={24} md={12}>
              <Form.Item
                name="invoice"
                label="Invoice"
                rules={requiredRule}
                initialValue={formData?.invoice}>
                <Select
                  placeholder="Select invoice"
                  showSearch
                  filterOption={filterOption}
                  options={invoiceRefOptions.map((option) => ({
                    value: option.value, // This is now the _id (ObjectId)
                    label: option.label || option.invoiceNumber, // Display invoice number
                  }))}
                  allowClear
                  onChange={handleInvoiceChange}
                />
              </Form.Item>
            </Col>

            {/* Client (auto-populated from invoice) */}
            <Col xs={24} md={12}>
              <Form.Item
                name="client"
                label="Client"
                initialValue={formData?.client}>
                <Select
                  placeholder="Client will be auto-filled from invoice"
                  showSearch
                  filterOption={filterOption}
                  options={clientOptions}
                  allowClear
                  disabled={!!selectedInvoice}
                />
              </Form.Item>
            </Col>

            {/* Case (auto-populated from invoice) */}
            <Col xs={24} md={12}>
              <Form.Item name="case" label="Case" initialValue={formData?.case}>
                <Select
                  placeholder="Case will be auto-filled from invoice"
                  showSearch
                  filterOption={filterOption}
                  options={casesOptions}
                  allowClear
                  disabled={!!selectedInvoice}
                />
              </Form.Item>
            </Col>

            {/* Payment Amount */}
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

            {/* Payment Date */}
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

            {/* Payment Method */}
            <Col xs={24} md={12}>
              <Form.Item
                name="method"
                label="Payment Method"
                rules={requiredRule}
                initialValue={formData?.method}>
                <Select
                  placeholder="Select payment method"
                  options={methodOptions}
                  allowClear
                />
              </Form.Item>
            </Col>

            {/* Payment Status */}
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

            {/* Transaction Reference */}
            <Col xs={24} md={12}>
              <Form.Item
                name="reference"
                label="Payment Reference"
                initialValue={formData?.reference}>
                <Input placeholder="e.g., BT-20240115-001, CHQ-789456" />
              </Form.Item>
            </Col>

            {/* Transaction ID */}
            <Col xs={24} md={12}>
              <Form.Item
                name="transactionId"
                label="Transaction ID"
                initialValue={formData?.transactionId}>
                <Input placeholder="Bank transaction ID, cheque number, etc." />
              </Form.Item>
            </Col>

            {/* Notes */}
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

          {/* Invoice Balance Information */}
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
              handleCancel();
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
