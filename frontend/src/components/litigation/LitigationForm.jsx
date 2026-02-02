import { useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Divider,
} from "antd";
import {
  SaveOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  COURT_TYPES,
  COMMENCEMENT_MODES,
  CASE_STAGES,
  NIGERIAN_STATES,
  DATE_FORMAT,
} from "../../utils/litigationConstants";

const { Option } = Select;
const { TextArea } = Input;

const LitigationForm = ({
  initialValues,
  onSubmit,
  loading = false,
  mode = "create", // 'create' or 'edit'
}) => {
  const [form] = Form.useForm();
  const [showOtherCourt, setShowOtherCourt] = useState(
    initialValues?.courtName === "others",
  );
  const [showOtherMode, setShowOtherMode] = useState(
    initialValues?.modeOfCommencement === "other",
  );

  // Format initial values for form
  const formattedInitialValues = initialValues
    ? {
        ...initialValues,
        filingDate: initialValues.filingDate
          ? dayjs(initialValues.filingDate)
          : null,
        serviceDate: initialValues.serviceDate
          ? dayjs(initialValues.serviceDate)
          : null,
        nextHearingDate: initialValues.nextHearingDate
          ? dayjs(initialValues.nextHearingDate)
          : null,
        lastHearingDate: initialValues.lastHearingDate
          ? dayjs(initialValues.lastHearingDate)
          : null,
        // Format processes filed dates
        firstParty: initialValues.firstParty
          ? {
              ...initialValues.firstParty,
              processesFiled: initialValues.firstParty.processesFiled?.map(
                (p) => ({
                  ...p,
                  filingDate: p.filingDate ? dayjs(p.filingDate) : null,
                }),
              ),
            }
          : undefined,
        secondParty: initialValues.secondParty
          ? {
              ...initialValues.secondParty,
              processesFiled: initialValues.secondParty.processesFiled?.map(
                (p) => ({
                  ...p,
                  filingDate: p.filingDate ? dayjs(p.filingDate) : null,
                }),
              ),
            }
          : undefined,
      }
    : {};

  const handleSubmit = (values) => {
    // Convert dayjs to ISO strings
    const formattedValues = {
      ...values,
      filingDate: values.filingDate ? values.filingDate.toISOString() : null,
      serviceDate: values.serviceDate ? values.serviceDate.toISOString() : null,
      nextHearingDate: values.nextHearingDate
        ? values.nextHearingDate.toISOString()
        : null,
      lastHearingDate: values.lastHearingDate
        ? values.lastHearingDate.toISOString()
        : null,
      // Format processes filed dates
      firstParty: values.firstParty
        ? {
            ...values.firstParty,
            processesFiled: values.firstParty.processesFiled?.map((p) => ({
              ...p,
              filingDate: p.filingDate ? p.filingDate.toISOString() : null,
            })),
          }
        : undefined,
      secondParty: values.secondParty
        ? {
            ...values.secondParty,
            processesFiled: values.secondParty.processesFiled?.map((p) => ({
              ...p,
              filingDate: p.filingDate ? p.filingDate.toISOString() : null,
            })),
          }
        : undefined,
    };

    onSubmit(formattedValues);
  };

  const handleCourtChange = (value) => {
    setShowOtherCourt(value === "others");
    if (value !== "others") {
      form.setFieldValue("otherCourt", null);
    }
  };

  const handleModeChange = (value) => {
    setShowOtherMode(value === "other");
    if (value !== "other") {
      form.setFieldValue("otherModeOfCommencement", null);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={formattedInitialValues}
      scrollToFirstError
      className="litigation-form">
      {/* COURT & CASE IDENTIFICATION */}
      <Card title="Court & Case Information" className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="suitNo"
              label="Suit Number"
              rules={[
                { required: true, message: "Suit number is required" },
                {
                  min: 3,
                  message: "Suit number must be at least 3 characters",
                },
              ]}>
              <Input placeholder="e.g., SUIT/123/2024" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="courtName"
              label="Court Name"
              rules={[{ required: true, message: "Court name is required" }]}>
              <Select
                placeholder="Select court"
                showSearch
                optionFilterProp="children"
                onChange={handleCourtChange}>
                {COURT_TYPES.map((court) => (
                  <Option key={court.value} value={court.value}>
                    {court.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {showOtherCourt && (
            <Col xs={24} md={12}>
              <Form.Item
                name="otherCourt"
                label="Specify Other Court"
                rules={[
                  { required: true, message: "Please specify the court name" },
                ]}>
                <Input placeholder="Enter court name" />
              </Form.Item>
            </Col>
          )}

          <Col xs={24} md={8}>
            <Form.Item name="courtNo" label="Court Number">
              <Input placeholder="e.g., Court 1" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="courtLocation" label="Court Location">
              <Input placeholder="e.g., Ikeja" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="state"
              label="State"
              rules={[{ required: true, message: "State is required" }]}>
              <Select
                placeholder="Select state"
                showSearch
                optionFilterProp="children">
                {NIGERIAN_STATES.map((state) => (
                  <Option key={state.value} value={state.value}>
                    {state.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="division" label="Division">
              <Input placeholder="e.g., Lagos Division" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" plain>
          Judge(s)
        </Divider>

        <Form.List name={["judge"]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={16} key={key} align="middle">
                  <Col xs={22} md={20}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      label={
                        fields.length > 1 ? `Judge ${name + 1}` : "Judge Name"
                      }
                      rules={[
                        { required: true, message: "Judge name is required" },
                        {
                          min: 2,
                          message: "Name must be at least 2 characters",
                        },
                        {
                          max: 100,
                          message: "Name must be less than 100 characters",
                        },
                      ]}>
                      <Input placeholder="Enter judge name" />
                    </Form.Item>
                  </Col>
                  <Col xs={2} md={4}>
                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        className="text-red-500 cursor-pointer"
                        onClick={() => remove(name)}
                      />
                    )}
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add Judge
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* CASE COMMENCEMENT */}
      <Card title="Case Commencement" className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="modeOfCommencement"
              label="Mode of Commencement"
              rules={[
                { required: true, message: "Mode of commencement is required" },
              ]}>
              <Select
                placeholder="Select mode of commencement"
                onChange={handleModeChange}>
                {COMMENCEMENT_MODES.map((mode) => (
                  <Option key={mode.value} value={mode.value}>
                    {mode.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {showOtherMode && (
            <Col xs={24} md={12}>
              <Form.Item
                name="otherModeOfCommencement"
                label="Specify Other Mode"
                rules={[
                  { required: true, message: "Please specify the mode" },
                ]}>
                <Input placeholder="Enter mode of commencement" />
              </Form.Item>
            </Col>
          )}

          <Col xs={24} md={8}>
            <Form.Item
              name="filingDate"
              label="Filing Date"
              rules={[{ required: true, message: "Filing date is required" }]}>
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                placeholder="Select filing date"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="serviceDate" label="Service Date">
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                placeholder="Select service date"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="currentStage"
              label="Current Stage"
              rules={[
                { required: true, message: "Current stage is required" },
              ]}>
              <Select placeholder="Select current stage">
                {CASE_STAGES.map((stage) => (
                  <Option key={stage.value} value={stage.value}>
                    {stage.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* PARTIES INFORMATION */}
      <Card title="Parties Information" className="mb-6">
        <Divider orientation="left" plain>
          First Party (Plaintiff/Claimant)
        </Divider>

        <Form.Item
          name={["firstParty", "description"]}
          label="Description"
          rules={[{ max: 1000, message: "Description too long" }]}>
          <TextArea
            rows={2}
            placeholder="e.g., Plaintiff, Claimant, Appellant"
            maxLength={1000}
          />
        </Form.Item>

        <Form.List name={["firstParty", "name"]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={16} key={key} align="middle">
                  <Col xs={22} md={20}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      label={fields.length > 1 ? `Name ${name + 1}` : "Name"}
                      rules={[{ max: 2000, message: "Name too long" }]}>
                      <Input placeholder="Enter party name" />
                    </Form.Item>
                  </Col>
                  <Col xs={2} md={4}>
                    {fields.length > 0 && (
                      <MinusCircleOutlined
                        className="text-red-500 cursor-pointer"
                        onClick={() => remove(name)}
                      />
                    )}
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add First Party Name
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider orientation="left" plain>
          Second Party (Defendant/Respondent)
        </Divider>

        <Form.Item
          name={["secondParty", "description"]}
          label="Description"
          rules={[{ max: 1000, message: "Description too long" }]}>
          <TextArea
            rows={2}
            placeholder="e.g., Defendant, Respondent, Appellee"
            maxLength={1000}
          />
        </Form.Item>

        <Form.List name={["secondParty", "name"]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={16} key={key} align="middle">
                  <Col xs={22} md={20}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      label={fields.length > 1 ? `Name ${name + 1}` : "Name"}
                      rules={[{ max: 2000, message: "Name too long" }]}>
                      <Input placeholder="Enter party name" />
                    </Form.Item>
                  </Col>
                  <Col xs={2} md={4}>
                    {fields.length > 0 && (
                      <MinusCircleOutlined
                        className="text-red-500 cursor-pointer"
                        onClick={() => remove(name)}
                      />
                    )}
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add Second Party Name
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider orientation="left" plain>
          Other Parties (if applicable)
        </Divider>

        <Form.List name="otherParty">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  className="mb-4 p-4 border border-gray-200 rounded">
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        {...restField}
                        name={[name, "description"]}
                        label={`Other Party ${name + 1} Description`}>
                        <Input placeholder="e.g., Third Party, Intervenor" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.List name={[name, "name"]}>
                        {(subFields, { add: addName, remove: removeName }) => (
                          <>
                            {subFields.map(
                              ({ key: subKey, name: subName, ...subRest }) => (
                                <Row gutter={16} key={subKey} align="middle">
                                  <Col xs={22}>
                                    <Form.Item
                                      {...subRest}
                                      name={[subName, "name"]}>
                                      <Input placeholder="Enter name" />
                                    </Form.Item>
                                  </Col>
                                  <Col xs={2}>
                                    <MinusCircleOutlined
                                      className="text-red-500 cursor-pointer"
                                      onClick={() => removeName(subName)}
                                    />
                                  </Col>
                                </Row>
                              ),
                            )}
                            <Button
                              type="dashed"
                              onClick={() => addName()}
                              icon={<PlusOutlined />}
                              size="small"
                              block>
                              Add Name
                            </Button>
                          </>
                        )}
                      </Form.List>
                    </Col>
                    <Col xs={24}>
                      <Button danger onClick={() => remove(name)} block>
                        Remove Other Party
                      </Button>
                    </Col>
                  </Row>
                </div>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add Other Party
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* LEGAL BASIS */}
      <Card title="Legal Basis & Issues" className="mb-6">
        <Form.Item name="applicableLaws" label="Applicable Laws">
          <Select
            mode="tags"
            placeholder="Enter applicable laws (press Enter to add)"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item name="legalIssues" label="Legal Issues">
          <Select
            mode="tags"
            placeholder="Enter legal issues (press Enter to add)"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="isLandmark"
          label="Landmark Case"
          valuePropName="checked">
          <Select placeholder="Is this a landmark case?">
            <Option value={true}>Yes</Option>
            <Option value={false}>No</Option>
          </Select>
        </Form.Item>

        <Form.Item name="citationReference" label="Citation Reference">
          <Input placeholder="e.g., (2024) LPELR-12345(CA)" />
        </Form.Item>
      </Card>

      {/* HEARING DATES */}
      <Card title="Hearing Information" className="mb-6">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="nextHearingDate" label="Next Hearing Date">
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                placeholder="Select next hearing date"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="lastHearingDate" label="Last Hearing Date">
              <DatePicker
                style={{ width: "100%" }}
                format={DATE_FORMAT}
                placeholder="Select last hearing date"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item name="totalHearings" label="Total Hearings">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Enter number of hearings"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* PROCESSES FILED */}
      <Card title="Processes to be Filed" className="mb-6">
        <Divider orientation="left" plain>
          First Party Processes
        </Divider>
        <Form.List name={["firstParty", "processesFiled"]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={16} key={key} align="middle">
                  <Col xs={24} md={10}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      label={
                        fields.length > 1
                          ? `Process ${name + 1}`
                          : "Process Name"
                      }
                      rules={[
                        { required: true, message: "Process name required" },
                      ]}>
                      <Input placeholder="e.g., Motion for Adjournment" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "filingDate"]}
                      label="Filing Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={22} md={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "status"]}
                      label="Status"
                      initialValue="pending">
                      <Select>
                        <Option value="pending">Pending</Option>
                        <Option value="filed">Filed</Option>
                        <Option value="served">Served</Option>
                        <Option value="completed">Completed</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={2} md={2}>
                    <MinusCircleOutlined
                      className="text-red-500 cursor-pointer mt-2"
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add First Party Process
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider orientation="left" plain>
          Second Party Processes
        </Divider>
        <Form.List name={["secondParty", "processesFiled"]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row gutter={16} key={key} align="middle">
                  <Col xs={24} md={10}>
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      label={
                        fields.length > 1
                          ? `Process ${name + 1}`
                          : "Process Name"
                      }
                      rules={[
                        { required: true, message: "Process name required" },
                      ]}>
                      <Input placeholder="e.g., Counter-Affidavit" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "filingDate"]}
                      label="Filing Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={22} md={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "status"]}
                      label="Status"
                      initialValue="pending">
                      <Select>
                        <Option value="pending">Pending</Option>
                        <Option value="filed">Filed</Option>
                        <Option value="served">Served</Option>
                        <Option value="completed">Completed</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={2} md={2}>
                    <MinusCircleOutlined
                      className="text-red-500 cursor-pointer mt-2"
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add Second Party Process
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* PRECEDENTS */}
      <Card title="Legal Precedents" className="mb-6">
        <Form.List name="precedents">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  className="mb-4 p-4 border border-gray-200 rounded">
                  <Row gutter={16} align="middle">
                    <Col xs={24} md={10}>
                      <Form.Item
                        {...restField}
                        name={[name, "caseName"]}
                        label="Case Name"
                        rules={[
                          { required: true, message: "Case name required" },
                        ]}>
                        <Input placeholder="e.g., Brown v. Board of Education" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={10}>
                      <Form.Item
                        {...restField}
                        name={[name, "citation"]}
                        label="Citation">
                        <Input placeholder="e.g., (2024) LPELR-12345(SC)" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={4}>
                      <Button
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                        block>
                        Remove
                      </Button>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        {...restField}
                        name={[name, "relevance"]}
                        label="Relevance/Application">
                        <TextArea
                          rows={2}
                          placeholder="How does this precedent apply to the current case?"
                          maxLength={500}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add Precedent
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* FORM ACTIONS */}
      <div className="flex justify-end gap-4 mt-6">
        <Button size="large" onClick={() => form.resetFields()}>
          Reset
        </Button>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          loading={loading}
          icon={<SaveOutlined />}>
          {mode === "create"
            ? "Create Litigation Details"
            : "Update Litigation Details"}
        </Button>
      </div>
    </Form>
  );
};

export default LitigationForm;
