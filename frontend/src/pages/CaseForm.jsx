import { useState } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import {
  Button,
  Flex,
  Input,
  Form,
  Divider,
  Typography,
  Row,
  Col,
  Card,
  Space,
} from "antd";
import DeleteIcon from "../components/DeleteIcon";
import { useAuth } from "../hooks/useAuth";

const CaseForm = () => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    firstParty: {
      title: "",
      name: [],
      processesFiled: [],
    },
    secondParty: {
      title: "",
      name: [],
      processesFiled: [],
    },
    otherParty: {
      title: "",
      name: [],
      processesFiled: [],
    },
  });
  const { authenticate } = useAuth();

  const onFinish = (values) => {
    console.log(values);

    authenticate("cases", "POST", values);
  };

  return (
    <>
      <Form
        layout="vertical"
        form={form}
        name="dynamic_form_complex"
        // autoComplete="off"
        initialValues={{
          items: [{}],
        }}
        onFinish={onFinish}>
        {/* FIRST PARTY FIELD */}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>First Party</Typography.Title>
        </Divider>
        <div className="flex flex-wrap justify-between ">
          <div>
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
            <Form.List
              name={["firstParty", "description", 0]}
              initialValue={[{ name: "" }]}>
              {(nameFields, { add: addName, remove: removeName }) => (
                <div>
                  {nameFields.map(({ key, name, ...restField }) => (
                    <div key={key}>
                      <Form.Item
                        className="m-0 p-0"
                        {...restField}
                        name={[name, "name"]}
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
            <Form.List
              name={["firstParty", "processesFiled", 0]}
              initialValue={[{ name: "" }]}>
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
            <Form.Item
              name={["secondParty", "title"]}
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
            <Form.List
              name={["secondParty", "description", 0]}
              initialValue={[{ name: "" }]}>
              {(nameFields, { add: addName, remove: removeName }) => (
                <div>
                  {nameFields.map(({ key, name, ...restField }) => (
                    <div key={key}>
                      <Form.Item
                        className="m-0 p-0"
                        {...restField}
                        name={[name, "name"]}
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
            <Form.List
              name={["secondParty", "processesFiled", 0]}
              initialValue={[{ name: "" }]}>
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
                    <DeleteOutlined
                      className="text-red-700"
                      onClick={() => {
                        remove(field.name);
                      }}
                    />
                  }>
                  <Form.Item label="Title" name={[field.name, "title"]}>
                    <Input />
                  </Form.Item>

                  {/* Nest Form.otherParty */}
                  <div className="flex justify-between  items-center">
                    <Form.Item label="Name" noStyle>
                      <Form.List name={[field.name, "description", 0]}>
                        {(subFields, subOpt) => (
                          <div>
                            {subFields.map((subField) => (
                              <Space.Compact
                                key={subField.key}
                                className="flex my-2 ">
                                <Form.Item
                                  noStyle
                                  name={[subField.name, "name"]}>
                                  <Input placeholder="Enter Party's name" />
                                </Form.Item>
                                <Button>
                                  <DeleteOutlined
                                    className="text-red-700"
                                    onClick={() => {
                                      subOpt.remove(subField.name);
                                    }}
                                  />
                                </Button>
                              </Space.Compact>
                            ))}
                            <Button type="dashed" onClick={() => subOpt.add()}>
                              + Add Name
                            </Button>
                          </div>
                        )}
                      </Form.List>

                      {/* other party processes */}

                      <Form.List name={[field.name, "processesFiled", 0]}>
                        {(subFields, subOpt) => (
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
                                      subOpt.remove(subField.name);
                                    }}
                                  />
                                </Button>
                              </Space.Compact>
                            ))}
                            <Button type="dashed" onClick={() => subOpt.add()}>
                              + Add Processes
                            </Button>
                          </div>
                        )}
                      </Form.List>
                    </Form.Item>
                  </div>
                </Card>
              ))}

              <Button type="dashed" onClick={() => add()}>
                + Add Item
              </Button>
            </div>
          )}
        </Form.List>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default CaseForm;
