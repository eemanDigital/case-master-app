import { useState, useCallback } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import moment from "moment-timezone";
import {
  Button,
  Input,
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

// const { TextArea } = Input;

// const methodOptions = [
//   { label: "Credit Card", value: "credit_card" },
//   { label: "Bank Transfer", value: "bank_transfer" },
//   { label: "Cash", value: "cash" },
//   { label: "Cheque", value: "cheque" },
// ];

const CreatePaymentForm = () => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState(paymentInitialValue);

  const { dataFetcher } = useDataFetch();
  const { casesOptions } = useCaseSelectOptions();
  const { clientOptions } = useClientSelectOptions();
  const { invoiceRefOptions } = useInvoiceRefSelectOptions();
  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal();

  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        form.resetFields();
      }
    },
    [form]
  );

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
      console.log("VAL", values);
    } catch (errorInfo) {
      return;
    }

    // Convert the date to UTC without changing the actual date
    // if (values.date) {
    //   const localDate = moment(values.date);
    //   values.date = localDate.utc().format();
    // }

    const result = await dataFetcher("payments", "POST", values);
    handleSubmission(result);
  }, [form, handleSubmission, dataFetcher]);

  // filter option for select
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // console.log("DATA", formData);
  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white m-1">
        Add Payment
      </Button>
      <Modal
        // title="Create Payment Form"
        open={open}
        onOk={handleOk}
        // confirmLoading={loading}
        onCancel={handleCancel}
        footer={null}>
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
                  initialValue={formData?.totalAmountDue}>
                  <InputNumber
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
                  initialValue={formData?.amountPaid}>
                  <InputNumber
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
                  label="Date"
                  initialValue={
                    formData?.date ? moment(formData.date).local() : null
                  }>
                  <DatePicker />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="method"
                  label="Payment Method"
                  initialValue={formData?.method}>
                  <Select
                    placeholder="Select payment method"
                    options={methodOptions}
                    allowClear
                  />
                </Form.Item>
              </Col>
              {/* <Col xs={24} md={12}>
                <Form.Item
                  name="balance"
                  label="Balance"
                  initialValue={formData?.balance}>
                  <InputNumber
                    formatter={(value) =>
                      `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                  />
                </Form.Item>
              </Col> */}
            </Row>
            <Row gutter={[16, 16]}>
              {/* <Col xs={24}>
                <Form.Item
                  name="notes"
                  label="Notes"
                  initialValue={formData?.notes}>
                  <TextArea rows={4} />
                </Form.Item>
              </Col> */}
            </Row>
          </Card>
          <Divider />
          <Form.Item>
            <Button onClick={onSubmit} type="default" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreatePaymentForm;
