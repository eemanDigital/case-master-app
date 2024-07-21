import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import {
  DeleteOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import axios from "axios";

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

const baseURL = import.meta.env.VITE_BASE_URL;
const UpdateCase = () => {
  const { TextArea } = Input;
  const { id } = useParams();

  // custom hook to handle form submission
  const {
    form,
    onSubmit,
    data,
    loading: loadingState,
    error,
  } = useHandleSubmit(`cases/${id}`, "patch");

  const { userData } = useUserSelectOptions();
  const { clientOptions } = useClientSelectOptions();

  // console.log(id);
  // const { singleData, singleDataFetcher } = useSingleDataFetcher();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/cases/${id}`, {
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
        {/* FIRST PARTY FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>First Party</Typography.Title>
        </Divider>
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

        {/* SECOND PARTY FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Second Party</Typography.Title>
        </Divider>
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
                    title={`Party ${field.name + 1}`}
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
                      name={[field.name, "description"]}>
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
                                    name={[subField.name, "name"]}>
                                    <Input placeholder="Enter Party's name" />
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
                                    name={[subField.name, "name"]}>
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
              <Input />
            </Form.Item>
          </div>

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
          {/* NATURE OF CASE*/}
          <div>
            <Form.Item
              name="natureOfCase"
              label="Nature of Case"
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
              />
            </Form.Item>
          </div>

          {/* CASE CATEGORY */}
          <div>
            <Form.Item
              name="category"
              label="Case Category"
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
              />
            </Form.Item>
          </div>

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

          {/* ACCOUNT OFFICER */}
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
          <div>
            <Form.Item
              name="client"
              label="Client"
              className="w-[200px]"
              initialValue={formData?.client}>
              <Select
                // noStyle
                mode="multiple"
                placeholder="Select client..."
                options={clientOptions}
                allowClear
                // style={{
                //   width: "100%",
                // }}
              />
            </Form.Item>
          </div>

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
        <Form.Item>
          <Button onClick={onSubmit} type="default" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default UpdateCase;
