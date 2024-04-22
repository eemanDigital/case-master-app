import { useState } from "react";
import Input from "../components/Inputs";
import Label from "../components/Label";
import Button from "../components/Button";
import { RiDeleteBin5Line } from "react-icons/ri";

const Forms = () => {
  const [formData, setFormData] = useState({
    firstParty: {
      title: "",
      name: [],
      processesFiled: [],
    },
  });

  const [newItem, setNewItem] = useState(""); // New state variable

  const handleTitleChange = (e) => {
    setFormData((prevState) => {
      return {
        ...prevState,
        firstParty: {
          ...prevState.firstParty,
          title: e.target.value,
        },
      };
    });
  };

  const handleNameChange = (e) => {
    setNewItem(e.target.value); // Update the newItem state
  };

  const addItems = (name) => {
    setFormData((prevValue) => {
      return {
        firstParty: {
          ...prevValue.firstParty,
          [name]: prevValue.firstParty[name].concat(newItem),
        },
      };
    });
    setNewItem(""); // Reset the newItem state to an empty string
  };

  const removeItem = (index, name) => {
    setFormData((prevValue) => {
      return {
        firstParty: {
          ...prevValue.firstParty,
          [name]: prevValue.firstParty[name].filter((_, i) => i !== index),
        },
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Form submitted:", formData);
  };

  //   console.log("DATA", formData);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* firstParty title */}
        <Label text="title" />
        <Input
          type="text"
          name="title"
          value={formData.firstParty.title}
          onChange={handleTitleChange}
        />

        {/* firstParty name field */}
        <div>
          <Label text="name" />
          <Input
            type="text"
            name="name"
            value={newItem}
            onChange={handleNameChange}
          />
          <ul>
            {formData.firstParty.name.map((field, index) => (
              <li key={index}>
                {field}
                <button type="button" onClick={() => removeItem(index, "name")}>
                  <RiDeleteBin5Line />
                </button>
              </li>
            ))}
            <Button type="button" onClick={() => addItems("name")}>
              {" "}
              add item
            </Button>
          </ul>
        </div>

        {/* firstParty processesFiled  */}
        <div>
          <Label text="process filed" />
          <Input
            type="text"
            name="processesFiled"
            value={newItem}
            onChange={handleNameChange}
          />
          <ul>
            {formData.firstParty.processesFiled.map((field, index) => (
              <li key={index}>
                {field}
                <button
                  type="button"
                  onClick={() => removeItem(index, "processesFiled")}>
                  <RiDeleteBin5Line />
                </button>
              </li>
            ))}
            <Button type="button" onClick={() => addItems("processesFiled")}>
              {" "}
              add item
            </Button>
          </ul>
        </div>

        <Button type="submit">Submit Form</Button>
      </form>
    </div>
  );
};

export default Forms;
