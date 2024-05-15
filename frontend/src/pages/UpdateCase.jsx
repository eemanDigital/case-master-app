import { useState, useCallback, useEffect } from "react";
<<<<<<< HEAD
import { useDataFetch } from "../hooks/useDataFetch";
import { DeleteOutlined } from "@ant-design/icons";
import {
  PartyDynamicInputs,
  // SelectInputs,
  DynamicInputArrays,
  TextAreaInput,
} from "../components/DynamicInputs";
// import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
=======
import { useParams, Link } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import axios from "axios";
>>>>>>> backup-my-case-app

import {
  Button,
  Input,
  Form,
<<<<<<< HEAD
  Divider,
  Typography,
  Card,
  Select,
=======
  Card,
  Select,
  Divider,
  Typography,
>>>>>>> backup-my-case-app
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
<<<<<<< HEAD
import CaseDocument from "./CaseDocument";

<<<<<<<< HEAD:frontend/src/pages/UpdateCase.jsx
const UpdateCase = () => {
========
const CreateCaseForm = () => {
>>>>>>>> backup-my-case-app:frontend/src/pages/CreateCaseForm.jsx
  // destructure textarea from input
  // const { TextArea } = Input;

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    firstParty: {
      description: "",
      name: [{ name: "" }],
      processesFiled: [{ name: "" }],
    },
    secondParty: {
      description: "",
      name: [{ name: "" }],
      processesFiled: [{ name: "" }],
    },
    otherParty: [
      {
        description: "",
        name: [{ name: "" }],
        processesFiled: [{ name: "" }],
      },
    ],
    suitNo: "",
    caseOfficeFileNo: "",
    courtName: "",
    courtNo: "",
    location: "",
    otherCourt: "",
    judge: [{ name: "" }],
    caseSummary: "",
    caseStatus: "",
    natureOfCase: "",
    category: "",
    isFiledByTheOffice: false,
    filingDate: "",
    modeOfCommencement: "",
    otherModeOfCommencement: "",
    caseStrengths: [],
    caseWeaknesses: [],
    casePriority: "",
    stepToBeTaken: [],
    caseUpdates: [{ date: "", update: "" }],

    accountOfficer: [],
    client: [{ name: "" }],
    generalComment: "",
  });
  // destructor authenticate from useDataFetch
  const { dataFetcher, data } = useDataFetch(); //general data fetcher
  // destructure user data for accountOfficers
  const { users } = useDataGetterHook();

=======

const baseURL = import.meta.env.VITE_BASE_URL;
const UpdateCase = () => {
  // destructure textarea from input
  const [form] = Form.useForm();
  const { TextArea } = Input;
  const { users } = useDataGetterHook();

  const { id } = useParams();
  // console.log(id);
  // const { singleData, singleDataFetcher } = useSingleDataFetcher();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/cases/${id}`);
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

>>>>>>> backup-my-case-app
  //  get users/account officer's data
  const userData = Array.isArray(users?.data)
    ? users?.data.map((user) => {
        return {
          value: user?.fullName,
          label: user?.fullName,
        };
      })
    : [];

<<<<<<< HEAD
=======
  const { dataFetcher, data } = useDataFetch(); //general data fetcher

  // FORM SUBMISSION
>>>>>>> backup-my-case-app
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
<<<<<<< HEAD
    const result = await dataFetcher("cases", "POST", values); // Submit the form data to the backend
    console.log(values);

    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher]);

  // filter function for Select
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // derived state to check "Other"
  // const [otherMode, setOtherMode] = useState({
  //   modeOfCommencement: "",
  // });

  // const fieldVal = form.getFieldValue("modeOfCommencement");

  // const Mode = formData?.modeOfCommencement === "Other";
  // console.log(fieldVal);

  return (
    <>
      <Form
        layout="vertical"
        form={form}
        name="dynamic_form_complex"
        // autoComplete="off"
        // initialValues={formData}
      >
=======
    const result = await dataFetcher(`cases/${id}`, "patch", values); // Submit the form data to the backend
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

  return (
    <>
      <Link to="../.." relative="path">
        Go Back
      </Link>

      <Form
        className="h-[100%] pt-3"
        layout="vertical"
        form={form}
        name="Case Update Form"
        // onFinish={onSubmit}
        // autoComplete="off"
        initialValues={formData}>
>>>>>>> backup-my-case-app
        {/* FIRST PARTY FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>First Party</Typography.Title>
        </Divider>
<<<<<<< HEAD

        <PartyDynamicInputs
          parentKey="firstParty"
          firstKeyVal="description"
          label="Description"
          placeholderVal="e.g. Plaintiff"
          secondKeyVal="name"
          firstInitialValue={formData?.firstParty?.description}
          secondInitialValue={formData?.firstParty?.name}
          thirdKeyVal="processesFiled"
          thirdInitialValue={formData?.firstParty?.processesFiled}
        />
=======
        <div className="flex flex-wrap justify-between ">
          <div className="flex flex-wrap justify-between ">
            <Form.Item
              name={["firstParty", "description"]}
              label="Description"

              // rules={[
              //   {
              //     required: true,
              //     message: "Please provide the party's title",
              //   },
              // ]}
            >
              <Input placeholder="e.g. Plaintiff" />
            </Form.Item>
          </div>
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
        </div>
>>>>>>> backup-my-case-app

        {/* SECOND PARTY FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Second Party</Typography.Title>
        </Divider>
<<<<<<< HEAD
        <PartyDynamicInputs
          parentKey="secondParty"
          firstKeyVal="description"
          label="Description"
          placeholderVal="e.g. Defendant"
          secondKeyVal="name"
          firstInitialValue={formData?.secondParty?.description}
          secondInitialValue={formData?.secondParty?.name}
          thirdKeyVal="processesFiled"
          thirdInitialValue={formData?.secondParty?.processesFiled}
        />

        {/* OTHER PARTIES FIELD */}
=======
        <div className="flex flex-wrap justify-between ">
          <div className="flex flex-wrap justify-between ">
            <Form.Item
              name={["secondParty", "description"]}
              label="Description"

              // rules={[
              //   {
              //     required: true,
              //     message: "Please provide the party's title",
              //   },
              // ]}
            >
              <Input placeholder="e.g. Defendant" />
            </Form.Item>
          </div>
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
        </div>

        {/* OTHER PARTIES FIELD */}

>>>>>>> backup-my-case-app
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Other Party</Typography.Title>
        </Divider>
        <div className="">
          <Form.List name="otherParty">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <Card
                    className=""
                    size="small"
<<<<<<< HEAD
                    title={`Other Parties ${field.name + 1}`}
=======
                    title={`Party ${field.name + 1}`}
>>>>>>> backup-my-case-app
                    key={field.key}
                    extra={
                      <DeleteOutlined //delete the whole otherParty forms
                        className="text-red-700"
                        onClick={() => {
                          remove(field.name);
                        }}
                      />
                    }>
                    {/* otherParty title field */}
                    <Form.Item
                      label="Description"
<<<<<<< HEAD
                      name={[field.name, "description"]}
                      initialValue={formData.otherParty.description}>
=======
                      name={[field.name, "description"]}>
>>>>>>> backup-my-case-app
                      <Input />
                    </Form.Item>

                    {/* Nest Form.otherParty */}
                    <div className="flex justify-between  items-center">
                      <Form.Item label="Name" noStyle>
                        {/* otherParty description field */}
                        <Form.List name={[field.name, "name"]}>
                          {(subFields, { add, remove }) => (
                            <div>
                              {subFields.map((subField) => (
                                <Space.Compact
                                  key={subField.key}
                                  className="flex my-2">
                                  <Form.Item
                                    noStyle
<<<<<<< HEAD
                                    name={[subField.name, "name"]}
                                    initialValue={
                                      formData.otherParty[field.name]?.name[
                                        subField?.name
                                      ]?.name
                                    }>
                                    <Input placeholder="Enter Party's description" />
=======
                                    name={[subField.name, "name"]}>
                                    <Input placeholder="Enter Party's name" />
>>>>>>> backup-my-case-app
                                  </Form.Item>
                                  <Button>
                                    <DeleteOutlined
                                      className="text-red-700"
                                      onClick={() => {
                                        remove(subField.name);
                                      }}
                                    />
                                  </Button>
                                </Space.Compact>
                              ))}
                              <Button type="dashed" onClick={() => add()}>
                                + Add Name
                              </Button>
                            </div>
                          )}
                        </Form.List>

                        {/* otherParty processesFiled field */}

                        <Form.List name={[field.name, "processesFiled"]}>
                          {(subFields, { add, remove }) => (
                            <div>
                              {subFields.map((subField) => (
                                <Space.Compact
                                  key={subField.key}
                                  className="flex my-2">
                                  <Form.Item
                                    noStyle
<<<<<<< HEAD
                                    name={[subField.name, "name"]}
                                    initialValue={
                                      formData.otherParty[field.name]
                                        ?.processesFiled[subField.name]?.name
                                    }>
=======
                                    name={[subField.name, "name"]}>
>>>>>>> backup-my-case-app
                                    <Input placeholder="Enter Processes filed by the party" />
                                  </Form.Item>
                                  <Button>
                                    <DeleteOutlined
                                      className="text-red-700"
                                      onClick={() => {
                                        remove(subField.name);
                                      }}
                                    />
                                  </Button>
                                </Space.Compact>
                              ))}
                              <Button type="dashed" onClick={() => add()}>
                                + Add Processes
                              </Button>
                            </div>
                          )}
                        </Form.List>
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button className="m-3" onClick={() => add()}>
                  + Add More Parties
                </Button>
              </div>
            )}
          </Form.List>
        </div>
