import { Form } from "antd";
import ReactQuill from "react-quill";

// Custom validation rule to limit words to 4000
const wordLimitRule = {
  validator: (_, value) => {
    if (value && value.split(/\s+/).length > 4000) {
      return Promise.reject(
        new Error("Case Summary must be less than 4000 words")
      );
    }
    return Promise.resolve();
  },
};

const requiredRule = { required: true, message: "This field is required" };

const TextAreaInput = ({ rules, fieldName, initialValue, label }) => (
  <Form.Item
    name={fieldName}
    label={label}
    initialValue={initialValue}
    rules={[requiredRule, wordLimitRule, ...rules]}>
    <ReactQuill />
  </Form.Item>
);

export default TextAreaInput;
