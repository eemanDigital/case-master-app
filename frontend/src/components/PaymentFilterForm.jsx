import { Input, Form, Button } from "antd";
import { useState } from "react";

const PaymentFilterForm = ({ setYear, setMonth }) => {
  //   const [year, setYear] = useState(new Date().getFullYear());
  //   const [month, setMonth] = useState(new Date().getMonth() + 1);

  const handleFilterSubmit = (values) => {
    setYear(values.year);
    setMonth(values.month);
  };

  return (
    <div>
      {" "}
      {/* Filter Form */}
      <Form layout="inline" onFinish={handleFilterSubmit}>
        <Form.Item
          name="year"
          rules={[{ required: true, message: "Please input a year!" }]}>
          <Input placeholder="Year" />
        </Form.Item>
        <Form.Item
          name="month"
          rules={[{ required: true, message: "Please input a month!" }]}>
          <Input placeholder="Month" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Filter
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default PaymentFilterForm;
