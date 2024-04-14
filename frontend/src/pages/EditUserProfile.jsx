// import { useContext } from "react";
import Input from "../components/Inputs";
import Select from "../components/Select";
import Button from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { ToastContainer, toast } from "react-toastify";
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
  const { data, loading, error, authenticate } = useAuth();

  const [click, setClick] = useState(false);
  const { user } = useAuthContext();

  const [inputValue, setInputValue] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    photo: "",
    address: "",
    bio: "",
    position: "",
    phone: "",
    yearOfCall: "",
    otherPosition: "",
    practiceArea: "",
    universityAttended: "",
    lawSchoolAttended: "",
  });
  const getOtherFieldSelected = inputValue.position === "Other";

  // handleChange function
  function handleChange(e) {
    const { name, value, files } = e.target;
    setInputValue((prevData) => ({
      ...prevData,
      [name]: name === "photo" ? files[0] : value, // Handle file or text input
    }));
  }

  //Populate the local state with data from the database
  useEffect(() => {
    if (user?.data.user) {
      setInputValue((prevData) => ({
        ...prevData,
        ...user?.data.user,
      }));
    }
  }, [user?.data.user]);

  // function to handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    // set custom headers
    const customHeaders = {
      "Content-Type": "multipart/form-data", // Example of custom header
    };

    try {
      // Call fetchData with your endpoint, method, payload, and any additional arguments
      await authenticate(
        "users/updateUser",
        "patch",
        inputValue,
        customHeaders
      );
    } catch (err) {
      // Handle error
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  return (
    <section className=" bg-gray-200 ">
      <h1 className="text-5xl bold text-center p-5">Edit Profile</h1>

      <form
        onSubmit={handleSubmit}
        className="  bg-white   basis-3/5 shadow-md  rounded-md px-8 pt-6 pb-8 m-4">
        <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2">
          <div>
            <Input
              type="text"
              label="First Name"
              placeholder="First Name"
              htmlFor="First Name"
              text="Please enter your first name"
              value={inputValue.firstName}
              name="firstName"
              onChange={handleChange}
            />
          </div>
          <div>
            <Input
              type="text"
              label="Last Name"
              placeholder="Last Name"
              htmlFor="Last Name"
              value={inputValue.lastName}
              name="lastName"
              onChange={handleChange}
            />
          </div>
          <div>
            <Input
              type="text"
              label="Middle Name"
              placeholder="Middle Name"
              htmlFor="Middle Name"
              value={inputValue.middleName}
              name="middleName"
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              type="email"
              label="Email"
              placeholder="Email"
              htmlFor="Email"
              value={inputValue.email}
              name="email"
              onChange={handleChange}
            />
          </div>
        </div>

        {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2"></div> */}

        <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2 justify-between  md:items-center">
          <div>
            <Input
              type="Date"
              label="Year of call"
              placeholder="Year of call"
              htmlFor="Year of call"
              value={inputValue.yearOfCall}
              name="yearOfCall"
              onChange={handleChange}
            />
          </div>
          <div>
            <Input
              type="text"
              label="Phone Contact"
              placeholder="Phone Contact"
              htmlFor="Phone Contact"
              value={inputValue.phone}
              name="phone"
              onChange={handleChange}
            />
          </div>
          <div>
            <Input
              type="text"
              label="address"
              placeholder="No.2, Maitama Close, Abuja"
              htmlFor="address"
              value={inputValue.address}
              name="address"
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              type="text"
              label="practice area"
              placeholder="e.g. Intellectual Property law"
              htmlFor="practice area"
              value={inputValue.practiceArea}
              name="practiceArea"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row -mx-3 mb-6 flex-wrap gap-2 justify-between  sm:items-center">
          <div>
            <Input
              type="file"
              name="photo" // Use 'file' to match Multer configuration
              id=""
              accept=".pdf,.docx,.jpg,.jpeg, .png"
              onChange={handleChange}
              label="upload photo"
              htmlFor="photo"
            />
          </div>
          <div className="w-[300px]">
            <Select
              label="Position"
              options={positions}
              value={inputValue.position}
              name="position"
              onChange={handleChange}
            />
          </div>

          {/* conditionally render select position field */}
          {getOtherFieldSelected ? (
            <div>
              <Input
                required
                type="text"
                label="other"
                placeholder="specify position"
                htmlFor="otherPosition"
                value={inputValue.otherPosition}
                name="otherPosition"
                onChange={handleChange}
              />
            </div>
          ) : null}

          <div>
            <Input
              type="text"
              label="university attended"
              placeholder="e.g. University of Ilorin"
              htmlFor="university attended"
              value={inputValue.universityAttended}
              name="universityAttended"
              onChange={handleChange}
            />
          </div>
          <div>
            <Input
              type="text"
              label="law school attended"
              placeholder="e.g. Kano Law school"
              htmlFor="law school attended"
              value={inputValue.lawSchoolAttended}
              name="lawSchoolAttended"
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              type="text"
              textarea
              label="bio"
              placeholder="bio"
              htmlFor="bio"
              value={inputValue.bio}
              name="bio"
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
  );
};

export default EditUserProfile;
