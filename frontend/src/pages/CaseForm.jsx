import { useState, useCallback, useEffect } from "react";
import { useDataFetch } from "../context/useDataFectch";
import { DeleteOutlined } from "@ant-design/icons";
import {
  PartyDynamicInputs,
  SelectInputs,
  DynamicInputArrays,
  TextAreaInput,
} from "../components/DynamicInputs";

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
    // task: [],
    accountOfficer: [""],
    client: [{ name: "" }],
    generalComment: "",
  });
  // destructor authenticate from useAuth
  const { dataFetcher, data } = useDataFetch();
  // const { firstName } = data;
  // console.log("USERS", data.data[3].firstName);

  //  get users/account officer's data
  const users = Array.isArray(data?.data)
    ? data?.data.map((user) => {
        return {
          value: user?.fullName,
          label: user?.fullName,
        };
      })
    : [];

  // console.log(users);

  // getAllUsers
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
        layout="vertical"
        form={form}
        name="dynamic_form_complex"
        // autoComplete="off"
        // initialValues={formData}
      >
        {/* FIRST PARTY FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>First Party</Typography.Title>
        </Divider>

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
              name="otherModeOfCommencement"
              initialValue={formData?.otherModeOfCommencement}>
              <Input />
            </Form.Item>
          </div>

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
          {/* OTHER COURT*/}
          <div>
            <Form.Item
              label="Specify Court"
              name="otherCourt"
              initialValue={formData?.otherCourt}>
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
              initialValue={formData?.accountOfficer}>
              <Select
                noStyle
                mode="multiple"
                placeholder="Select account officer"
                options={users}
                allowClear
                style={{
                  width: "100%",
                }}
              />
            </Form.Item>
          </div>

          {/* CLIENT */}
          <DynamicInputArrays
            parentKey="client"
            initialValue={formData?.client}
            label="Client"
          />

          {/* CASE UPDATE/REPORT */}
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>Case Update/ Report</Typography.Title>
          </Divider>

          <div className="">
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
