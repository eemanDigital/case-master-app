// import { useContext } from "react";
import { useState, useEffect } from "react";
import Input from "../components/Inputs";
import { Modal, Button } from "antd";
import { useAuth } from "../hooks/useAuth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDataFetch } from "../hooks/useDataFetch";

import axios from "axios";
import { useParams } from "react-router-dom";

const baseURL = import.meta.env.VITE_BASE_URL;

// const { Column, ColumnGroup } = Table;

const UpdateClientInfo = () => {
  const [inputValue, setInputValue] = useState({});
  const { data, loading, error, authenticate } = useAuth();
  const [click, setClick] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const { dataFetcher } = useDataFetch(); //general data fetcher

  const { id } = useParams();

  const { cases } = useDataGetterHook();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/clients/${id}`);
        // console.log("RES", response.data.data);

        setInputValue((prevData) => {
          return {
            ...prevData,
            ...response?.data?.data,
          };
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingInfo(false);
      }
    }
    fetchData();
  }, [id]);

  // Modal
  const [open, setOpen] = useState(false);
  //   const [confirmLoading, setConfirmLoading] = useState(false);
  //   const [modalText, setModalText] = useState("Content of the modal");
  const showModal = () => {
    setOpen(true);
  };
  const handleOk = () => {
    setModalText("The modal will be closed after two seconds");
    setConfirmLoading(true);
    setTimeout(() => {
      setOpen(false);
      setConfirmLoading(false);
    }, 2000);
  };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };

  // handleChange function
  function handleChange(e) {
    const { name, value, checked } = e.target;
    setInputValue((prevData) => ({
      ...prevData,
      [name]: name === "active" ? checked : value,
    }));
  }

  // cases data for select
  const casesSelectField = Array.isArray(cases?.data) ? (
    <select
      className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline"
      label="case"
      value={inputValue.case}
      name="case"
      onChange={handleChange}>
      {cases?.data.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.name[0]?.name;
        const secondName = secondParty?.name[0]?.name;
        return (
          <option value={singleCase._id} key={singleCase._id}>
            {firstName} vs {secondName}
          </option>
        );
      })}
    </select>
  ) : (
    []
  );

  //   console.log(inputValue);
  // dispatch({ type: "LOGIN", filPayload: fileValue });
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      // Call fetchData with endpoint, method, payload, and any additional arguments
      await dataFetcher(`clients/${id}`, "patch", inputValue); // Submit the form data to the backend
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  return (
    <section className=" bg-gray-200 ">
      <Button onClick={showModal} className="bg-red-600 text-white">
        Update Client Information
      </Button>
      <Modal
        width={580}
        title="Update Client Information"
        open={open}
        onOk={handleOk}
        confirmLoading={loading}
        onCancel={handleCancel}>
        <form
          onSubmit={handleSubmit}
          className="  bg-white   basis-3/5 shadow-md  rounded-md px-8 pt-6 pb-8 m-4">
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
              value={inputValue.secondName}
              name="secondName"
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

          <div>
            <Input
              type="Date"
              label="Date of Birth"
              placeholder="dob"
              htmlFor="dob"
              value={inputValue.dob}
              name="dob"
              onChange={handleChange}
            />
          </div>

          <Input
            type="text"
            label="Phone Contact"
            placeholder="Phone Contact"
            htmlFor="Phone Contact"
            value={inputValue.phone}
            name="phone"
            onChange={handleChange}
          />

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

          {casesSelectField}

          <div className="flex items-center space-x-2 m-4">
            <label htmlFor="active" className="text-gray-700">
              Client Active
            </label>
            <input
              className="form-checkbox h-5 w-5 text-blue-600"
              onChange={handleChange}
              type="checkbox"
              checked={inputValue.active}
              name="active"
              id="active"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center">
            <button onClick={handleClick}>Update Client</button>
          </div>
        </form>

        <ToastContainer />
      </Modal>
    </section>
  );
};

export default UpdateClientInfo;
