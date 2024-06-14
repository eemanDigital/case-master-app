import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import Input from "../components/Inputs";
import Button from "../components/Button";
// import { useDataGetterHook } from "../hooks/useDataGetterHook";

const CaseDocumentUpload = ({ caseId }) => {
  const [formData, setFormData] = useState({
    fileName: "",
    file: null,
  });
  const [click, setClick] = useState(false);

  const { dataFetcher } = useDataFetch();
  // const { cases } = useDataGetterHook();

  // const casesSelectField = Array.isArray(cases?.data) ? (
  //   <select
  //     label="case"
  //     value={formData.case}
  //     name="case"
  //     onChange={handleFileChange}>
  //     {cases?.data.map((singleCase) => {
  //       const { firstParty, secondParty } = singleCase;
  //       const firstName = firstParty?.name[0]?.name;
  //       const secondName = secondParty?.name[0]?.name;
  //       return (
  //         <option value={singleCase._id} key={singleCase._id}>
  //           {firstName} vs {secondName}
  //         </option>
  //       );
  //     })}
  //   </select>
  // ) : (
  //   []
  // );

  function handleFileChange(e) {
    const { name, value, files } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "file" ? files[0] : value, // Handle file or text input
    }));
  }

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = new FormData();
    payload.append("fileName", formData.fileName);
    payload.append("file", formData.file);
    // payload.append("case", formData.case);

    try {
      await dataFetcher(
        `cases/${caseId}/documents`,
        "post",
        payload,
        fileHeaders
      );
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center">
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
          name="file"
          id=""
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          label="upload document"
          htmlFor="file"
        />
      </div>

      <div>
        <button onClick={handleClick} type="submit">
          Upload Document
        </button>
      </div>
    </form>
  );
};

export default CaseDocumentUpload;
