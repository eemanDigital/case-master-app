import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import { RESET } from "../redux/features/delete/deleteSlice";

const useRestoreItem = (baseURL, fetchData) => {
  const dispatch = useDispatch();

  const restoreItem = async (endpoint, id, fetchKey, fetchPath) => {
    try {
      const response = await axios.post(`${baseURL}/${endpoint}/${id}/restore`);
      toast.success(response.data.message);
      if (fetchData && fetchPath && fetchKey) {
        await fetchData(fetchPath, fetchKey);
      }
      dispatch(RESET());
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore item");
    }
  };

  return restoreItem;
};

export default useRestoreItem;
