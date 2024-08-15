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
} from "antd";
import { paymentInitialValue } from "../utils/initialValues";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import useInvoiceRefSelectOptions from "../hooks/useInvoiceRefSelectOptions";
import { methodOptions } from "../data/options";

import useModal from "../hooks/useModal";
import { toast } from "react-toastify";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const CreatePaymentForm = () => {
  const [formData, setFormData] = useState(paymentInitialValue);
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

    // Submit form data
    const result = await dataFetcher("payments", "POST", values);
    // Fetch updated data
    await fetchData("payments", "payments");

    // Handle the result of the submission
    if (result?.error) {
      // Display error message if submission failed
      toast.error("Submission Failed: " + (result?.error || result));
    } else {
      // Display success message if submission succeeded
      toast.success("Submission Successful");
      // Reset form fields
      form.resetFields();
    }
  }, [form, dataFetcher, fetchData]);

  // Function to filter options in select inputs
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // Validation rule for required fields
  const requiredRule = [{ required: true, message: "This field is required" }];

  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white m-1">
        Add Payment
      </Button>
      <Modal open={open} onOk={handleOk} onCancel={handleCancel} footer={null}>
        <Form layout="vertical" form={form} name="payment form">
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>Payment Form</Typography.Title>
          </Divider>
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="invoiceId"
                  label="Invoice Reference"
                  rules={requiredRule}
                  initialValue={formData?.invoiceId}>
                  <Select
                    placeholder="Select client"
                    showSearch
                    filterOption={filterOption}
                    options={invoiceRefOptions}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="clientId"
                  label="Client"
                  initialValue={formData?.clientId}>
                  <Select
                    placeholder="Select client"
                    showSearch
                    filterOption={filterOption}
                    options={clientOptions}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="caseId"
                  label="Case"
                  initialValue={formData?.caseId}>
                  <Select
                    placeholder="Select case"
                    showSearch
                    filterOption={filterOption}
                    options={casesOptions}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="totalAmountDue"
                  label="Amount Due "
                  rules={requiredRule}
                  initialValue={formData?.totalAmountDue}>
                  <InputNumber
                    className="w-full"
                    formatter={(value) =>
                      `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="amountPaid"
                  label="Amount Paid"
                  rules={requiredRule}
                  initialValue={formData?.amountPaid}>
                  <InputNumber
                    className="w-full"
                    formatter={(value) =>
                      `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="date"
                  label="Payment Date"
                  rules={requiredRule}
                  initialValue={
                    formData?.date ? moment(formData.date).local() : null
                  }>
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
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
            </Row>
          </Card>
          <Divider />
          <Form.Item>
            <Button
              loading={loading}
              onClick={onSubmit}
              className="blue-btn"
              htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreatePaymentForm;
