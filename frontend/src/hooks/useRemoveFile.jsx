import { useFileContext } from "./useFileContext";

export const useRemoveFile = () => {
  const { dispatch } = useFileContext();
  //remove user from storage

  const remove = () => {
    localStorage.removeItem("file");

    //dispatch remove
    dispatch({ type: "REMOVE" });
  };
  return { remove };
};
