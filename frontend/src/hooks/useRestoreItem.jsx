import notify from "../utils/notify";
import { useDispatch } from "react-redux";
import axios from "axios";
import { RESET } from "../redux/features/delete/deleteSlice";

const useRestoreItem = (baseURL, fetchData) => {
  const dispatch = useDispatch();

  const restoreItem = async (endpoint, id, fetchKey, fetchPath) => {
    try {
      const response = await axios.post(`${baseURL}/${endpoint}/${id}/restore`);
      notify.success(response.data.message);
      if (fetchData && fetchPath && fetchKey) {
        await fetchData(fetchPath, fetchKey);
      }
      dispatch(RESET());
    } catch (error) {
      notify.error(error.response?.data?.message || "Failed to restore item");
    }
  };

  return restoreItem;
};

export default useRestoreItem;