<<<<<<< HEAD
        <Divider />

        {/* SUIT NO FIELD */}
        <div className="flex justify-between items-center gap-9 flex-wrap">
          {/* MODE OF COMMENCEMENT */}

          <div>
            <Form.Item
              name="modeOfCommencement"
              label="Mode of Commencement"
              initialValue={formData?.modeOfCommencement}
              className="w-[200px]">
              <Select
                noStyle
                placeholder="Select mode"
                showSearch
                filterOption={filterOption}
                options={modesOptions}
                allowClear
                // value={otherMode?.modeOfCommencement}
                // onChange={(e) => setOtherMode(e.target.value)}
                // onSelect={(e) => setOtherMode(e.target.value)}
              />
            </Form.Item>
          </div>

          {/* OTHER MODE OF COMMENCEMENT */}

          <div>
            <Form.Item
              label="Specify Mode"
              name="otherModeOfCommencement"
              initialValue={formData?.otherModeOfCommencement}>
=======

        <div className="flex flex-wrap  justify-around gap-14 items-center mt-7">
          {/* SUIT NO FIELD */}
          {/* <TextDivider text="Suit No" /> */}
          <div>
            <Form.Item
              name="suitNo"
              label="Suit No."
              tooltip="This is a required field"

              // rules={[
              //   {
              //     required: true,
              //     message: "Please enter suit no!",
              //   },
              // ]}
            >
              <Input />
            </Form.Item>
          </div>
          {/* MODE OF COMMENCEMENT */}
          {/* <TextDivider text="Mode of Commencement" /> */}
          <div>
            <Form.Item name="modeOfCommencement" label="Mode of Commencement">
              <Select
                style={{
                  width: 200,
                }}
                placeholder="Search to Select"
                options={modesOptions}
              />
            </Form.Item>
          </div>
          {/* OTHER MODE OF COMMENCEMENT*/}
          <div>
            <Form.Item
              label="Specify other Mode"
              name="otherModeOfCommencement">
