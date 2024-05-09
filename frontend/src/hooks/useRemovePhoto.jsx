import { usePhotoContext } from "./usePhotoContext";

export const useRemovePhoto = () => {
  const { dispatch } = usePhotoContext();
  //remove user from storage

  const remove = () => {
    localStorage.removeItem("photo");

    //dispatch remove
    dispatch({ type: "REMOVE" });
  };
  return { remove };
};
