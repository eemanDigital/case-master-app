import { useParams, Link } from "react-router-dom";
import moment from "moment";
import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import useUserSelectOptions from "../hooks/useUserSelectOptions";

import {
  Button,
  Input,
  Form,
  Card,
  Select,
  Divider,
  Typography,
  Switch,
  Space,
  DatePicker,
} from "antd";

import {
  courtOptions,
  statusOptions,
  natureOfCaseOptions,
  caseCategoryOptions,
  casePriorityOptions,
  modesOptions,
} from "../data/options";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import useHandleSubmit from "../hooks/useHandleSubmit";
import ReactQuill from "react-quill";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import LoadingSpinner from "../components/LoadingSpinner";
import createMaxLengthRule from "../utils/createMaxLengthRule";

const UpdateCase = () => {
  const { id } = useParams();
  const { formData, loading } = useInitialDataFetcher("cases", id); //initial data fetcher

  // custom hook to handle form submission
  const {
    form,
    onSubmit,
    loading: loadingState,
  } = useHandleSubmit(
    `cases/${id}`,
    "patch",
    undefined,
    undefined,
    undefined,
    "/dashboard/cases"
  );

  const { userData } = useUserSelectOptions();
  const { clientOptions } = useClientSelectOptions();

  // filter options for the select field
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // loading state handler
  if (loading) {
    return <LoadingSpinner />;
  }

  // validation rules
  const requiredRule = [{ required: true, message: "This field is required" }];

  // text area max length
  const caseSummaryMaxLengthRule = createMaxLengthRule(10000);
  const generalCommentMaxLengthRule = createMaxLengthRule(2000);

  return (
    <div>
      <Link to="../.." relative="path">
        Go Back
      </Link>
      <div className="max-w-4xl mx-auto p-1">
        <Form
          className="space-y-6"
          layout="vertical"
          form={form}
          name="Case Update Form"
          initialValues={formData}>
          {/* FIRST PARTY FIELD */}
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>First Party</Typography.Title>
          </Divider>
          <section className="bg-gray-50 p-4 rounded-lg shadow">
            <Form.Item
              rules={requiredRule}
              name={["firstParty", "description"]}
              label="Description">
              <Input placeholder="e.g. Plaintiff" />
            </Form.Item>

            <Form.List name={["firstParty", "name"]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{
                        display: "flex",

                        marginBottom: 8,
                      }}
                      align="baseline">
                      <Form.Item
                        rules={requiredRule}
                        {...restField}
                        name={[name, "name"]}
                        label={`Name ${key + 1}`}>
                        <Input placeholder="Parties Name" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}>
                      Add Name
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.List name={["firstParty", "processesFiled"]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{
                        display: "flex",
                        marginBottom: 8,
                      }}
                      align="baseline">
                      <Form.Item
                        rules={requiredRule}
                        {...restField}
                        name={[name, "name"]}
                        label={`Process ${key + 1}`}>
                        <Input placeholder="list processed filed..." />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}>
                      Add Processes
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </section>

          {/* SECOND PARTY FIELD */}
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>Second Party</Typography.Title>
          </Divider>
          <section className="bg-gray-50 p-4 rounded-lg shadow">
            <Form.Item
              name={["secondParty", "description"]}
              label="Description"
              rules={requiredRule}>
              <Input placeholder="e.g. Defendant" />
            </Form.Item>

            <Form.List name={["secondParty", "name"]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{
                        display: "flex",

                        marginBottom: 8,
                      }}
                      align="baseline">
                      <Form.Item
                        rules={requiredRule}
                        {...restField}
                        name={[name, "name"]}
                        label={`Name ${key + 1}`}>
                        <Input placeholder="Parties Name" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}>
                      Add Name
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Form.List name={["secondParty", "processesFiled"]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{
                        display: "flex",
                        marginBottom: 8,
                      }}
                      align="baseline">
                      <Form.Item
                        rules={requiredRule}
                        {...restField}
                        name={[name, "name"]}
                        label={`Process ${key + 1}`}>
                        <Input placeholder="list processed filed..." />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}>
                      Add Processes
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </section>

          {/* OTHER PARTIES FIELD */}
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>Other Party</Typography.Title>
          </Divider>

          <section className="bg-gray-50 p-4 rounded-lg shadow md:p-6 lg:p-8">
            <Form.List name="otherParty">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map((field) => (
                    <Card
                      className="mb-4"
                      size="small"
                      title={`Party ${field.name + 1}`}
                      key={field.key}
                      extra={
                        <DeleteOutlined
                          className="text-red-700 cursor-pointer"
                          onClick={() => {
                            remove(field.name);
                          }}
                        />
                      }>
                      {/* OtherParty Description Field */}
                      <Form.Item
                        rules={requiredRule}
                        label="Description"
                        name={[field.name, "description"]}>
                        <Input placeholder="Enter party description" />
                      </Form.Item>

                      {/* Nested Form.otherParty */}
                      <div className="flex flex-col lg:flex-row lg:space-x-6">
                        <Form.Item label="Name" noStyle>
                          {/* OtherParty Name Field */}
                          <Form.List name={[field.name, "name"]}>
                            {(subFields, { add, remove }) => (
                              <div>
                                {subFields.map((subField) => (
                                  <div
                                    key={subField.key}
                                    className="flex items-center space-x-3 my-2">
                                    <Form.Item
                                      rules={requiredRule}
                                      noStyle
                                      name={[subField.name, "name"]}>
                                      <Input placeholder="Enter Party's name" />
                                    </Form.Item>
                                    <Button
                                      danger
                                      onClick={() => remove(subField.name)}
                                      icon={<DeleteOutlined />}
                                    />
                                  </div>
                                ))}
                                <Button
                                  type="dashed"
                                  className="w-full md:w-auto"
                                  onClick={() => add()}>
                                  + Add Name
                                </Button>
                              </div>
                            )}
                          </Form.List>

                          {/* OtherParty ProcessesFiled Field */}
                          <Form.List name={[field.name, "processesFiled"]}>
                            {(subFields, { add, remove }) => (
                              <div>
                                {subFields.map((subField) => (
                                  <div
                                    key={subField.key}
                                    className="flex items-center space-x-3 my-2">
                                    <Form.Item
                                      rules={requiredRule}
                                      noStyle
                                      name={[subField.name, "name"]}>
                                      <Input placeholder="Enter processes filed by the party" />
                                    </Form.Item>
                                    <Button
                                      danger
                                      onClick={() => remove(subField.name)}
                                      icon={<DeleteOutlined />}
                                    />
                                  </div>
                                ))}
                                <Button
                                  type="dashed"
                                  className="w-full md:w-auto"
                                  onClick={() => add()}>
                                  + Add Processes
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </Form.Item>
                      </div>
                    </Card>
                  ))}
                  <Button
                    className="w-full md:w-auto mt-4"
                    onClick={() => add()}>
                    + Add More Parties
                  </Button>
                </div>
              )}
            </Form.List>
          </section>

          <section className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* MODE OF COMMENCEMENT */}
              {/* <TextDivider text="Mode of Commencement" /> */}

              <Form.Item
                rules={requiredRule}
                name="modeOfCommencement"
                label="Mode of Commencement">
                <Select placeholder="Search to Select" options={modesOptions} />
              </Form.Item>

              {/* OTHER MODE OF COMMENCEMENT*/}

              {/* <Form.Item
                label="Specify other Mode"
                name="otherModeOfCommencement">
                <Input />
              </Form.Item>
       */}
              {/* WHETHER FILED BY THE OFFICE */}
              <Form.Item
                rules={requiredRule}
                label="Switch if case is filed by the Office"
                valuePropName="checked"
                name="isFiledByTheOffice">
                <Switch className="bg-gray-400 w-20" />
              </Form.Item>
              {/* NATURE OF CASE */}
              <Form.Item
                rules={requiredRule}
                name="natureOfCase"
                label="Nature of Case"
                className="w-full">
                <Select
                  noStyle
                  placeholder="Select nature of case"
                  showSearch
                  filterOption={filterOption}
                  options={natureOfCaseOptions}
                  allowClear
                />
              </Form.Item>

              {/* DATE FILED */}

              <Form.Item
                rules={requiredRule}
                name="filingDate"
                label="Filing Date"
                getValueFromEvent={(date) => date?.toISOString()}
                getValueProps={(value) => ({
                  value: value ? moment(value) : undefined,
                })}>
                <DatePicker />
              </Form.Item>

              {/* SUIT NO FIELD */}

              <Form.Item
                rules={requiredRule}
                name="suitNo"
                label="Suit No."
                tooltip="This is a required field">
                <Input />
              </Form.Item>
              {/* COURTS */}

              <Form.Item
                rules={requiredRule}
                name="courtName"
                label="Assigned Court">
                <Select
                  showSearch
                  placeholder="Search to Select"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "").includes(input)
                  }
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                  options={courtOptions}
                />
              </Form.Item>

              {/* OTHER COURT*/}

              <Form.Item label="Specify Court" name="otherCourt">
                <Input />
              </Form.Item>

              {/* COURT'S NO */}

              <Form.Item label="Court No" name="courtNo">
                <Input />
              </Form.Item>

              {/* COURT'S LOCATION */}

              <Form.Item
                label="Court's Location"
                name="location"
                placeholder="e.g. Ikoyi, Lagos">
                <Input />
              </Form.Item>

              {/*  STATE */}

              <Form.Item
                rules={requiredRule}
                label="State where Court is located"
                name="state"
                placeholder="e.g. Lagos">
                <Input />
              </Form.Item>
              {/* CASE FILE NO FIELD */}

              <Form.Item label="Case file Number" name="caseOfficeFileNo">
                <Input />
              </Form.Item>
            </div>
          </section>

          {/* JUDGE FIELD */}
          <section className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* CASE STATUS */}
              <Form.Item
                rules={requiredRule}
                name="caseStatus"
                label="Case Status ">
                <Select options={statusOptions} />
              </Form.Item>
              {/* CASE CATEGORY */}

              <Form.Item
                rules={requiredRule}
                name="category"
                label="Case Category">
                <Select
                  noStyle
                  placeholder="Select case category"
                  showSearch
                  filterOption={filterOption}
                  options={caseCategoryOptions}
                  allowClear
                />
              </Form.Item>

              {/* CASE PRIORITY */}

              <Form.Item
                rules={requiredRule}
                label="Case Priority/ Rating"
                name="casePriority">
                <Select
                  showSearch
                  style={{
                    width: "100%",
                  }}
                  placeholder="Search to Select"
                  options={casePriorityOptions}
                />
              </Form.Item>
            </div>
          </section>

          <section className="bg-gray-50 p-6 rounded-lg shadow space-y-4 flex flex-col  md:items-start sm:items-start items-center justify-center">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
            {/* judges */}
            <Divider orientation="middle" orientationMargin="0">
              <h1 className="text-1xl">Judges/Justices</h1>
            </Divider>
            <Form.List name="judge">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{
                        display: "flex",
                        marginBottom: 8,
                      }}
                      align="baseline">
                      <Form.Item
                        label="Judges Name"
                        rules={requiredRule}
                        {...restField}
                        name={[name, "name"]}>
                        <Input placeholder="Last Name" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}>
                      Add Judge
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            {/* case strengths */}
            <Divider orientation="middle" orientationMargin="0">
              <h1 className="text-1xl">Case Strength(es)</h1>
            </Divider>
            <Form.List name="caseStrengths">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Form.Item
                        label="Case Strengths"
                        rules={requiredRule}
                        {...restField}
                        name={[name, "name"]}
                        className="flex-grow">
                        <Input placeholder="Case Strength" />
                      </Form.Item>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        className="text-red-500 cursor-pointer"
                      />
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      className="w-full sm:w-4/5 md:w-3/5 lg:w-2/5 xl:w-1/3">
                      Add Case Strength
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            <Divider />
            {/* CASE WEAKNESS */}
            <Divider orientation="middle" orientationMargin="0">
              <h1 className="text-1xl">Case Weakness(es)</h1>
            </Divider>
            <Form.List name="caseWeaknesses">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Form.Item
                        label="Case Weaknesses"
                        rules={requiredRule}
                        {...restField}
                        name={[name, "name"]}
                        className="flex-grow">
                        <Input placeholder="Case Weakness" />
                      </Form.Item>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        className="text-red-500 cursor-pointer"
                      />
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      className="w-full sm:w-4/5 md:w-3/5 lg:w-2/5 xl:w-1/3">
                      Add Case Weakness
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            {/* STEPS TO BE TAKEN FIELD */}
            <Divider orientation="middle" orientationMargin="0">
              <h1 className="text-1xl">Steps to be taken</h1>
            </Divider>
            <Form.List name="stepToBeTaken">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Form.Item
                        label="Steps/Strategies"
                        rules={requiredRule}
                        {...restField}
                        name={[name, "name"]}
                        className="flex-grow ">
                        <Input
                          className="w-full max-w-2xl"
                          placeholder="Strategy/Steps"
                        />
                      </Form.Item>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        className="text-red-500 cursor-pointer"
                      />
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      className="w-full sm:w-4/5 md:w-3/5 lg:w-2/5 xl:w-1/3">
                      Add Steps
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            {/* </div> */}
          </section>

          {/* Account Officer and Client */}
          <section className="bg-gray-50 p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                rules={requiredRule}
                name="accountOfficer"
                label="Account Officer"
                initialValue={formData?.accountOfficer?.map(
                  (officer) => officer._id
                )}>
                <Select
                  mode="multiple"
                  placeholder="Select account officer"
                  options={userData}
                  allowClear
                />
              </Form.Item>

              {/* CLIENT */}
              <Form.Item
                name="client"
                label="Client"
                initialValue={formData?.client?._id}>
                <Select
                  placeholder="Select client..."
                  options={clientOptions}
                  allowClear
                />
              </Form.Item>
            </div>
          </section>

          {/* Case Summary and General Comment */}
          <section className="bg-gray-50 p-4 rounded-lg shadow space-y-4">
            <Form.Item
              rules={[requiredRule, caseSummaryMaxLengthRule]}
              label="Case Summary"
              placeholder="Your fact of the case here"
              name="caseSummary">
              <ReactQuill />
            </Form.Item>

            {/* GENERAL COMMENT */}
            <Form.Item
              label="General Comment"
              rules={[generalCommentMaxLengthRule]}
              name="generalComment">
              <ReactQuill />
            </Form.Item>
          </section>

          <Form.Item>
            <Button
              className="blue-btn"
              loading={loadingState}
              onClick={onSubmit}
              htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default UpdateCase;
