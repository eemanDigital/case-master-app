import { useReducer, createContext, useEffect } from "react";

// reducer function
export const PhotoContext = createContext();

export const photoReducer = (state, action) => {
  switch (action.type) {
    case "PHOTODATA":
      return { photo: action.payload };
    case "REMOVE":
      return { photo: null };
    // case "GETDATA":
    //   return { fetchData: action.payload };
    default:
      return state;
  }
};

// const initialState = { user: null };

// export const AuthContext = createContext(initialState);

const PhotoContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(photoReducer, {
    photo: null,
  });

  //ensure we the token is retained when page is refreshed/reloaded
  useEffect(() => {
    // changes the JSON string to object
    const photo = JSON.parse(localStorage.getItem("photo"));
    if (photo) {
      dispatch({ type: "PHOTODATA", payload: photo });
    }
  }, []);

  console.log("PhotoContext state", state);

  return (
    <PhotoContext.Provider value={{ ...state, dispatch }}>
      {children}
    </PhotoContext.Provider>
  );
};

export default PhotoContextProvider;
