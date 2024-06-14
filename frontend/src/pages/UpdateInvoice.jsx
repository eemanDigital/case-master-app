import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { DeleteOutlined } from "@ant-design/icons";

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
} from "antd";
import { invoiceOptions } from "../data/options";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import axios from "axios";
import moment from "moment";

const { TextArea } = Input;

const baseURL = import.meta.env.VITE_BASE_URL;
const UpdateInvoice = () => {
  // destructure textarea from input
  const [form] = Form.useForm();

  const { casesOptions } = useCaseSelectOptions();
  const { clientOptions } = useClientSelectOptions();

  const { id } = useParams();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  // for navigation from page to page
  const navigate = useNavigate();

  // get cookie
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  // fetch initial data for the update state
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/invoices/${id}`, {
          headers: {
            ...fileHeaders,
            Authorization: `Bearer ${token}`,
          },
        });
        // console.log("RES", response.data.data);

        setFormData((prevData) => {
          return {
            ...prevData,
            ...response?.data?.data,
          };
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const { dataFetcher, data } = useDataFetch(); //general data fetcher

  // FORM SUBMISSION
  // form submit functionalities
  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        // form.resetFields();
      }
    },
    []
    // [form]
  );

  // submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      return;
    }
    const result = await dataFetcher(`invoices/${id}`, "patch", values); // Submit the form data to the backend
    // console.log(values);

    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher, id]);

  // filter options for the select field
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // loading state handler
  if (loading) {
    return <div>Loading...</div>;
  }

  console.log(clientOptions, casesOptions, formData);

  return (
    <>
      <Button onClick={() => navigate(-1)}>Go Back</Button>

      <Form
        className="h-[100%] pt-3"
        layout="vertical"
        form={form}
        name="Case Update Form"
        // onFinish={onSubmit}
        // autoComplete="off"
      >
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Invoice Form</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item name="case" label="Case" initialValue={formData?.case}>
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
                name="client"
                label="Client"
                initialValue={formData?.client}>
                <Select
                  placeholder="Select client"
                  showSearch
                  filterOption={filterOption}
                  options={clientOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Work Title"
                name="workTitle"
                initialValue={formData?.workTitle}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Services Rendered</Typography.Title>
        </Divider>

        <div>
          <Form.List name="services">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Card
                    size="small"
                    title={`Item ${field.name + 1}`}
                    key={field.key}
                    extra={
                      <DeleteOutlined
                        className="text-red-700"
                        onClick={() => {
                          remove(field.name);
                        }}
                      />
                    }>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Service Descriptions"
                          name={[field.name, "serviceDescriptions"]}
                          initialValue={formData.services.serviceDescriptions}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Hours of Work"
                          name={[field.name, "hours"]}
                          initialValue={formData.services.hours}>
                          <InputNumber />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Date of Work"
                          name={[field.name, "date"]}
                          initialValue={
                            formData.services?.date &&
                            moment(formData.services?.date).isValid()
                              ? moment(formData.services?.date)
                              : null
                          }>
                          <DatePicker />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Fee Rate Per Hour"
                          name={[field.name, "feeRatePerHour"]}
                          initialValue={formData.services.feeRatePerHour}>
                          <InputNumber
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24}>
                        <Form.Item
                          label="Amount Charged"
                          name={[field.name, "amount"]}
                          initialValue={formData.services.amount}>
                          <InputNumber
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button className="m-3" onClick={() => add()}>
                  + Add More Services
                </Button>
              </>
            )}
          </Form.List>
        </div>
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Expenses</Typography.Title>
        </Divider>
        <div>
          <Form.List name="expenses">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <Card
                    size="small"
                    title={`Item ${field.name + 1}`}
                    key={field.key}
                    extra={
                      <DeleteOutlined
                        className="text-red-700"
                        onClick={() => {
                          remove(field.name);
                        }}
                      />
                    }>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Expenses Descriptions"
                          name={[field.name, "description"]}
                          initialValue={formData.expenses.description}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Amount"
                          name={[field.name, "amount"]}
                          initialValue={formData.expenses.amount}>
                          <InputNumber
                            formatter={(value) =>
                              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Date "
                          name={[field.name, "date"]}
                          initialValue={formData.expenses.date}>
                          <DatePicker />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button className="m-3" onClick={() => add()}>
                  + Add Expenses
                </Button>
              </div>
            )}
          </Form.List>
        </div>
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Tax Charges on Invoice</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tax Type"
                name="taxType"
                initialValue={formData.taxType}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Tax Rate"
                name="taxRate"
                initialValue={formData?.taxRate}>
                <InputNumber />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Account Details</Typography.Title>
        </Divider>
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Account Name"
                name={["accountDetails", "accountName"]}
                initialValue={formData?.accountDetails?.accountName}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Account Number"
                name={["accountDetails", "accountNumber"]}
                initialValue={formData?.accountDetails?.accountNumber}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Bank"
                name={["accountDetails", "bank"]}
                initialValue={formData?.accountDetails?.bank}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Reference"
                name={["accountDetails", "reference"]}
                initialValue={formData?.accountDetails?.reference}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Divider />
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Invoice Status"
                initialValue={formData?.status}>
                <Select
                  placeholder="Select invoice status"
                  showSearch
                  filterOption={filterOption}
                  options={invoiceOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Due Date"
                name="dueDate"
                initialValue={
                  formData?.dueDate && moment(formData?.dueDate).isValid()
                    ? moment(formData?.dueDate)
                    : null
                }>
                <DatePicker />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Previous Balance Unpaid"
                name="previousBalance"
                initialValue={formData?.previousBalance}>
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
                label="Amount Already Paid"
                name="amountPaid"
                initialValue={formData?.amountPaid}>
                <InputNumber
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item
              name="paymentInstructionTAndC"
              label="Payment Instruction/Terms and Conditions"
              initialValue={formData?.paymentInstructionTAndC}>
              <TextArea />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Form.Item>
          <Button onClick={onSubmit} type="default" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default UpdateInvoice;
