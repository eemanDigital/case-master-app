import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { DeleteOutlined } from "@ant-design/icons";
import {
  PartyDynamicInputs,
  DynamicInputArrays,
  TextAreaInput,
} from "../components/DynamicInputs";
// import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

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
import { useSingleDataFetcher } from "../hooks/useSingleDataFetcher";

const UpdateCase = () => {
  // destructure textarea from input
  const { TextArea } = Input;
  const params = useParams();
  // console.log("PARA", params.id);
  const [formData, setFormData] = useState({});
  const { users } = useDataGetterHook();
  // const [form] = Form.useForm();
  // destructor authenticate from useDataFetch
  // const { dataFetcher, data } = useDataFetch(); //general data fetcher
  const { singleData, singleDataFetcher } = useSingleDataFetcher();
  // console.log("SINGLE", singleData?.data);

  useEffect(() => {
    singleDataFetcher(`cases/${params.id}`);
  }, [params.id]);

  useEffect(() => {
    // singleDataFetcher(`cases/${params.id}`);
    if (singleData?.data) {
      setFormData((prevData) => ({
        ...prevData,
        ...singleData?.data,
      }));
    }
  }, []);
  console.log(formData?.firstParty?.description);

  // get single case data
  //  const getSingleCase = async () => {
  //     const res
  // }
  // useEffect(()=> {

  // }, [])

  //  get users/account officer's data
  const userData = Array.isArray(users?.data)
    ? users?.data.map((user) => {
        return {
          value: user?.fullName,
          label: user?.fullName,
        };
      })
    : [];

  // form submit functionalities
  // const handleSubmission = useCallback(
  //   (result) => {
  //     if (result?.error) {
  //       // Handle Error here
  //     } else {
  //       // Handle Success here
  //       // form.resetFields();
  //     }
  //   },
  //   []
  //   // [form]
  // );

  // submit data
  // const onSubmit = useCallback(async () => {
  //   let values;
  //   try {
  //     values = await form.validateFields(); // Validate the form fields
  //   } catch (errorInfo) {
  //     return;
  //   }
  //   const result = await dataFetcher(`cases/${params.id}`, "patch", values); // Submit the form data to the backend
  //   console.log(values);

  //   handleSubmission(result); // Handle the submission after the API Call
  // }, [form, handleSubmission, dataFetcher, params.id]);

  // filter function for Select
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <>
      <Form
        layout="vertical"
        // form={form}
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
          firstKeyVal="description"
          label="Description"
          placeholderVal="e.g. Plaintiff"
          secondKeyVal="name"
          firstInitialValue={formData?.firstParty?.description}
          secondInitialValue={formData?.firstParty?.name}
          thirdKeyVal="processesFiled"
          thirdInitialValue={formData?.firstParty?.processesFiled}
        />

        {/* SECOND PARTY FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Second Party</Typography.Title>
        </Divider>
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
                      label="Description"
                      name={[field.name, "description"]}
                      initialValue={formData.otherParty.description}>
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
                                    name={[subField.name, "name"]}
                                    initialValue={
                                      formData.otherParty[field.name]?.name[
                                        subField?.name
                                      ]?.name
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
              <Input />
            </Form.Item>
          </div>

          {/* WHETHER FILED BY THE OFFICE */}
          <Form.Item
            label="Switch if case is filed by the Office"
            valuePropName="checked"
            name="isFiledByTheOffice"
            initialValue={formData?.isFiledByTheOffice}>
            <Switch className="bg-gray-400 w-20" />
          </Form.Item>

          {/* NATURE OF CASE*/}
          <div>
            <Form.Item
              name="natureOfCase"
              label="Nature of Case"
              initialValue={formData?.natureOfCase}
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
              />
            </Form.Item>
          </div>

          {/* CASE CATEGORY */}
          <div>
            <Form.Item
              name="category"
              label="Case Category"
              initialValue={formData?.category}
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
              />
            </Form.Item>
          </div>

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
              className="w-[200px]"
              initialValue={formData?.accountOfficer?.name}>
              <Select
                // noStyle
                mode="multiple"
                placeholder="Select account officer"
                options={userData}
                allowClear
                // style={{
                //   width: "100%",
                // }}
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

        <Form.Item>
          {/* <Button onClick={onSubmit} type="default" htmlType="submit"> */}
          <Button type="default" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default UpdateCase;
