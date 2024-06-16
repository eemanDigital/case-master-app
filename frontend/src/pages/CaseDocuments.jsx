import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import Input from "../components/Inputs";
import Button from "../components/Button";
import DocumentsList from "../components/DocumentsList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

// import { useDataFetch } from "../hooks/useDataFetch";

// const baseURL = import.meta.env.VITE_BASE_URL;
const CaseDocuments = () => {
  const [formData, setFormData] = useState({
    fileName: "",
    file: "",
    case: [],
  });
  const [click, setClick] = useState(false);
  // handle reports post and get report data
  const { dataFetcher, data } = useDataFetch();

  // fetched cases and user data
  const { cases } = useDataGetterHook();

  // console.log("FILES", files.data);
  //  map over cases value
  const casesSelectField = Array.isArray(cases?.data) ? (
    <select
      label="case"
      value={formData.case}
      name="case"
      onChange={handleFileChange}>
      {cases?.data.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.name[0]?.name;
        const secondName = secondParty?.name[0]?.name;
        return (
          <option value={singleCase._id} key={singleCase._id}>
            {firstName} vs {secondName}
          </option>
        );
      })}
    </select>
  ) : (
    []
  );

  function handleFileChange(e) {
    const { name, value, files } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value, // Handle file or text input
    }));
  }
  // console.log(formData);

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      // Call fetchData with endpoint, method, payload, and any additional arguments
      await dataFetcher("documents", "post", formData, fileHeaders);
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center items-center ">
        <div>
          <Input
            required
            type="text"
            label="File Name"
            placeholder="file name"
            htmlFor="fileName"
            value={formData.fileName}
            name="fileName"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <Input
            required
            type="file"
            name="file" // Use 'file' to match Multer configuration
            id=""
            accept=".pdf,.docx,.jpg,.jpeg, .png"
            onChange={handleFileChange}
            label="upload photo"
            htmlFor="file"
          />
        </div>
        {casesSelectField}
        <div>
          <Button onClick={handleClick} type="submit">
            upload new photo
          </Button>
        </div>
      </form>

      <div className="flex">
        <DocumentsList />
      </div>
    </>
  );
};

export default CaseDocuments;
