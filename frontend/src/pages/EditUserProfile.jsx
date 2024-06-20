import Input from "../components/Inputs";
import Select from "../components/Select";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { ToastContainer, toast } from "react-toastify";
import { Button, Modal } from "antd";
import useModal from "../hooks/useModal";
import "react-toastify/dist/ReactToastify.css";

const EditUserProfile = () => {
  const positions = [
    "Select a position",
    "Principal",
    "Managing Partner",
    "Head of Chambers",
    "Associate",
    "Senior Associate",
    "Junior Associate",
    "Counsel",
    "Intern",
    "Secretary",
    "Para-legal",
    "Client",
    "Other",
  ];
  const roles = ["user", "admin", "secretary", "hr"];
  const gender = ["male", "female"];
  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const { data, loading, error, authenticate } = useAuth();
  const { user } = useAuthContext();

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
      await authenticate("users/updateUser", "patch", inputValue);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <section>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Edit Your Profile
      </Button>
      <Modal
        title="Edit Profile"
        open={open}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        footer={null}>
        <h1 className="text-3xl font-bold text-center mb-6">Edit Profile</h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-md px-8 pt-6 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Input
              type="text"
              label="First Name"
              placeholder="First Name"
              value={inputValue.firstName}
              name="firstName"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Last Name"
              placeholder="Last Name"
              value={inputValue.lastName}
              name="lastName"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Middle Name"
              placeholder="Middle Name"
              value={inputValue.middleName}
              name="middleName"
              onChange={handleChange}
            />
            <Input
              type="email"
              label="Email"
              placeholder="Email"
              value={inputValue.email}
              name="email"
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Input
              type="date"
              label="Year of Call"
              value={inputValue.yearOfCall}
              name="yearOfCall"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Phone Contact"
              placeholder="Phone Contact"
              value={inputValue.phone}
              name="phone"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Address"
              placeholder="Address"
              value={inputValue.address}
              name="address"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Practice Area"
              placeholder="Practice Area"
              value={inputValue.practiceArea}
              name="practiceArea"
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* <Select
              label="Position"
              options={positions}
              value={inputValue.position}
              name="position"
              onChange={handleChange}
            /> */}
            <Select
              label="Gender"
              options={gender}
              value={inputValue.gender}
              name="gender"
              onChange={handleChange}
            />
            {/* <Select
              label="Role"
              options={roles}
              value={inputValue.role}
              name="role"
              onChange={handleChange}
            /> */}
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
            <Input
              type="text"
              label="University Attended"
              placeholder="University Attended"
              value={inputValue.universityAttended}
              name="universityAttended"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Law School Attended"
              placeholder="Law School Attended"
              value={inputValue.lawSchoolAttended}
              name="lawSchoolAttended"
              onChange={handleChange}
            />
            <Input
              type="text"
              textarea
              label="Bio"
              placeholder="Bio"
              value={inputValue.bio}
              name="bio"
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-center">
            <button className="bg-blue-500 text-white px-6 py-2 ">
              Submit
            </button>
          </div>
        </form>
        <ToastContainer />
      </Modal>
    </section>
  );
};

export default EditUserProfile;
