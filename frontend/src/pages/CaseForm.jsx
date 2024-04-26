import { useState, useCallback, useEffect } from "react";
import { useDataFetch } from "../context/useDataFectch";
import { DeleteOutlined } from "@ant-design/icons";

import {
  Button,
  Input,
  Form,
  Divider,
  Typography,
  Card,
  Space,
  DatePicker,
  Select,
} from "antd";
// import DeleteIcon from "../components/DeleteIcon";
// import { useAuth } from "../hooks/useAuth";
// import TextArea from "antd/es/input/TextArea";
import {
  courtOptions,
  statusOptions,
  casePriorityOptions,
  modesOptions,
} from "../data/options";

const CaseForm = () => {
  // destruture textarea from input
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
    accountOfficer: [{ name: "" }],
    client: [],
    generalComment: "",
  });
  // destructor authenticate from useAuth
  const { dataFetcher, data } = useDataFetch();
  // const { firstName } = data;
  // console.log("USERS", data.data[3].firstName);
  // const users = data?.data.map((user, index) => {
  //   console.log(user, index);
  // });

  // getAllUsers
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dataFetcher("users");
      } catch (err) {
        console.log(err);
      }
    };

    fetchData(); // Call the async function to fetch data
  }, []);

  // form submit functionalities
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
        <div className="flex flex-wrap justify-between ">
          <div>
            {/* firstParty title field */}

            <Form.Item
              name={["firstParty", "title"]}
              label="Title"
              rules={[
                {
                  required: true,
                  message: "Please provide the party's title",
                },
              ]}>
              <Input placeholder="e.g. Plaintiff" />
            </Form.Item>
          </div>

          <div>
            {/* firstParty description field */}
            <Form.List
              name={["firstParty", "description"]}
              initialValue={formData.firstParty.title}>
              {(nameFields, { add: addName, remove: removeName }) => (
                <div>
                  {nameFields.map(({ key, name, ...restField }) => (
                    <div key={key}>
                      <Form.Item
                        className="m-0 p-0"
                        {...restField}
                        name={[name, "name"]}
                        initialValue={
                          formData?.firstParty?.description[name]?.name
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
            {/* firstParty processFiled field */}

            <Form.List
              name={["firstParty", "processesFiled"]}
              // initialValue={[{ name: "" }]}
            >
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
                            formData?.firstParty?.processesFiled[name]?.name
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

        {/* SECOND PARTY FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Second Party</Typography.Title>
        </Divider>
        <div className="flex flex-wrap justify-between ">
          <div>
            {/* secondParty title field */}

            <Form.Item
              name={["secondParty", "title"]}
              initialValue={formData.secondParty.title}
              label="Title"
              rules={[
                {
                  required: true,
                  message: "Please provide the party's title",
                },
              ]}>
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

        <br />
        <br />
        <br />

        {/* OTHER PARTIES FIELD */}

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

        {/* SUIT NO FIELD */}
        <div>
          <Form.Item
            name="suitNo"
            label="Suit No."
            tooltip="This is a required field"
            initialValue={formData.suitNo}
            rules={[
              {
                required: true,
                message: "Please enter suit no!",
              },
            ]}>
            <Input />
          </Form.Item>
        </div>
        {/* MODE OF COMMENCEMENT */}
        <div>
          <Form.Item
            name="modeOfCommencement"
            label="Mode of Commencement"
            initialValue={formData.modeOfCommencement}>
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
              options={modesOptions}
            />
          </Form.Item>
        </div>

        {/* OTHER MODE OF COMMENCEMENT*/}
        <div>
          <Form.Item
            label="Specify Court"
            name="otherModeOfCommencement"
            initialValue={formData.otherModeOfCommencement}>
            <Input />
          </Form.Item>
        </div>

        {/* COURTS */}
        <div>
          <Form.Item
            name="courtName"
            label="Assigned Court"
            initialValue={formData.courtName}>
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
          <Form.Item
            label="Specify Court"
            name="otherCourt"
            initialValue={formData.otherCourt}>
            <Input />
          </Form.Item>
        </div>

        {/* NATURE OF CASE*/}
        <div>
          <Form.Item
            label="Nature of Case"
            name="natureOfCase"
            initialValue={formData.natureOfCase}>
            <Input />
          </Form.Item>
        </div>
        {/* CASE FILE NO FIELD */}
        <div>
          <Form.Item
            label="Case file Number"
            name="caseOfficeFileNo"
            initialValue={formData.caseOfficeFileNo}>
            <Input />
          </Form.Item>
        </div>

        {/* DATE FILED */}
        <div>
          <Form.Item name="filingDate" label="Filing Date">
            <DatePicker />
          </Form.Item>
        </div>

        {/* CASE STATUS */}
        <div>
          <Form.Item
            name="caseStatus"
            label="Case Status"
            initialValue={formData.caseStatus}>
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
              options={statusOptions}
            />
          </Form.Item>
        </div>

        {/* CASE PRIORITY */}
        <div>
          <Form.Item
            name="casePriority"
            label="Case Priority"
            initialValue={formData.casePriority}>
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

        {/* CASE SUMMARY */}
        <div>
          <Form.Item
            label="Case Summary"
            name="caseSummary"
            initialValue={formData.caseSummary}>
            <TextArea
              autoSize={{
                minRows: 2,
                maxRows: 6,
              }}
              rows={4}
              placeholder="Your case summary here..."
              maxLength={300}
            />
          </Form.Item>
        </div>

        {/* JUDGE FIELD */}
        <div>
          <div className="flex flex-wrap justify-between ">
            <div>
              <Form.List name="judge" noStyle>
                {(processesFiledFields, { add: add, remove: remove }) => (
                  <div>
                    {processesFiledFields.map(({ key, name, ...restField }) => {
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
                    })}
                    <Form.Item>
                      <Button onClick={() => add()}>+ Add Judge</Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </div>
          </div>
        </div>
        {/* CASE STRENGTH */}
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
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </div>
          </div>
        </div>
        {/* CASE WEAKNESS */}
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
                            initialValue={formData?.caseWeaknesses[name]?.name}
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
        </div>
        {/* STEPS TO BE TAKEN FIELD */}
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

        {/* ACCOUNT OFFICER */}
        <div>
          <div className="flex flex-wrap justify-between ">
            <div>
              <Form.List name="accountOfficer" noStyle>
                {(fields, { add, remove }) => (
                  <div>
                    {fields.map(({ key, name, ...restField }) => {
                      return (
                        <div key={key}>
                          <Form.Item
                            className="m-0 p-0"
                            {...restField}
                            name={[name, "name"]}
                            initialValue={formData?.accountOfficer[name]?.name}
                            label={`${key + 1}- Account Officer`}>
                            <Space.Compact>
                              <Select
                                showSearch
                                style={{
                                  width: 200,
                                }}
                                placeholder="Search to Select"
                                options={data?.data.map((user, index) => ({
                                  value: `${user.firstName} ${user.lastName}`,
                                  label: `${user.firstName} ${user.lastName}`,
                                }))}
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
                    })}
                    <Form.Item>
                      <Button onClick={() => add()}>
                        + Add Account Officer
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </div>
          </div>
        </div>

        {/* CLIENT */}
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

        {/* GENERAL COMMENT */}
        <div>
          <Form.Item
            label="General Comment"
            name="generalComment"
            initialValue={formData.generalComment}>
            <TextArea
              rows={4}
              placeholder="Your comment here..."
              maxLength={300}
            />
          </Form.Item>
        </div>

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
