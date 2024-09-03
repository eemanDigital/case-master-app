import Input from "../components/Inputs";
import Select from "../components/Select";
import { useState, useEffect } from "react";
import { Button, Modal } from "antd";
import useModal from "../hooks/useModal";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";
import { useDataFetch } from "../hooks/useDataFetch";
import { toast } from "react-toastify";
import { getUser } from "../redux/features/auth/authSlice";
import { useNavigate } from "react-router-dom";

const EditUserProfile = () => {
  const gender = ["male", "female"];
  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const { data, loading, error, dataFetcher } = useDataFetch();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

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

  function formatDate(date) {
    const d = new Date(date);
    const month = `0${d.getMonth() + 1}`.slice(-2);
    const day = `0${d.getDate()}`.slice(-2);
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    if (user?.data) {
      setInputValue((prevData) => ({
        ...prevData,
        ...user?.data,
        yearOfCall: user?.data.yearOfCall
          ? formatDate(user.data.yearOfCall)
          : "",
      }));
    }
  }, [user?.data]);

  // submit form
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await dataFetcher("users/updateUser", "patch", inputValue);
      await getUser(); // refresh page to get updated user
    } catch (err) {
      console.log(err);
    }
  }

  // toast success message
  if (data) {
    toast.success("Profile updated successfully");
    navigate(0);
  }

  // toast error message
  if (error) {
    toast.error(error || "Failed to update profile");
  }

  return (
    <section>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Edit Profile
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
              label="Role"
              placeholder="Role"
              value={inputValue.role}
              name="role"
              onChange={handleChange}
              disable
            />
          </div>
          <div>
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
            <Select
              label="Gender"
              options={gender}
              value={inputValue.gender}
              name="gender"
              onChange={handleChange}
            />
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
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default EditUserProfile;
