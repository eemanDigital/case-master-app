import { useState, createContext } from "react";

const FormContext = createContext();

const FormContextProvider = ({ children }) => {
  const [click, setClick] = useState(false);
  // const [photo, setPhoto] = useState("");

  const [inputValue, setInputValue] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    photo: "",
    address: "",
    role: "",
    task: "",
    bio: "",
    position: "",
    phone: "",
    yearOfCall: "",
    otherPosition: "",
    practiceArea: "",
    universityAttended: "",
    lawSchoolAttended: "",
  });

  // handleChange function
  function handleChange(e) {
    const inputText = e.target.value;
    const inputName = e.target.name;

    setInputValue((prevValue) => {
      return { ...prevValue, [inputName]: inputText };
    });
  }

  // function to handle for submission
  function handleSubmit(e) {
    e.preventDefault();

    if (!inputValue.firstName || inputValue.lastName) return;
  }

  function handleClick() {
    setClick(() => !click);
  }

  //   function handlePhotoChange (e){
  //     setPhoto(e.target.files[0])
  //   }

  return (
    <FormContext.Provider
      value={{
        inputValue,
        click,
        setClick,
        handleChange,
        handleClick,
        handleSubmit,
      }}>
      {children}
    </FormContext.Provider>
  );
};

// function useForm() {
//   return useContext(FormContext);
// }

export { FormContextProvider, FormContext };

// import { createContext, useReducer, useEffect } from "react";

// export const AuthContext = createContext();

// export const authReducer = (state, action) => {
//   switch (action.type) {
//     case "LOGIN":
//       return { user: action.payload };
//     case "LOGOUT":
//       return { user: null };
//     default:
//       return state;
//   }
// };

// export const AuthContextProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(authReducer, {
//     user: null,
//   });

//   //ensure we the token is retained when page is refreshed/reloaded
//   useEffect(() => {
//     // changes the JSON string to object
//     const user = JSON.parse(localStorage.getItem("user"));
//     if (user) {
//       dispatch({ type: "LOGIN", payload: user });
//     }
//   }, []);

//   console.log("AuthContext state", state);

//   return (
//     <AuthContext.Provider value={{ ...state, dispatch }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
