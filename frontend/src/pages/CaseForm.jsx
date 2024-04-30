import { useState, useCallback, useEffect } from "react";
import { useDataFetch } from "../context/useDataFetch";
import { DeleteOutlined } from "@ant-design/icons";
<<<<<<< HEAD
import TextDivider from "../components/TextDivider";
// import DebounceSelect from "../components/DebounceSelect";

import { Button, Input, Form, Card, Space, DatePicker, Select } from "antd";
// import DeleteIcon from "../components/DeleteIcon";
// import { useAuth } from "../hooks/useAuth";
// import TextArea from "antd/es/input/TextArea";
=======
import {
  PartyDynamicInputs,
  SelectInputs,
  DynamicInputArrays,
  TextAreaInput,
} from "../components/DynamicInputs";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

import {
  Button,
  Input,
  Form,
  Divider,
  Typography,
  Card,
  Select,
  Space,
  DatePicker,
} from "antd";

>>>>>>> refactor_field
import {
  courtOptions,
  statusOptions,
  casePriorityOptions,
  modesOptions,
} from "../data/options";

const CaseForm = () => {
  // destructure textarea from input
  const { TextArea } = Input;

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    firstParty: {
      title: "",
      description: [{ name: "" }],
      processesFiled: [{ name: "" }],
    },
    secondParty: {
      title: "",
      description: [{ name: "" }],
      processesFiled: [{ name: "" }],
    },
    otherParty: [
      {
        title: "",
        description: [{ name: "" }],
        processesFiled: [{ name: "" }],
      },
    ],
    suitNo: "",
    caseOfficeFileNo: "",
    courtName: "",
    otherCourt: "",
    judge: [{ name: "" }],
    caseSummary: "",
    caseStatus: "",
    natureOfCase: "",
    filingDate: "",
    modeOfCommencement: "",
    otherModeOfCommencement: "",
    caseStrengths: [],
    caseWeaknesses: [],
    casePriority: "",
    stepToBeTaken: [],
    caseUpdates: [{ date: "", update: "" }],
<<<<<<< HEAD
    listOfJudicialAuthorities: [{ name: "" }],
    listOfStatutoryAuthorities: [{ name: "" }],
    accountOfficer: [{ name: "" }],
=======
    // task: [],
    accountOfficer: [],
>>>>>>> refactor_field
    client: [{ name: "" }],
    generalComment: "",
  });
  // destructure dataFetcher from useDataFetch
  const { dataFetcher, data } = useDataFetch();
<<<<<<< HEAD

  // fetch all user/accountOfficers
  const fetchData = async () => {
    try {
      await dataFetcher("users");
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    fetchData(); // Call the async function to fetch data
  }, []);

  // checks if data?.data (users/accountOfficers) is an array before mapping, otherwise, assigns an empty array [] to users
  const users = Array.isArray(data?.data)
    ? data.data.map((user) => ({
        value: user?.fullName,
        label: user?.fullName,
      }))
=======
  // destructure user data for accountOfficers
  const { users } = useDataGetterHook();

  //  get users/account officer's data
  const userData = Array.isArray(users?.data)
    ? users?.data.map((user) => {
        return {
          value: user?.fullName,
          label: user?.fullName,
        };
      })
