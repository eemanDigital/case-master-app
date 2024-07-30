import Input from "../components/Inputs";
import Select from "../components/Select";
import Button from "../components/Button";
import { useDataFetch } from "../hooks/useDataFetch";
import { useState } from "react";

const LeaveAppForm = () => {
  const leaveType = [
    "select leave type",
    "annual",
    "casual",
    "maternity",
    "sick",
    "others",
  ];

  const { data, loading, error, dataFetcher } = useDataFetch();
  const [click, setClick] = useState(false);

  const [inputValue, setInputValue] = useState({
    startDate: null,
    endDate: null,
    typeOfLeave: "",
    reason: "",
  });
  // console.log(inputValue);

  // handleChange function
  function handleChange(e) {
    const { name, value } = e.target;

    setInputValue((prevData) => ({
      ...prevData,
      [name]: value, // Handle file or text input
    }));
  }

  // dispatch({ type: "LOGIN", filPayload: fileValue });
  async function handleSubmit(e) {
    e.preventDefault();
    console.log("Submitting Leave Application:", inputValue);
    try {
      // Call fetchData with endpoint, method, payload, and any additional arguments
      await dataFetcher("leaves/applications", "POST", inputValue);
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  return (
    <section className="flex flex-col items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="  bg-white   basis-3/5 shadow-md  rounded-md px-8 pt-6 pb-8 m-4">
        <h1 className="text-2xl font-bold text-center mb-4">
          Leave Application
        </h1>

        <div className="flex flex-col  mb-6 gap-2 justify-between ">
          <div>
            <Input
              required
              type="Date"
              label="Start Date"
              placeholder="Start Date"
              htmlFor="Start Date"
              value={inputValue.startDate}
              name="startDate"
              onChange={handleChange}
            />
          </div>
          <div>
            <Input
              required
              type="Date"
              label="End Date"
              placeholder="End Date"
              htmlFor="End Date"
              value={inputValue.endDate}
              name="endDate"
              onChange={handleChange}
            />
          </div>

          <div className="w-[300px]">
            <Select
              required
              label="leave type"
              options={leaveType}
              value={inputValue.typeOfLeave}
              name="typeOfLeave"
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              type="text"
              label="Reason for leave"
              textarea
              placeholder="your reason..."
              htmlFor="reason"
              value={inputValue.reason}
              name="reason"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center">
          <Button onClick={handleClick}>Submit</Button>
        </div>
      </form>
    </section>
  );
};

export default LeaveAppForm;