>>>>>>> backup-my-case-app
              <Input />
            </Form.Item>
          </div>

<<<<<<< HEAD
          {/* WHETHER FILED BY THE OFFICE */}
          <Form.Item
            label="Switch if case is filed by the Office"
            valuePropName="checked"
            name="isFiledByTheOffice"
            initialValue={formData?.isFiledByTheOffice}>
            <Switch className="bg-gray-400 w-20" />
          </Form.Item>

=======
          {/* COURTS */}
          {/* <TextDivider text="Court" /> */}
          <div>
            <Form.Item name="courtName" label="Assigned Court">
              <Select
                showSearch
                style={{
                  width: 200,
                }}
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
          </div>
          {/* OTHER COURT*/}
          <div>
            <Form.Item label="Specify Court" name="otherCourt">
              <Input />
            </Form.Item>
          </div>

          {/* COURT'S NO */}
          <div>
            <Form.Item label="Court No" name="courtNo">
              <Input />
            </Form.Item>
          </div>
          {/* COURT'S LOCATION */}
          <div>
            <Form.Item
              label="Court's Location"
              name="location"
              placeholder="e.g. Ikoyi, Lagos">
              <Input />
            </Form.Item>
          </div>
          {/*  STATE */}
          <div>
            <Form.Item
              label="State where Court is located"
              name="state"
              placeholder="e.g. Lagos">
              <Input />
            </Form.Item>
          </div>
          {/* JUDGE FIELD */}

          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
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
                          <Form.Item {...restField} name={[name, "name"]}>
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
              </div>
            </div>
          </div>
