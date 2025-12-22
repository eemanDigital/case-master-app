import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Modal, Checkbox } from "antd";
import useModal from "../hooks/useModal";
import { useDispatch } from "react-redux"; // Removed useSelector
import { toast } from "react-toastify";
import { getUsers } from "../redux/features/auth/authSlice";

// Accept clientData as a prop
const UpdateClientStatus = ({ clientId, clientData }) => {
  const { open, showModal, handleOk, handleCancel } = useModal();
  const dispatch = useDispatch();
  const { loading, dataFetcher } = useDataFetch();

  const [inputValue, setInputValue] = useState({
    isActive: false,
  });

  // Populate local state from props when the modal opens or data changes
  useEffect(() => {
    if (clientData) {
      setInputValue({
        isActive: clientData.isActive || false,
      });
    }
  }, [clientData]);

  function handleCheckboxChange(e) {
    const { name, checked } = e.target;
    setInputValue((prevData) => ({
      ...prevData,
      [name]: checked,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Optimistic UI: Don't wait, or handle loading state
    const result = await dataFetcher(
      `users/upgradeUser/${clientId}`,
      "patch",
      inputValue
    );

    if (result && !result.error) {
      toast.success("Client status updated successfully");
      dispatch(getUsers()); // Refresh Redux state
      handleCancel(); // Close the modal
    } else {
      // Handle error specifically if needed, otherwise useDataFetch likely handled it
      toast.error(result?.error || "Failed to update status");
    }
  }

  return (
    <section>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Update Client&apos;s Status
      </Button>
      <Modal
        title="Update Client's Status"
        open={open}
        onOk={handleOk}
        footer={null}
        onCancel={handleCancel}>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-md px-8 pt-6 pb-8">
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="flex items-center p-4 border rounded bg-gray-50">
              <Checkbox
                checked={inputValue.isActive}
                name="isActive"
                onChange={handleCheckboxChange}>
                <span className="font-medium text-base ml-2">
                  Active Account
                </span>
              </Checkbox>
            </div>
            <p className="text-gray-500 text-sm">
              Unchecking this will deactivate the client's account access.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="blue-btn px-6">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

UpdateClientStatus.propTypes = {
  clientId: PropTypes.string.isRequired,
  clientData: PropTypes.object, // Added prop validation
};

export default UpdateClientStatus;
