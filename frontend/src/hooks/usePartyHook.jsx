import { useState } from "react";

const usePartyChangeHooks = () => {
  const [formData, setFormData] = useState({
    firstParty: {
      title: "",
      name: [],
      processesFiled: [],
    },
    secondParty: {
      title: "",
      name: [],
      processesFiled: [],
    },
  });

  const handleTitleChange = (name, titleValue) => {
    setFormData((prevState) => {
      return {
        ...prevState,
        [name]: {
          ...prevState[name],
          title: titleValue,
        },
      };
    });
  };

  const [newFirstPartyName, setNewFirstPartyName] = useState("");
  const [newFirstPartyProcessesFiled, setNewFirstPartyProcessesFiled] =
    useState("");
  const [newSecondPartyName, setNewSecondPartyName] = useState("");
  const [newSecondPartyProcessesFiled, setNewSecondPartyProcessesFiled] =
    useState("");

  const handleFirstPartyNameChange = (e) => {
    setNewFirstPartyName(e.target.value);
  };

  const handleFirstPartyProcessesFiledChange = (e) => {
    setNewFirstPartyProcessesFiled(e.target.value);
  };

  const handleSecondPartyNameChange = (e) => {
    setNewSecondPartyName(e.target.value);
  };

  const handleSecondPartyProcessesFiledChange = (e) => {
    setNewSecondPartyProcessesFiled(e.target.value);
  };

  const addItems = (parent, name) => {
    if (parent === "firstParty") {
      if (name === "name") {
        setFormData((prevValue) => {
          return {
            ...prevValue,
            firstParty: {
              ...prevValue.firstParty,
              [name]: prevValue.firstParty[name].concat(newFirstPartyName),
            },
          };
        });
        setNewFirstPartyName("");
      } else if (name === "processesFiled") {
        setFormData((prevValue) => {
          return {
            ...prevValue,
            firstParty: {
              ...prevValue.firstParty,
              [name]: prevValue.firstParty[name].concat(
                newFirstPartyProcessesFiled
              ),
            },
          };
        });
        setNewFirstPartyProcessesFiled("");
      }
    } else if (parent === "secondParty") {
      if (name === "name") {
        setFormData((prevValue) => {
          return {
            ...prevValue,
            secondParty: {
              ...prevValue.secondParty,
              [name]: prevValue.secondParty[name].concat(newSecondPartyName),
            },
          };
        });
        setNewSecondPartyName("");
      } else if (name === "processesFiled") {
        setFormData((prevValue) => {
          return {
            ...prevValue,
            secondParty: {
              ...prevValue.secondParty,
              [name]: prevValue.secondParty[name].concat(
                newSecondPartyProcessesFiled
              ),
            },
          };
        });
        setNewSecondPartyProcessesFiled("");
      }
    }
  };

  const removeItem = (index, parent, name) => {
    setFormData((prevValue) => {
      return {
        ...prevValue,
        [parent]: {
          ...prevValue[parent],
          [name]: (prevValue[parent]?.[name] || []).filter(
            (_, i) => i !== index
          ),
        },
      };
    });
  };

  return {
    formData,
    newFirstPartyName,
    newFirstPartyProcessesFiled,
    newSecondPartyName,
    newSecondPartyProcessesFiled,
    handleFirstPartyNameChange,
    handleFirstPartyProcessesFiledChange,
    handleTitleChange,
    handleSecondPartyNameChange,
    handleSecondPartyProcessesFiledChange,
    addItems,
    removeItem,
  };
};

export default usePartyChangeHooks;
