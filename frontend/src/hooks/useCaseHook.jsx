// import { useState } from "react";

// const useCaseHook = () => {
//   const [formData, setFormData] = useState({
//     firstParty: {
//       title: "",
//       name: [],
//       processesFiled: [],
//     },
//     secondParty: {
//       title: "",
//       name: [],
//       processesFiled: [],
//     },
//     otherParty: {
//       title: "",
//       name: [],
//       processesFiled: [],
//     },
//   });

//   const handleTitleChange = (name, titleValue) => {
//     setFormData((prevState) => {
//       return {
//         ...prevState,
//         [name]: {
//           ...prevState[name],
//           title: titleValue,
//         },
//       };
//     });
//   };

//   const [newFirstPartyName, setNewFirstPartyName] = useState("");
//   const [newFirstPartyProcessesFiled, setNewFirstPartyProcessesFiled] =
//     useState("");
//   const [newSecondPartyName, setNewSecondPartyName] = useState("");
//   const [newSecondPartyProcessesFiled, setNewSecondPartyProcessesFiled] =
//     useState("");
//   const [newOtherPartyName, setNewOtherPartyName] = useState("");
//   const [newOtherPartyProcessesFiled, setNewOtherPartyProcessesFiled] =
//     useState("");

//   const handleFirstPartyNameChange = (e) => {
//     setNewFirstPartyName(e.target.value);
//   };

//   const handleFirstPartyProcessesFiledChange = (e) => {
//     setNewFirstPartyProcessesFiled(e.target.value);
//   };

//   const handleSecondPartyNameChange = (e) => {
//     setNewSecondPartyName(e.target.value);
//   };

//   const handleSecondPartyProcessesFiledChange = (e) => {
//     setNewSecondPartyProcessesFiled(e.target.value);
//   };
//   const handleOtherPartyNameChange = (e) => {
//     setNewSecondPartyName(e.target.value);
//   };

//   const handleOtherPartyProcessesFiledChange = (e) => {
//     setNewSecondPartyProcessesFiled(e.target.value);
//   };

//   const addItems = (parent, name) => {
//     if (parent === "firstParty") {
//       if (name === "name") {
//         setFormData((prevValue) => {
//           return {
//             ...prevValue,
//             firstParty: {
//               ...prevValue.firstParty,
//               [name]: prevValue.firstParty[name].concat(newFirstPartyName),
//             },
//           };
//         });
//         setNewFirstPartyName("");
//       } else if (name === "processesFiled") {
//         setFormData((prevValue) => {
//           return {
//             ...prevValue,
//             firstParty: {
//               ...prevValue.firstParty,
//               [name]: prevValue.firstParty[name].concat(
//                 newFirstPartyProcessesFiled
//               ),
//             },
//           };
//         });
//         setNewFirstPartyProcessesFiled("");
//       }
//     } else if (parent === "secondParty") {
//       if (name === "name") {
//         setFormData((prevValue) => {
//           return {
//             ...prevValue,
//             secondParty: {
//               ...prevValue.secondParty,
//               [name]: prevValue.secondParty[name].concat(newSecondPartyName),
//             },
//           };
//         });
//         setNewSecondPartyName("");
//       } else if (name === "processesFiled") {
//         setFormData((prevValue) => {
//           return {
//             ...prevValue,
//             secondParty: {
//               ...prevValue.secondParty,
//               [name]: prevValue.secondParty[name].concat(
//                 newSecondPartyProcessesFiled
//               ),
//             },
//           };
//         });
//         setNewSecondPartyProcessesFiled("");
//       }
//     } else if (parent === "otherParty") {
//       if (name === "name") {
//         setFormData((prevValue) => {
//           return {
//             ...prevValue,
//             otherParty: {
//               ...prevValue.otherParty,
//               [name]: prevValue.otherParty[name].concat(newOtherPartyName),
//             },
//           };
//         });
//         setNewOtherPartyName("");
//       } else if (name === "processesFiled") {
//         setFormData((prevValue) => {
//           return {
//             ...prevValue,
//             otherParty: {
//               ...prevValue.otherParty,
//               [name]: prevValue.otherParty[name].concat(
//                 newOtherPartyProcessesFiled
//               ),
//             },
//           };
//         });
//         setNewOtherPartyProcessesFiled("");
//       }
//     }
//   };

//   const removeItem = (index, parent, name) => {
//     setFormData((prevValue) => {
//       return {
//         ...prevValue,
//         [parent]: {
//           ...prevValue[parent],
//           [name]: (prevValue[parent]?.[name] || []).filter(
//             (_, i) => i !== index
//           ),
//         },
//       };
//     });
//   };

//   return {
//     formData,
//     newFirstPartyName,
//     newFirstPartyProcessesFiled,
//     newSecondPartyName,
//     newSecondPartyProcessesFiled,
//     newOtherPartyName,
//     newOtherPartyProcessesFiled,
//     handleFirstPartyNameChange,
//     handleFirstPartyProcessesFiledChange,
//     handleTitleChange,
//     handleSecondPartyNameChange,
//     handleSecondPartyProcessesFiledChange,
//     handleOtherPartyNameChange,
//     handleOtherPartyProcessesFiledChange,
//     addItems,
//     removeItem,
//   };
// };

// export default useCaseHook;
