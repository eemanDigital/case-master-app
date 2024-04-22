import Input from "../components/Inputs";
import usePartyChangeHooks from "../hooks/usePartyHook";
import Label from "../components/Label";
import Button from "../components/Button";
import DeleteIcon from "../components/DeleteIcon";

const Forms = () => {
  const {
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
  } = usePartyChangeHooks();

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Form submitted:", formData);
  };

  const ulStyle = "flex flex-col text-[.8rem]";

  const liStyle =
    "flex gap-1 m-[1px] justify-between bg-white rounded-md px-2 py-1";

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* FIRST PARTY */}

        {/* firstParty title */}
        <h1 className="text-4xl">First Party</h1>

        <div className="flex justify-between  flex-wrap bg-gray-200 p-3 mt-2 rounded-md">
          <div>
            <Label text="title" />
            <Input
              type="text"
              name="title"
              placeholder="e.g. Plaintiff"
              value={formData.firstParty?.title}
              onChange={(e) => handleTitleChange("firstParty", e.target.value)}
            />

            {/* firstParty name field */}
          </div>
          <div>
            <Label text="name" />
            <Input
              type="text"
              name="name"
              value={newFirstPartyName}
              onChange={handleFirstPartyNameChange}
            />

            <ul className={ulStyle}>
              {formData.firstParty.name &&
                formData.firstParty.name.map((field, index) => (
                  <li key={index} className={liStyle}>
                    {field}
                    <button
                      type="button"
                      onClick={() => removeItem(index, "firstParty", "name")}>
                      <DeleteIcon />
                    </button>
                  </li>
                ))}
              <Button
                type="button"
                onClick={() => addItems("firstParty", "name")}>
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
              value={newFirstPartyProcessesFiled}
              onChange={handleFirstPartyProcessesFiledChange}
            />
            <ul className={ulStyle}>
              {formData.firstParty.processesFiled &&
                formData.firstParty.processesFiled.map((field, index) => (
                  <li key={index} className={liStyle}>
                    {field}
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(index, "firstParty", "processesFiled")
                      }>
                      <DeleteIcon />
                    </button>
                  </li>
                ))}
              <Button
                type="button"
                onClick={() => addItems("firstParty", "processesFiled")}>
                {" "}
                add item
              </Button>
            </ul>
          </div>
        </div>
        <br />
        <br />
        {/* SECOND PARTY */}
        {/* secondParty title */}
        <h1 className="text-4xl">second Party</h1>

        <div className="flex justify-between  flex-wrap bg-gray-200 p-3 rounded-md">
          <div>
            <Label text="title" />
            <Input
              type="text"
              name="title"
              placeholder="e.g. Defendant"
              value={formData.secondParty?.title}
              onChange={(e) => handleTitleChange("secondParty", e.target.value)}
            />
          </div>
          {/* secondParty name field */}
          <div>
            <Label text="name" />
            <Input
              type="text"
              name="name"
              value={newSecondPartyName}
              onChange={handleSecondPartyNameChange}
            />
            <ul className={ulStyle}>
              {formData.secondParty?.name.map((field, index) => (
                <li key={index} className={liStyle}>
                  {field}
                  <button
                    type="button"
                    onClick={() => removeItem(index, "secondParty", "name")}>
                    <DeleteIcon />
                  </button>
                </li>
              ))}
              <Button
                type="button"
                onClick={() => addItems("secondParty", "name")}>
                {" "}
                add item
              </Button>
            </ul>
          </div>

          {/* secondParty processesFiled  */}
          <div>
            <Label text="process filed" />
            <Input
              type="text"
              name="processesFiled"
              value={newSecondPartyProcessesFiled}
              onChange={handleSecondPartyProcessesFiledChange}
            />
            <ul className={ulStyle}>
              {formData.secondParty?.processesFiled.map((field, index) => (
                <li key={index} className={liStyle}>
                  {field}
                  <button
                    type="button"
                    onClick={() =>
                      removeItem(index, "secondParty", "processesFiled")
                    }>
                    <DeleteIcon />
                  </button>
                </li>
              ))}
              <Button
                type="button"
                onClick={() => addItems("secondParty", "processesFiled")}>
                {" "}
                add item
              </Button>
            </ul>
          </div>
        </div>

        <Button type="submit">Submit Form</Button>
      </form>
    </div>
  );
};

export default Forms;
