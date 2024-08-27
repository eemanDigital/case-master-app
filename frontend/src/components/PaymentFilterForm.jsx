import PropTypes from "prop-types";
import { Input, Form, Button, DatePicker } from "antd";
import moment from "moment"; // Assuming you're using moment.js for date parsing

const PaymentFilterForm = ({ setYear, setMonth, removeMonthInput }) => {
  const handleFilterSubmit = (values) => {
    // If the backend sends a date string, parse it and set the year
    // Example backend date string: "30 Jun 2023 23:00:00 GMT"
    // Assuming `values.year` is the date string from the backend
    let backendDateString = decodeURIComponent(values.year); // Decode if URL encoded
    let yearFromBackendDate = moment(
      backendDateString,
      "DD MMM YYYY HH:mm:ss Z"
    ).year();
    setYear(yearFromBackendDate);

    if (!removeMonthInput) {
      setMonth(values.month); // Assuming month is handled differently and not URL encoded
    }
  };

  return (
    <div>
      {/* Filter Form */}
      <Form layout="inline" onFinish={handleFilterSubmit}>
        <Form.Item
          name="year"
          rules={[{ required: true, message: "Please input a year!" }]}>
          <DatePicker
            picker="year"
            placeholder="Year"
            style={{ width: "100%" }}
          />
        </Form.Item>

        {!removeMonthInput && (
          <>
            <Form.Item
              name="month"
              rules={[{ required: true, message: "Please input a month!" }]}>
              <Input placeholder="Month" />
            </Form.Item>
          </>
        )}
        <Form.Item>
          <Button className="bg-blue-500 text-white" htmlType="submit">
            Filter
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

PaymentFilterForm.propTypes = {
  setYear: PropTypes.func.isRequired,
  setMonth: PropTypes.func,
  removeMonthInput: PropTypes.bool,
};

export default PaymentFilterForm;
