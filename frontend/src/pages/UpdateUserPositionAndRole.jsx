import PropTypes from "prop-types";
import Input from "../components/Inputs";
import Select from "../components/Select";
import { useState, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Modal, Checkbox } from "antd";
import useModal from "../hooks/useModal";
import { positions, roles } from "../data/options";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import { getUsers } from "../redux/features/auth/authSlice";

const UpdateUserPositionAndRole = ({ userId }) => {
  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const { formData } = useInitialDataFetcher("users", userId);
  const dispatch = useDispatch();
  const { loading, error, dataFetcher } = useDataFetch();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState({
    role: "",
    position: "",
    isActive: false,
  });

  useEffect(() => {
    if (formData) {
      setInputValue({
        role: formData.role,
        position: formData.position,
        isActive: formData.isActive,
      });
    }
  }, [formData]);

  const getOtherFieldSelected = inputValue.position === "Other";

  function handleChange(e) {
    const { name, value } = e.target;
    setInputValue((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  function handleCheckboxChange(e) {
    const { name, checked } = e.target;
    setInputValue((prevData) => ({
      ...prevData,
      [name]: checked,
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
      const result = await dataFetcher(
        `users/upgradeUser/${userId}`,
        "patch",
        inputValue
      );
      // refresh to get update
      dispatch(getUsers());

      if (!result?.error) {
        return toast.success("User information updated");
      }
      navigate(0); // Refresh the page
    } catch (err) {
      console.log(err);
    }
  }

  if (error) {
    return toast.error(error);
  }

  return (
    <section>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Update User&apos;s Status
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

            <div className="flex items-center">
              <Checkbox
                checked={inputValue.isActive}
                name="isActive"
                onChange={handleCheckboxChange}>
                Active
              </Checkbox>
            </div>
          </div>

          <div className="flex justify-center">
            <button className="blue-btn px-6 py-2">
              {loading ? "Saving.." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

UpdateUserPositionAndRole.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UpdateUserPositionAndRole;
