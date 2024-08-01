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
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  changePassword,
  logout,
  RESET,
} from "../redux/features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { sendAutomatedEmail } from "../redux/features/emails/emailSlice";

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { isLoading, isError, user } = useSelector((state) => state.auth);
  const [click, setClick] = useState(false);
  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState({
    passwordCurrent: "",
    password: "",
    passwordConfirm: "",
  });

  // getting data from out custom hook
  const { togglePassword: togglePassword1, showPassword: showPassword1 } =
    useTogglePassword();
  const { togglePassword: togglePassword2, showPassword: showPassword2 } =
    useTogglePassword();

  function handleChange(e) {
    const inputText = e.target.value;
    const inputName = e.target.name;

    setInputValue((prevValue) => {
      return { ...prevValue, [inputName]: inputText };
    });
  }

  // sending email data
  const emailData = {
    subject: "Password Changed - CaseMaster",
    send_to: user.data?.email,
    reply_to: "noreply@gmail.com",
    template: "changePassword",
    // url: "/forgotpassword",
    url: "/dashboard/profile", //you may consider changing it to reflect the forgotpwd url
  };
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

    await dispatch(changePassword(inputValue));
    await dispatch(sendAutomatedEmail(emailData)); //send email
    await dispatch(logout(inputValue));
    await dispatch(RESET());
    navigate("/login");
  }

  function handleClick() {
    setClick(() => !click);
  }

  //form input styling
  let inputStyle = ` appearance-none block  sm:w-[344px] bg-gray-200 text-red border ${
    isError && "border-red-500"
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

              {isLoading && <LoadingSpinner />}
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