>>>>>>> refactor_field
    : [];

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
    const result = await dataFetcher("cases", "POST", values); // Submit the form data to the backend
    console.log(values);
    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher]);

  return (
    <>
      <Form
        className="h-[100%]"
        layout="vertical"
        form={form}
        name="dynamic_form_complex"
        // autoComplete="off"
        // initialValues={formData}
      >
        {/* FIRST PARTY FIELD */}
<<<<<<< HEAD
        <TextDivider text="First Party" />
        <div className="flex flex-wrap justify-between ">
          <div>
            {/* firstParty title field */}
=======
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>First Party</Typography.Title>
        </Divider>
>>>>>>> refactor_field

        <PartyDynamicInputs
          parentKey="firstParty"
          firstKeyVal="title"
          label="Title"
          placeholderVal="e.g. Plaintiff"
          secondKeyVal="description"
          firstInitialValue={formData?.firstParty?.title}
          secondInitialValue={formData?.firstParty?.description}
          thirdKeyVal="processesFiled"
          thirdInitialValue={formData?.firstParty?.processesFiled}
        />

        {/* SECOND PARTY FIELD */}
<<<<<<< HEAD
        <TextDivider text="Second Party" />

        <div className="flex flex-wrap justify-between  ">
          <div>
            {/* secondParty title field */}

            <Form.Item
              name={["secondParty", "title"]}
              initialValue={formData?.secondParty?.title}
              label="Title"
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

          <div>
            {/* secondParty description field */}

            <Form.List name={["secondParty", "description"]}>
              {(nameFields, { add: addName, remove: removeName }) => (
                <div>
                  {nameFields.map(({ key, name, ...restField }) => (
                    <div key={key}>
                      <Form.Item
                        className="m-0 p-0"
                        {...restField}
                        name={[name, "name"]}
                        initialValue={
                          formData?.secondParty?.description[name]?.name
                        }
                        rules={[
                          {
                            required: true,
                            message: "Parties name(es) is required",
                          },
                        ]}
                        label={`${key + 1}- Party's Name`}>
                        <Space.Compact className="flex  justify-center item-center">
                          <Input
                            placeholder="enter party's name(s)"
                            className="h-8"
                          />{" "}
                          <Form.Item onClick={() => removeName(name)}>
                            <Button>
                              <DeleteOutlined className="text-red-700" />
                            </Button>
                          </Form.Item>
                        </Space.Compact>
                      </Form.Item>
                      <div></div>
                    </div>
                  ))}
                  <Form.Item onClick={() => addName()}>
                    <Button className="">+ Add Name</Button>
                  </Form.Item>
                </div>
              )}
            </Form.List>
          </div>

          <div>
            {/* secondParty processesFiled field */}

            <Form.List name={["secondParty", "processesFiled"]}>
              {(
                processesFiledFields,
                { add: addProcess, remove: removeProcess }
              ) => (
                <div>
                  {processesFiledFields.map(({ key, name, ...restField }) => {
                    return (
                      <div key={key}>
                        <Form.Item
                          className="m-0 p-0"
                          {...restField}
                          name={[name, "name"]}
                          initialValue={
                            formData?.secondParty?.processesFiled[name]?.name
                          }
                          label={`${key + 1}- Process Filed`}>
                          <Space.Compact>
                            <Input
                              placeholder="Enter process field"
                              className="h-8"
                            />
                            <Form.Item onClick={() => removeProcess(name)}>
                              <Button>
                                <DeleteOutlined className="text-red-700" />
                              </Button>
                            </Form.Item>
                          </Space.Compact>
                        </Form.Item>
                      </div>
                    );
                  })}
                  <Form.Item>
                    <Button onClick={() => addProcess()}>+ Add Process</Button>
                  </Form.Item>
                </div>
              )}
            </Form.List>
          </div>
        </div>

        {/* OTHER PARTIES FIELD */}
        <TextDivider text="Other Party" />

=======
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Second Party</Typography.Title>
        </Divider>
        <PartyDynamicInputs
          parentKey="secondParty"
          firstKeyVal="title"
          label="Title"
          placeholderVal="e.g. Defendant"
          secondKeyVal="description"
          firstInitialValue={formData?.secondParty?.title}
          secondInitialValue={formData?.secondParty?.description}
          thirdKeyVal="processesFiled"
          thirdInitialValue={formData?.secondParty?.processesFiled}
        />

        {/* OTHER PARTIES FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Other Party</Typography.Title>
        </Divider>
>>>>>>> refactor_field
        <div className="">
          <Form.List name="otherParty">
            {(fields, { add, remove }) => (
              <div>
                {fields.map((field) => (
                  <Card
                    className=""
                    size="small"
                    title={`Other Parties ${field.name + 1}`}
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
                      label="Title"
                      name={[field.name, "title"]}
                      initialValue={formData.otherParty.title}>
                      <Input />
                    </Form.Item>

                    {/* Nest Form.otherParty */}
                    <div className="flex justify-between  items-center">
                      <Form.Item label="Name" noStyle>
                        {/* otherParty description field */}
                        <Form.List name={[field.name, "description"]}>
                          {(subFields, { add, remove }) => (
                            <div>
                              {subFields.map((subField) => (
                                <Space.Compact
                                  key={subField.key}
                                  className="flex my-2">
                                  <Form.Item
                                    noStyle
                                    name={[subField.name, "name"]}
                                    initialValue={
                                      formData.otherParty[field.name]
                                        ?.description[subField?.name]?.name
                                    }>
                                    <Input placeholder="Enter Party's description" />
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
                                + Add Description
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
                                    name={[subField.name, "name"]}
                                    initialValue={
                                      formData.otherParty[field.name]
                                        ?.processesFiled[subField.name]?.name
                                    }>
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
        <Divider />

<<<<<<< HEAD
        <div className="flex flex-wrap  justify-around gap-14 items-center mt-7">
          {/* SUIT NO FIELD */}
          {/* <TextDivider text="Suit No" /> */}
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
          {/* MODE OF COMMENCEMENT */}
          {/* <TextDivider text="Mode of Commencement" /> */}
          <div>
            <Form.Item
              name="modeOfCommencement"
              label="Mode of Commencement"
              initialValue={formData?.modeOfCommencement}>
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
=======
        {/* SUIT NO FIELD */}
        <div className="flex justify-between items-center gap-9 flex-wrap">
          {/* MODE OF COMMENCEMENT */}
          <SelectInputs
            fieldName="modeOfCommencement"
            label="Mode of Commencement"
            initialValue={formData?.modeOfCommencement}
            options={modesOptions}
          />
          {/* OTHER MODE OF COMMENCEMENT*/}
          <div>
            <Form.Item
              label="Specify Court"
>>>>>>> refactor_field
              name="otherModeOfCommencement"
              initialValue={formData?.otherModeOfCommencement}>
              <Input />
            </Form.Item>
          </div>

<<<<<<< HEAD
          {/* COURTS */}
          {/* <TextDivider text="Court" /> */}
          <div>
            <Form.Item
              name="courtName"
              label="Assigned Court"
              initialValue={formData?.courtName}>
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
=======
          {/* NATURE OF CASE*/}
          <div>
            <Form.Item
              label="Nature of Case"
              name="natureOfCase"
              initialValue={formData?.natureOfCase}>
              <Input placeholder="e.g. Breach of Contract" />
            </Form.Item>
          </div>

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
          <SelectInputs
            fieldName="courtName"
            label="Assigned Court"
            initialValue={formData?.courtName}
            options={courtOptions}
          />
>>>>>>> refactor_field
          {/* OTHER COURT*/}
          <div>
            <Form.Item
              label="Specify Court"
              name="otherCourt"
              initialValue={formData?.otherCourt}>
              <Input />
            </Form.Item>
          </div>
<<<<<<< HEAD
          {/* JUDGE FIELD */}
          {/* <TextDivider text="Judges/Justices" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="judge" noStyle>
                  {(processesFiledFields, { add: add, remove: remove }) => (
                    <div>
                      {processesFiledFields.map(
                        ({ key, name, ...restField }) => {
                          return (
                            <div key={key}>
                              <Form.Item
                                className="m-0 p-0"
                                {...restField}
                                name={[name, "name"]}
                                initialValue={formData?.judge[name]?.name}
                                label={`${key + 1}- Judge`}>
                                <Space.Compact>
                                  <Input
                                    placeholder="Enter the name of the judge"
                                    className="h-8"
                                  />
                                  <Form.Item onClick={() => remove(name)}>
                                    <Button>
                                      <DeleteOutlined className="text-red-700" />
                                    </Button>
                                  </Form.Item>
                                </Space.Compact>
                              </Form.Item>
                            </div>
                          );
                        }
                      )}
                      <Form.Item>
                        <Button onClick={() => add()}>+ Add Judge</Button>
                      </Form.Item>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
          </div>
          {/* NATURE OF CASE*/}
          {/* <TextDivider text="Nature of Case" /> */}
          <div>
            <Form.Item
              label="Nature of Case"
              name="natureOfCase"
              initialValue={formData?.natureOfCase}>
              <Input />
            </Form.Item>
          </div>

          {/* CASE FILE NO FIELD */}
          {/* <TextDivider text="Case file Number" /> */}
=======

          {/* CASE FILE NO FIELD */}
>>>>>>> refactor_field
          <div>
            <Form.Item
              label="Case file Number"
              name="caseOfficeFileNo"
              initialValue={formData?.caseOfficeFileNo}>
              <Input />
            </Form.Item>
          </div>
<<<<<<< HEAD

          {/* DATE FILED */}
          {/* <TextDivider text="Filing Date" /> */}
          <div>
            <Form.Item name="filingDate" label="Filing Date">
              <DatePicker />
            </Form.Item>
          </div>

          {/* CASE STATUS */}
          {/* <TextDivider text="Case Status" /> */}
          <div>
            <Form.Item
              name="caseStatus"
              label="Case Status"
              initialValue={formData?.caseStatus}>
              <Select
                style={{
                  width: 200,
                }}
                options={statusOptions}
=======
          <Divider />
          {/* CASE STATUS */}
          <SelectInputs
            name="caseStatus"
            label="Case Status"
            initialValue={formData?.caseStatus}
            options={statusOptions}
          />

          {/* CASE PRIORITY */}
          <SelectInputs
            name="casePriority"
            label="Case Priority"
            initialValue={formData?.casePriority}
            options={casePriorityOptions}
          />

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

          {/* ACCOUNT OFFICER */}
          {/* <TextDivider text="Account Officer(s)" /> */}
          <div>
            <Form.Item
              name="accountOfficer"
              label="Account Officer"
              initialValue={formData?.accountOfficer.name}>
              <Select
                noStyle
                mode="multiple"
                placeholder="Select account officer"
                options={userData}
                allowClear
                style={{
                  width: "100%",
                }}
>>>>>>> refactor_field
              />
            </Form.Item>
          </div>

<<<<<<< HEAD
          {/* CASE PRIORITY */}
          {/* <TextDivider text="Case Priority/ Rating" /> */}
          <div>
            <Form.Item
              label="Case Priority/ Rating"
              name="casePriority"
              initialValue={formData?.casePriority}>
              <Select
                showSearch
                style={{
                  width: 200,
                }}
                placeholder="Search to Select"
                options={casePriorityOptions}
              />
            </Form.Item>
          </div>

          {/* CASE STRENGTH */}
          {/* <TextDivider text="Case Strengths" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="caseStrengths" noStyle>
                  {(fields, { add: add, remove: remove }) => (
                    <div>
                      {fields.map(({ key, name, ...restField }) => {
                        return (
                          <div key={key}>
                            <Form.Item
                              className="m-0 p-0"
                              {...restField}
                              name={[name, "name"]}
                              initialValue={formData?.caseStrengths[name]?.name}
                              label={`${key + 1}- Strength`}>
                              <Space.Compact>
                                <Input placeholder="" className="h-8" />
                                <Form.Item onClick={() => remove(name)}>
                                  <Button>
                                    <DeleteOutlined className="text-red-700" />
                                  </Button>
                                </Form.Item>
                              </Space.Compact>
                            </Form.Item>
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button onClick={() => add()}>
                          + Add Case&apos;s Strengths
=======
          {/* CLIENT */}
          <DynamicInputArrays
            parentKey="client"
            initialValue={formData?.client}
            label="Client"
          />

          {/* CASE UPDATE/REPORT */}
          {/* <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>Case Update/ Report</Typography.Title>
          </Divider> */}

          {/* <div className="">
            <div>
              <Form.List name="caseUpdates">
                {(fields, { add, remove }) => (
                  <div>
                    {fields.map((field) => (
                      <Space.Compact
                        key={field.key}
                        className="flex justify-center items-center my-2">
                        <div className="flex flex-col  items-center gap-5">
                          <div>
                            <Form.Item
                              noStyle
                              className=" w-4/5"
                              name={[field.name, "date"]}
                              initialValue={
                                formData?.caseUpdates[field.name]?.date
                              }>
                              <DatePicker placeholder="Select Date" />
                            </Form.Item>
                          </div>
                          <div>
                            <Form.Item
                              noStyle
                              name={[field.name, "update"]}
                              initialValue={
                                formData?.caseUpdates[field.name]?.update
                              }>
                              <TextArea
                                placeholder="Enter Update"
                                className="w-96 "
                              />
                            </Form.Item>
                          </div>
                        </div>
                        <Button>
                          <DeleteOutlined
                            className="text-red-700"
                            onClick={() => {
                              remove(field.name);
                            }}
                          />
>>>>>>> refactor_field
                        </Button>
                      </Form.Item>
                    </div>
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
                <Form.List name="caseWeaknesses" noStyle>
                  {(fields, { add: add, remove: remove }) => (
                    <div>
                      {fields.map(({ key, name, ...restField }) => {
                        return (
                          <div key={key}>
                            <Form.Item
                              className="m-0 p-0"
                              {...restField}
                              name={[name, "name"]}
                              initialValue={
                                formData?.caseWeaknesses[name]?.name
                              }
                              label={`${key + 1}- Weakness`}>
                              <Space.Compact>
                                <Input placeholder="" className="h-8" />
                                <Form.Item onClick={() => remove(name)}>
                                  <Button>
                                    <DeleteOutlined className="text-red-700" />
                                  </Button>
                                </Form.Item>
                              </Space.Compact>
                            </Form.Item>
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button onClick={() => add()}>
                          + Add Case&apos;s Weaknesses
                        </Button>
                      </Form.Item>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
<<<<<<< HEAD
          </div>

          {/* STEPS TO BE TAKEN FIELD */}
          {/* <TextDivider text="Steps/Case Strategies" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="stepToBeTaken" noStyle>
                  {(fields, { add: add, remove: remove }) => (
                    <div>
                      {fields.map(({ key, name, ...restField }) => {
                        return (
                          <div key={key}>
                            <Form.Item
                              className="m-0 p-0"
                              {...restField}
                              name={[name, "name"]}
                              initialValue={formData?.stepToBeTaken[name]?.name}
                              label={`${key + 1}- Step`}>
                              <Space.Compact>
                                <Input placeholder="" className="h-8" />
                                <Form.Item onClick={() => remove(name)}>
                                  <Button>
                                    <DeleteOutlined className="text-red-700" />
                                  </Button>
                                </Form.Item>
                              </Space.Compact>
                            </Form.Item>
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button onClick={() => add()}>+ Add Steps</Button>
                      </Form.Item>
                    </div>
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
                <Form.List name="client" noStyle>
                  {(fields, { add: add, remove: remove }) => (
                    <div>
                      {fields.map(({ key, name, ...restField }) => {
                        return (
                          <div key={key}>
                            <Form.Item
                              className="m-0 p-0"
                              {...restField}
                              name={[name, "name"]}
                              initialValue={formData?.client[name]?.name}
                              label={`${key + 1}- Client`}>
                              <Space.Compact>
                                <Input placeholder="" className="h-8" />
                                <Form.Item onClick={() => remove(name)}>
                                  <Button>
                                    <DeleteOutlined className="text-red-700" />
                                  </Button>
                                </Form.Item>
                              </Space.Compact>
                            </Form.Item>
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button onClick={() => add()}>+ Add Clients</Button>
                      </Form.Item>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
          </div>

          {/* CASE UPDATE/REPORT */}
          {/* <TextDivider text="Case Update/Report" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="caseUpdates">
                  {(fields, { add, remove }) => (
                    <div>
                      {fields.map((field) => (
                        <Space.Compact key={field.key} className="flex my-2">
                          <Form.Item
                            noStyle
                            label="Case Update/Report"
                            name={[field.name, "date"]}
                            initialValue={
                              formData?.caseUpdates[field.name]?.date
                            }>
                            <DatePicker placeholder="Select Date" />
                          </Form.Item>
                          <Form.Item
                            noStyle
                            name={[field.name, "update"]}
                            initialValue={
                              formData?.caseUpdates[field.name]?.update
                            }>
                            <TextArea placeholder="Enter Update" />
                          </Form.Item>
                          <Button>
                            <DeleteOutlined
                              className="text-red-700"
                              onClick={() => {
                                remove(field.name);
                              }}
                            />
                          </Button>
                        </Space.Compact>
                      ))}
                      <Button type="dashed" onClick={() => add()}>
                        + Add Update
                      </Button>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
          </div>

          {/* JUDICIAL AUTHORITIES IN SUPPORT */}
          {/* <TextDivider text="Judicial Authorities" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="listOfJudicialAuthorities" noStyle>
                  {(fields, { add, remove }) => (
                    <div>
                      {fields.map(({ key, name, ...restField }) => {
                        return (
                          <div key={key}>
                            <Form.Item
                              className="m-0 p-0"
                              {...restField}
                              name={[name, "name"]}
                              initialValue={
                                formData?.listOfJudicialAuthorities[name]?.name
                              }
                              label={`${key + 1}- Case`}>
                              <Space.Compact>
                                <Input placeholder="" className="h-8" />
                                <Form.Item onClick={() => remove(name)}>
                                  <Button>
                                    <DeleteOutlined className="text-red-700" />
                                  </Button>
                                </Form.Item>
                              </Space.Compact>
                            </Form.Item>
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button onClick={() => add()}>+ Add Case</Button>
                      </Form.Item>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
          </div>

          {/* ACCOUNT OFFICER */}
          {/* <TextDivider text="Account Officer(s)" /> */}
          <div>
            <Form.Item
              name="accountOfficer"
              label="Account Officer"
              initialValue={formData?.accountOfficer}>
              <Select
                noStyle
                mode="multiple"
                placeholder="Select users"
                options={users}
                allowClear
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>
          </div>
          {/* STATUTORY AUTHORITIES IN SUPPORT */}
          {/* <TextDivider text="Statutory Authorities" /> */}
          <div>
            <div className="flex flex-wrap justify-between ">
              <div>
                <Form.List name="listOfStatutoryAuthorities" noStyle>
                  {(fields, { add, remove }) => (
                    <div>
                      {fields.map(({ key, name, ...restField }) => {
                        return (
                          <div key={key}>
                            <Form.Item
                              className="m-0 p-0"
                              {...restField}
                              name={[name, "name"]}
                              initialValue={
                                formData?.listOfStatutoryAuthorities[name]?.name
                              }
                              label={`${key + 1}- Case`}>
                              <Space.Compact>
                                <Input placeholder="" className="h-8" />
                                <Form.Item onClick={() => remove(name)}>
                                  <Button>
                                    <DeleteOutlined className="text-red-700" />
                                  </Button>
                                </Form.Item>
                              </Space.Compact>
                            </Form.Item>
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button onClick={() => add()}>+ Add Statute</Button>
                      </Form.Item>
                    </div>
                  )}
                </Form.List>
              </div>
            </div>
          </div>
          {/* CASE SUMMARY */}
        </div>
        <div>
          <div>
            <Form.Item
              label="Case Summary"
              name="caseSummary"
              initialValue={formData?.caseSummary}>
              <TextArea
                // autoSize={{
                //   minRows: 2,
                //   maxRows: 6,
                // }}
                rows={5}
                placeholder="Your case summary here..."
                maxLength={300}
                className="w-96"
              />
            </Form.Item>
          </div>
          {/* GENERAL COMMENT */}
          {/* <TextDivider text="General Comments" /> */}
          <div>
            <Form.Item
              label="General Comment"
              name="generalComment"
              initialValue={formData?.generalComment}>
              <TextArea
                rows={5}
                placeholder="Your comment here..."
                maxLength={300}
                className="w-96"
              />
            </Form.Item>
          </div>
        </div>
=======
          </div> */}
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

>>>>>>> refactor_field
        <Form.Item>
          <Button onClick={onSubmit} type="default" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default CaseForm;
