import Input from "../components/Inputs";
import Button from "../components/Button";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

// import {useTogglePass}
import "react-toastify/dist/ReactToastify.css";
import PasswordCheckCard from "../components/PasswordCheckCard";
import useTogglePassword from "../hooks/useTogglePassword";
import PasswordInput from "../components/PasswordInput";
import useModal from "../hooks/useModal";
import { Modal } from "antd";

const ChangePassword = ({ endpoint }) => {
  // const { inputValue, handleChange } = useContext(FormContext);
  const [click, setClick] = useState(false);
  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal();

  const [inputValue, setInputValue] = useState({
    passwordCurrent: "",
    password: "",
    passwordConfirm: "",
  });

  // getting data from out custom hook
  const { loading, error, authenticate } = useAuth();
  const { togglePassword: togglePassword1, showPassword: showPassword1 } =
    useTogglePassword();
  const { togglePassword: togglePassword2, showPassword: showPassword2 } =
    useTogglePassword();

  // console.log(user?.data?.user?.gender);
  function handleChange(e) {
    const inputText = e.target.value;
    const inputName = e.target.name;

    setInputValue((prevValue) => {
      return { ...prevValue, [inputName]: inputText };
    });
  }

  console.log(inputValue);

  // function to handle for submission
  async function handleSubmit(e) {
    e.preventDefault();
    if (
      !inputValue.passwordCurrent ||
      !inputValue.password ||
      !inputValue.passwordConfirm
    ) {
      toast.error("Please, fill all the password fields", {});
      return;
    }

    try {
      // Call fetchData with your endpoint, method, payload, and any additional arguments
      await authenticate(endpoint, "patch", inputValue);
      // Handle successful response

      //
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  //form input styling
  let inputStyle = ` appearance-none block  sm:w-[344px] bg-gray-200 text-red border ${
    error && "border-red-500"
  } rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`;

  return (
    <>
      <Button
        onClick={showModal}
        className="bg-blue-500 hover:bg-blue-600 text-white">
        Change Password
      </Button>
      <Modal open={open} onCancel={handleCancel} footer={null}>
        <section className="flex flex-col justify-center items-center ">
          <div>
            <form
              onSubmit={handleSubmit}
              className=" flex  flex-col justify-center items-center bg-white  sm:basis-2/5  shadow-md rounded-md px-8 pt-6 pb-8 m-4">
              <div className="flex  flex-col items-center -mx-3  mb-6 gap-2">
                <h1 className="text-4xl font-bold mb-5  capitalize">
                  change password
                </h1>

                <div>
                  <Input
                    inputStyle={inputStyle}
                    type="password"
                    label=" current password"
                    placeholder="********"
                    htmlFor="current password"
                    value={inputValue.passwordCurrent}
                    name="passwordCurrent"
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <PasswordInput
                    style={inputStyle}
                    type="password"
                    label="Password"
                    placeholder="*******"
                    htmlFor="Password"
                    value={inputValue.password}
                    name="password"
                    handleChange={handleChange}
                    showPassword={showPassword1}
                    togglePassword={togglePassword1}
                    onPaste={() => {}}
                  />
                </div>

                <div>
                  <PasswordInput
                    style={inputStyle}
                    type="password"
                    label="Confirm Password"
                    placeholder="*******"
                    htmlFor="confirm password"
                    value={inputValue.passwordConfirm}
                    name="passwordConfirm"
                    handleChange={handleChange}
                    showPassword={showPassword2}
                    togglePassword={togglePassword2}
                    onPaste={() => {}}
                  />
                </div>
                <PasswordCheckCard password={inputValue.password} />
              </div>
              <Button
                onClick={handleClick}
                buttonStyle="bg-slate-500 px-5 py-2 rounded w-full text-slate-200 hover:bg-slate-400">
                Submit
              </Button>
            </form>
          </div>
        </section>
      </Modal>
    </>
  );
};

export default ChangePassword;
