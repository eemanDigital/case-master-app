import { FileContext } from "../context/fileContext";
import { useContext } from "react";

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw Error("useFileContext must be used inside an FileContextProvider");
  }
  return context;
};
