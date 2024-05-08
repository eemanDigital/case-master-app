import { useReducer, createContext, useEffect } from "react";

// reducer function
export const FileContext = createContext();

export const fileReducer = (state, action) => {
  switch (action.type) {
    case "FILEDATA":
      return { file: action.payload };
    case "REMOVE":
      return { file: null };
    // case "GETDATA":
    //   return { fetchData: action.payload };
    default:
      return state;
  }
};

// const initialState = { user: null };

// export const AuthContext = createContext(initialState);

const FileContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(fileReducer, {
    file: null,
  });

  //ensure we the token is retained when page is refreshed/reloaded
  useEffect(() => {
    // changes the JSON string to object
    const file = JSON.parse(localStorage.getItem("file"));
    if (file) {
      dispatch({ type: "FILEDATA", payload: file });
    }
  }, []);

  console.log("FileContext state", state);

  return (
    <FileContext.Provider value={{ ...state, dispatch }}>
      {children}
    </FileContext.Provider>
  );
};

export default FileContextProvider;