>>>>>>> backup-my-case-app
          {/* NATURE OF CASE*/}
          <div>
            <Form.Item
              name="natureOfCase"
              label="Nature of Case"
<<<<<<< HEAD
              initialValue={formData?.natureOfCase}
=======
>>>>>>> backup-my-case-app
              className="w-[200px]">
              <Select
                noStyle
                placeholder="Select nature of case"
                showSearch
                filterOption={filterOption}
                options={natureOfCaseOptions}
                allowClear
              />
            </Form.Item>
          </div>
<<<<<<< HEAD

          {/* DATE FILED */}
          <div>
            <Form.Item name="filingDate" label="Filing Date">
              <DatePicker />
            </Form.Item>
          </div>
          <Divider />
          <div>
            <Form.Item
              name="suitNo"
              label="Suit No."
              tooltip="This is a required field"
              initialValue={formData?.suitNo}
              // rules={[
              //   {
              //     required: true,
              //     message: "Please enter suit no!",
              //   },
              // ]}
            >
              <Input />
            </Form.Item>
          </div>

          {/* COURTS */}

          <div>
            <Form.Item
              name="courtName"
              label="Court"
              initialValue={formData?.courtName}
              className="w-[200px]">
              <Select
                noStyle
                placeholder="Select court"
                showSearch
                filterOption={filterOption}
                options={courtOptions}
                allowClear
              />
            </Form.Item>
          </div>

          {/* COURT'S NO */}
          <div>
            <Form.Item
              label="Court No"
              name="courtNo"
              initialValue={formData?.courtNo}>
              <Input />
            </Form.Item>
          </div>
          {/* COURT'S LOCATION */}
          <div>
            <Form.Item
              label="Court's Location"
              name="location"
              placeholder="e.g. Ikoyi, Lagos"
              initialValue={formData?.location}>
              <Input />
            </Form.Item>
          </div>
          {/*  STATE */}
          <div>
            <Form.Item
              label="State where Court is located"
              name="state"
              placeholder="e.g. Lagos"
              initialValue={formData?.state}>
              <Input />
            </Form.Item>
          </div>

          {/* OTHER COURT */}
          <div>
            <Form.Item
              label="Specify Court"
              name="otherCourt"
              initialValue={formData?.courtName}>
              <Input />
            </Form.Item>
          </div>

          {/* CASE FILE NO FIELD */}
          <div>
            <Form.Item
              label="Case file Number"
              name="caseOfficeFileNo"
              initialValue={formData?.caseOfficeFileNo}>
              <Input />
            </Form.Item>
          </div>
          <Divider />

          {/* CASE STATUS */}
          {/* <SelectInputs
            name="caseStatus"
            label="Case Status"
            initialValue={formData?.caseStatus}
            options={statusOptions}
          /> */}
          <div>
            <Form.Item
              name="caseStatus"
              label="Case Status"
              initialValue={formData?.caseStatus}
              className="w-[200px]">
              <Select
                noStyle
                placeholder="Select case status"
                showSearch
                filterOption={filterOption}
                options={statusOptions}
                allowClear
