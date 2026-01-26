import { PhotoContext } from "../contexts/photoContext";
import { useContext } from "react";

export const usePhotoContext = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw Error("usePhotoContext must be used inside an PhotoContextProvider");
  }
  return context;
};
