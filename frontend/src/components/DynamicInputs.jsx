import PropTypes from "prop-types";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Form, Space, Select } from "antd";
import ReactQuill from "react-quill";
import { formats } from "../utils/quillFormat";

// Dynamic Inputs
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
          rules={rules}>
          <Input placeholder={placeholderVal} />
        </Form.Item>
      </div>

      <div>
        {/* description field */}
        <Form.List
          name={[parentKey, secondKeyVal]}
          initialValue={firstInitialValue}
          rules={rules}>
          {(nameFields, { add, remove }) => (
            <div>
              {nameFields.map(({ key, name, ...restField }) => (
                <div key={key}>
                  <Form.Item
                    className="m-0 p-0"
                    {...restField}
                    name={[name, "name"]}
                    initialValue={secondInitialValue[name]?.name}
                    rules={rules}
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
                      rules={rules}
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

// Select Inputs
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

// Dynamic Input Arrays
export const DynamicInputArrays = ({
  parentKey,
  label,
  placeholder,
  rules,
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
                          rules={rules}
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

//  Text Area Input
export const TextAreaInput = ({ fieldName, label, initialValue, rules }) => {
  return (
    <div className=" bg-gray-50 mb-12 p-5  pb-10 rounded-lg shadow space-y-8">
      <Form.Item
        rules={rules}
        label={label}
        name={fieldName}
        initialValue={initialValue}>
        <ReactQuill className="h-[200px] mb-7" theme="snow" formats={formats} />
      </Form.Item>
    </div>
  );
};

PartyDynamicInputs.propTypes = {
  parentKey: PropTypes.string.isRequired,
  firstKeyVal: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  secondKeyVal: PropTypes.string.isRequired,
  thirdKeyVal: PropTypes.string.isRequired,
  placeholderVal: PropTypes.string.isRequired,
  firstInitialValue: PropTypes.array,
  secondInitialValue: PropTypes.array,
  thirdInitialValue: PropTypes.array,
  rules: PropTypes.arrayOf(PropTypes.object),
};

SelectInputs.propTypes = {
  fieldName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  initialValue: PropTypes.any,
  defaultValue: PropTypes.any,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
    })
  ).isRequired,
  mode: PropTypes.string,
  rules: PropTypes.arrayOf(PropTypes.object),
};

DynamicInputArrays.propTypes = {
  parentKey: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  rules: PropTypes.arrayOf(PropTypes.object),
};

TextAreaInput.propTypes = {
  fieldName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  initialValue: PropTypes.any,
  rules: PropTypes.arrayOf(PropTypes.object),
};