=======
          {/* WHETHER FILED BY THE OFFICE */}
          <Form.Item
            label="Switch if case is filed by the Office"
            valuePropName="checked"
            name="isFiledByTheOffice">
            <Switch className="bg-gray-400 w-20" />
          </Form.Item>

          {/* CASE FILE NO FIELD */}
          {/* <TextDivider text="Case file Number" /> */}
          <div>
            <Form.Item label="Case file Number" name="caseOfficeFileNo">
              <Input />
            </Form.Item>
          </div>

          {/* DATE FILED */}
          {/* <TextDivider text="Filing Date" /> */}
          <div>
            {/* <Form.Item name="filingDate" label="Filing Date">
              <DatePicker />
            </Form.Item> */}
          </div>

          {/* CASE STATUS */}
          {/* <TextDivider text="Case Status" /> */}
          <div>
            <Form.Item name="caseStatus" label="Case Status">
              <Select
                style={{
                  width: 200,
                }}
                options={statusOptions}
>>>>>>> backup-my-case-app
              />
            </Form.Item>
          </div>

          {/* CASE CATEGORY */}
          <div>
            <Form.Item
              name="category"
              label="Case Category"
<<<<<<< HEAD
              initialValue={formData?.category}
=======
>>>>>>> backup-my-case-app
              className="w-[200px]">
              <Select
                noStyle
                placeholder="Select case category"
                showSearch
                filterOption={filterOption}
                options={caseCategoryOptions}
                allowClear
              />
            </Form.Item>
          </div>

          {/* CASE PRIORITY */}
<<<<<<< HEAD
          {/* <SelectInputs
            name="casePriority"
            label="Case Priority"
            initialValue={formData?.casePriority}
            options={casePriorityOptions}
          /> */}

          <div>
            <Form.Item
              name="casePriority"
              label="Case Priority/Rating"
              initialValue={formData?.casePriority}
              className="w-[200px]">
              <Select
                noStyle
                placeholder="Select case priority"
                showSearch
                filterOption={filterOption}
                options={casePriorityOptions}
                allowClear
=======
          {/* <TextDivider text="Case Priority/ Rating" /> */}
          <div>
            <Form.Item label="Case Priority/ Rating" name="casePriority">
              <Select
                showSearch
                style={{
                  width: 200,
                }}
                placeholder="Search to Select"
                options={casePriorityOptions}
>>>>>>> backup-my-case-app
              />
            </Form.Item>
          </div>

<<<<<<< HEAD
          {/* JUDGE FIELD */}
          <DynamicInputArrays
            parentKey="judge"
            initialValue={formData?.judge}
            label="Judge/Justices"
            placeholder="Enter judges  name"
          />

          {/* CASE STRENGTH */}
          <DynamicInputArrays
            parentKey="caseStrengths"
            initialValue={formData?.caseStrengths}
            label="Case Strength"
            placeholder="Enter case's Strength"
          />
          <Divider />
          {/* CASE WEAKNESS */}
          <DynamicInputArrays
            parentKey="caseWeaknesses"
            initialValue={formData?.caseWeaknesses}
            label="Case Weaknesses"
            placeholder="Enter case's Weaknesses"
          />

          {/* STEPS TO BE TAKEN FIELD */}
          <DynamicInputArrays
            parentKey="stepToBeTaken"
            initialValue={formData?.stepToBeTaken}
            label="Steps/Strategies"
          />
