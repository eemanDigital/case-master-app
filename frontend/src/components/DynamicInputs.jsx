import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Form, Space, Select } from "antd";
import ReactQuill from "react-quill";
import { formats } from "../utils/quillFormat";

export const PartyDynamicInputs = ({
  parentKey,
  firstKeyVal,
  label,
  secondKeyVal,
  thirdKeyVal,
  placeholderVal,
  firstInitialValue,
  secondInitialValue,
  thirdInitialValue,
  rules,
}) => {
  return (
    <div className="flex flex-wrap justify-between ">
      <div>
        {/* title field */}
        <Form.Item
          //   name={[parentKey, "title"]}
          name={[parentKey, firstKeyVal]}
          label={label}
          rules={[
            {
              required: true,
              message: "Please provide the party's title",
            },
          ]}>
          <Input placeholder={placeholderVal} />
        </Form.Item>
      </div>

      <div>
        {/* description field */}
        <Form.List
          name={[parentKey, secondKeyVal]}
          initialValue={firstInitialValue}>
          {(nameFields, { add, remove }) => (
            <div>
              {nameFields.map(({ key, name, ...restField }) => (
                <div key={key}>
                  <Form.Item
                    className="m-0 p-0"
                    {...restField}
                    name={[name, "name"]}
                    initialValue={secondInitialValue[name]?.name}
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
                      <Form.Item onClick={() => remove(name)}>
                        <Button>
                          <DeleteOutlined className="text-red-700" />
                        </Button>
                      </Form.Item>
                    </Space.Compact>
                  </Form.Item>
                  <div></div>
                </div>
              ))}
              <Form.Item onClick={() => add()}>
                <Button className="">+ Add Name</Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
      </div>

      <div>
        {/*processFiled field */}

        <Form.List
          name={[parentKey, thirdKeyVal]}
          // initialValue={[{ name: "" }]}
        >
          {(processesFiledFields, { add, remove }) => (
            <div>
              {processesFiledFields.map(({ key, name, ...restField }) => {
                return (
                  <div key={key}>
                    <Form.Item
                      className="m-0 p-0"
                      {...restField}
                      name={[name, "name"]}
                      initialValue={thirdInitialValue[name]?.name}
                      label={`${key + 1}- Process Filed`}>
                      <Space.Compact>
                        <Input
                          placeholder="Enter process field"
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
                <Button onClick={() => add()}>+ Add Process</Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
      </div>
    </div>
  );
};

// const onSearch = (value) => {
//   console.log("search:", value);
// };

// Filter `option.label` match the user type `input`

export const SelectInputs = ({
  fieldName,
  label,
  initialValue,
  defaultValue,
  options,
  mode,
  rules,
}) => {
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  return (
    <div>
      <Form.Item
        name={fieldName}
        label={label}
        defaultValue={defaultValue}
        rules={rules}
        initialValue={initialValue}>
        <Select
          mode={mode}
          showSearch
          // onSearch={onSearch}
          filterOption={filterOption}
          style={{
            width: 200,
          }}
          placeholder="Search to Select"
          optionFilterProp="children"
          options={options}
        />
      </Form.Item>
    </div>
  );
};

export const DynamicInputArrays = ({
  parentKey,
  initialValue,
  label,
  placeholder,
}) => {
  return (
    <div>
      <div className="flex flex-wrap justify-between ">
        <Form.List name={parentKey} noStyle>
          {(fields, { add, remove }) => (
            <div>
              {Array.isArray(fields)
                ? fields.map(({ key, name, ...restField }) => {
                    return (
                      <div key={key}>
                        <Form.Item
                          className="m-0 p-0"
                          {...restField}
                          name={[name, "name"]}
                          // initialValue={initialValue[name]?.name}
                          label={`${key + 1}- ${label}`}>
                          <Space.Compact>
                            <Input placeholder={placeholder} className="h-8" />
                            <Form.Item onClick={() => remove(name)}>
                              <Button>
                                <DeleteOutlined className="text-red-700" />
                              </Button>
                            </Form.Item>
                          </Space.Compact>
                        </Form.Item>
                      </div>
                    );
                  })
                : []}
              <Form.Item>
                <Button onClick={() => add()}>+ Add {label}</Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
      </div>
    </div>
  );
};

export const TextAreaInput = ({ fieldName, label, initialValue }) => {
  const { TextArea } = Input;

  return (
    <div>
      <Form.Item label={label} name={fieldName} initialValue={initialValue}>
        {/* <TextArea
          autoSize={{
            minRows: 2,
            maxRows: 6,
          }}
          rows={4}
          placeholder="Your text here..."
          // maxLength={300}
        /> */}
        <ReactQuill className="h-[200px] mb-7" theme="snow" formats={formats} />
      </Form.Item>
    </div>
  );
};
