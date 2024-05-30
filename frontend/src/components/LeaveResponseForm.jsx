import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { ToastContainer } from "react-toastify";
import { Modal } from "antd";
import Input from "./Inputs";
import Select from "./Select";
import Button from "./Button";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const LeaveResponseForm = () => {
  //   const { id } = useParams();
  const [open, setOpen] = useState(false);
  const { users } = useDataGetterHook();

  //   const [confirmLoading, setConfirmLoading] = useState(false);
  //   const [modalText, setModalText] = useState("Content of the modal");
  const showModal = () => {
    setOpen(true);
  };
  //   const handleOk = () => {
  //     setModalText("The modal will be closed after two seconds");
  //     setConfirmLoading(true);
  //     setTimeout(() => {
  //       setOpen(false);
  //       setConfirmLoading(false);
  //     }, 2000);
  //   };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };

  //   leave status response
  const status = ["select response type", "approved", "rejected"];

  const { data, loading, error, dataFetcher } = useDataFetch();
  const [click, setClick] = useState(false);

  const [inputValue, setInputValue] = useState({
    employee: "",
    startDate: null,
    endDate: null,
    status: "",
    responseMessage: "",
  });

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

    try {
      // Call fetchData with endpoint, method, payload, and any additional arguments
      await dataFetcher("leaves/applications", "put", inputValue);
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  console.log(inputValue);

  //  get users/reporter data
  //   const usersData = Array.isArray(users?.data)
  //     ? users?.data.map((user) => {
  //         return {
  //           value: user?._id,
  //           label: user?.fullName,
  //         };
  //       })
  //     : [];

  const employeeSelectField = Array.isArray(users?.data) ? (
    <select
      label="employee"
      value={inputValue.employee}
      name="employee"
      onChange={handleChange}>
      {users?.data.map((user) => {
        return (
          <option value={user._id} key={user._id}>
            {user.fullName}
          </option>
        );
      })}
    </select>
  ) : (
    []
  );

  return (
    <>
      <Button onClick={showModal} className="bg-green-700 text-white">
        Respond To Leave Application
      </Button>
      <Modal
        title="Leave Application Response"
        open={open}
        // onOk={handleOk}
        confirmLoading={loading}
        onCancel={handleCancel}>
        <section className="flex flex-col items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="  bg-white   basis-3/5 shadow-md  rounded-md px-8 pt-6 pb-8 m-4">
            <h1 className="text-2xl font-bold text-center mb-4">
              Leave Application Response
            </h1>

            <div className="flex flex-col  mb-6 gap-2 justify-between ">
              {employeeSelectField}
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
                  label="Status"
                  options={status}
                  value={inputValue.status}
                  name="status"
                  onChange={handleChange}
                />
              </div>

              <div>
                <Input
                  type="text"
                  label="Response message"
                  textarea
                  placeholder="your message..."
                  htmlFor="responseMessage"
                  value={inputValue.responseMessage}
                  name="responseMessage"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center">
              <Button onClick={handleClick}>Submit</Button>
            </div>
          </form>

          <ToastContainer />
        </section>
      </Modal>
    </>
  );
};
export default LeaveResponseForm;