=======
          {/* CASE STRENGTH */}
          {/* <TextDivider text="Case Strengths" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="caseStrengths">
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
                            {...restField}
                            name={[name, "name"]}
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: "Missing last name",
                            //   },
                            // ]}
                          >
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
                          Add Case Strength
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </div>
            </div>
          </div>
          {/* CASE WEAKNESS */}
          {/* <TextDivider text="Case Weaknesses" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="caseWeaknesses">
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
                            {...restField}
                            name={[name, "name"]}
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: "Missing last name",
                            //   },
                            // ]}
                          >
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
                          Add Case Weaknesses
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </div>
            </div>
          </div>

          {/* STEPS TO BE TAKEN FIELD */}
          {/* <TextDivider text="Steps/Case Strategies" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="stepToBeTaken">
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
                            {...restField}
                            name={[name, "name"]}
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: "Missing last name",
                            //   },
                            // ]}
                          >
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
                          Add Steps
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </div>
            </div>
          </div>

          {/* CLIENT */}
          {/* <TextDivider text="Client" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="client">
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
                            {...restField}
                            name={[name, "name"]}
                            // rules={[
                            //   {
                            //     required: true,
                            //     message: "Missing last name",
                            //   },
                            // ]}
                          >
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
                          Add Client
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </div>
            </div>
          </div>
>>>>>>> backup-my-case-app

          {/* ACCOUNT OFFICER */}
          {/* <TextDivider text="Account Officer(s)" /> */}
          <div>
            <Form.Item
              name="accountOfficer"
              label="Account Officer"
<<<<<<< HEAD
              className="w-[200px]"
              initialValue={formData?.accountOfficer.name}>
              <Select
                // noStyle
=======
              className="w-[200px]">
              <Select
>>>>>>> backup-my-case-app
                mode="multiple"
                placeholder="Select account officer"
                options={userData}
                allowClear
<<<<<<< HEAD
                // style={{
                //   width: "100%",
                // }}
=======
>>>>>>> backup-my-case-app
              />
            </Form.Item>
          </div>

<<<<<<< HEAD
          {/* CLIENT */}
          <DynamicInputArrays
            parentKey="client"
            initialValue={formData?.client}
            label="Client"
          />
        </div>

        <Divider />

        {/* CASE SUMMARY */}
        <TextAreaInput
          fieldName="caseSummary"
          initialValue={formData?.caseSummary}
          label="Case Summary"
        />
        {/* GENERAL COMMENT */}
        <TextAreaInput
          fieldName="generalComment"
          initialValue={formData?.generalComment}
          label="General Comment"
        />
        <Divider />

=======
          {/* CASE SUMMARY */}
        </div>
        <div>
          <div>
            <Form.Item label="Case Summary" name="caseSummary">
              <TextArea
                // autoSize={{
                //   minRows: 2,
                //   maxRows: 6,
                // }}
                rows={5}
                placeholder="Your case summary here..."
                maxLength={1000}
                className="w-96"
              />
            </Form.Item>
          </div>
          {/* GENERAL COMMENT */}
          {/* <TextDivider text="General Comments" /> */}
          <div>
            <Form.Item label="General Comment" name="generalComment">
              <TextArea
                rows={5}
                placeholder="Your comment here..."
                maxLength={1000}
                className="w-96"
              />
            </Form.Item>
          </div>
        </div>
>>>>>>> backup-my-case-app
        <Form.Item>
          <Button onClick={onSubmit} type="default" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

<<<<<<< HEAD
<<<<<<<< HEAD:frontend/src/pages/UpdateCase.jsx
export default UpdateCase;
========
export default CreateCaseForm;
>>>>>>>> backup-my-case-app:frontend/src/pages/CreateCaseForm.jsx
=======
export default UpdateCase;
>>>>>>> backup-my-case-app
