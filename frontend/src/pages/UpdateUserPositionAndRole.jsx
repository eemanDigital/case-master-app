import Input from "../components/Inputs";
import Select from "../components/Select";
import { useState, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Modal } from "antd";
import useModal from "../hooks/useModal";
import { positions, roles } from "../data/options";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

const UpdateUserPositionAndRole = ({ userId }) => {
  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const { data, loading, error, dataFetcher } = useDataFetch();
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);

  const [inputValue, setInputValue] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    address: "",
    bio: "",
    position: "",
    phone: "",
    yearOfCall: "",
    annualLeaveEntitled: "",
    otherPosition: "",
    practiceArea: "",
    universityAttended: "",
    lawSchoolAttended: "",
  });

  const getOtherFieldSelected = inputValue.position === "Other";

  function handleChange(e) {
    const { name, value } = e.target;
    setInputValue((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  useEffect(() => {
    if (user?.data.user) {
      setInputValue((prevData) => ({
        ...prevData,
        ...user?.data.user,
      }));
    }
  }, [user?.data.user]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await dataFetcher(
        `users/update-user-by-admin/${userId}`,
        "patch",
        inputValue
      );
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <section>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Update User&apos;s Role or Position
      </Button>
      <Modal
        title="Update Staff Role or Position"
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        footer={null}>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-md px-8 pt-6 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Select
              label="Position"
              options={positions}
              value={inputValue.position}
              name="position"
              onChange={handleChange}
            />

            <Select
              label="Role"
              options={roles}
              value={inputValue.role}
              name="role"
              onChange={handleChange}
            />
            {/* <Input
              type="number"
              label="Leave Entitled"
              placeholder="Enter leave entitled to"
              value={inputValue.annualLeaveEntitled}
              name="annualLeaveEntitled"
              onChange={handleChange}
            /> */}
            {getOtherFieldSelected && (
              <Input
                type="text"
                label="Other Position"
                placeholder="Specify position"
                value={inputValue.otherPosition}
                name="otherPosition"
                onChange={handleChange}
              />
            )}
          </div>

          <div className="flex justify-center">
            <button className="bg-blue-500 text-white px-6 py-2 ">
              Submit
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default UpdateUserPositionAndRole;
