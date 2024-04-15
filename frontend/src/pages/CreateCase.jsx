import { useState, useReducer } from "react";
import Button from "../components/Button";
import Input from "../components/Inputs";
import Select from "../components/Select";
import { status, modes, courts, casePriority } from "../data/options";

function reducerFunc(state, action) {}

export default function CreateCase() {
  //   const [firstNameFormData, setFirstNameFormData] = useState({
  //     firstParty: {
  //       title: "",
  //       processesFiled: [],
  //       name: [],
  //     },
  //   });

  const [state, dispatch] = useReducer(reducerFunc, {
    title: "",
    processesFiled: [],
    name: [],
  });

  const handleNameChange = () => {
    dispatch({ type: "ADD_TEXT", payload: firstName.title });
  };

  function handleSubmit() {}

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-5  items-stretch  justify-between bg-white   basis-3/5 shadow-md  rounded-md px-8 pt-6 pb-8 m-4">
        {/* <div className="flex flex-col  sm:flex-row -mx-3 mb-6 gap-2"> */}
        <div>
          <Input
            type="text"
            label="title"
            placeholder="e.g. Plaintiff"
            htmlFor="title"
            text="Please enter your title"
            value={firstNameFormData.title}
            name="firstNameFormData.title"
            //   onChange={handleChange}
          />
        </div>
        <div className="">
          <Input
            type="text"
            label="processes file"
            placeholder=""
            htmlFor="processesFiled"
            value={firstNameFormData.processesFiled}
            name="firstNameFormData.processesFiled"
            //   onChange={handleChange}
          />

          <Button>Add More</Button>
        </div>
        <div>
          <Input
            type="text"
            label="name"
            placeholder="enter first party's name"
            htmlFor="name"
            value={firstNameFormData.name}
            name="firstNameFormData.name"
            //   onChange={handleChange}
          />
          <Button>Add More</Button>
        </div>
        {/* </div> */}

        {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2"> */}
        <div>
          <Input
            type="text"
            label="title"
            placeholder="e.g. Plaintiff"
            htmlFor="title"
            text="Please enter your title"
            //   value={form.firstName}
            name="secondParty.title"
            //   onChange={handleChange}
          />
        </div>
        <div>
          <Input
            type="text"
            label="processes file"
            placeholder=""
            htmlFor="processesFiled"
            //   value={inputValue.lastName}
            name="secondParty.processesFiled"
            //   onChange={handleChange}
          />
          <Button>Add More</Button>
        </div>
        <div>
          <Input
            type="text"
            label="name"
            placeholder="enter first party's name"
            htmlFor="name"
            //   value={inputValue.middleName}
            name="secondParty.name"
            //   onChange={handleChange}
          />
          <Button>Add More</Button>
        </div>
        {/* OTHER PARTY */}
        <div className="flex justify-between  flex-wrap">
          <div>
            <Input
              type="text"
              label="title"
              placeholder="e.g. Plaintiff"
              htmlFor="title"
              text="Please enter your title"
              //   value={form.firstName}
              name="otherParty.title"
              //   onChange={handleChange}
            />
          </div>
          {/* </div> */}
          {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2"> */}
          <div className="">
            <Input
              type="text"
              label="processes file"
              placeholder=""
              htmlFor="processesFiled"
              //   value={inputValue.lastName}
              name="otherParty.processesFiled"
              //   onChange={handleChange}
            />
            <Button>Add More</Button>
          </div>
          <div>
            <Input
              type="text"
              label="name"
              placeholder="enter first party's name"
              htmlFor="name"
              //   value={inputValue.middleName}
              name="otherParty.name"
              //   onChange={handleChange}
            />
            <Button>Add More</Button>
          </div>
          <Button>Add More Parties</Button>
        </div>
        <div className="w-[300px]">
          <Select
            label="Mode Of Commencement"
            options={modes}
            //   value={inputValue.position}
            name="modeOfCommencement"
            //   onChange={handleChange}
          />
        </div>

        <div>
          <Input
            type="text"
            label="Specify Mode of Commencement"
            placeholder=""
            htmlFor="suitNo"
            //   value={inputValue.email}
            name="otherModeOfCommencement"
            //   onChange={handleChange}
          />
        </div>
        {/* </div> */}

        {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2"> */}
        <div>
          <Input
            type="text"
            label="suit no"
            placeholder="e.g. SUIT NO: CA/345/2023"
            htmlFor="suitNo"
            //   value={inputValue.email}
            name="suitNo"
            //   onChange={handleChange}
          />
        </div>
        <div>
          <Input
            type="text"
            label="office case file no"
            placeholder="e.g. FILE NO: FA/345AD/45"
            htmlFor="caseOfficeFileNo"
            //   value={inputValue.email}
            name="caseOfficeFileNo"
            //   onChange={handleChange}
          />
        </div>
        {/* </div> */}
        <div className="w-[300px]">
          <Select
            label="court name"
            options={courts}
            //   value={inputValue.position}
            name="courtName"
            //   onChange={handleChange}
          />
        </div>

        {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2"> */}
        <div>
          <Input
            type="text"
            label="Judge"
            placeholder=""
            htmlFor="judge"
            // value={inputValue.password}
            name="judge.name"
            // onChange={handleChange}
          />
        </div>
        <div>
          <Input
            type="text"
            label="case summary"
            placeholder=""
            htmlFor="caseSummary"
            // value={inputValue.passwordConfirm}
            name="caseSummary"
            // onChange={handleChange}
          />
        </div>
        <div>
          <Input
            type="text"
            label="strength of the case"
            placeholder=""
            htmlFor="caseStrengths"
            //   value={inputValue.yearOfCall}
            name="caseStrengths"
            //   onChange={handleChange}
          />
        </div>
        {/* </div> */}

        {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2"> */}
        <div>
          <Input
            type="text"
            label="strength of the case"
            placeholder=""
            htmlFor="caseWeaknesses"
            //   value={inputValue.yearOfCall}
            name="caseWeaknesses"
            //   onChange={handleChange}
          />
        </div>
        <div className="w-[300px]">
          <Select
            label="casePriority"
            options={casePriority}
            //   value={inputValue.position}
            name="casePriority"
            //   onChange={handleChange}
          />
        </div>

        <div className="w-[300px]">
          <Select
            label="caseStatus"
            options={status}
            //   value={inputValue.position}
            name="caseStatus"
            //   onChange={handleChange}
          />
        </div>
        {/* </div> */}
        {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2 justify-between  md:items-center"> */}
        <div>
          <Input
            type="text"
            label="nature of case"
            placeholder="e.g. Tort of Negligence"
            htmlFor="natureOfCase"
            //   value={inputValue.yearOfCall}
            name="natureOfCase"
            //   onChange={handleChange}
          />
        </div>
        <div>
          <Input
            type="Date"
            label="filing date"
            placeholder=""
            htmlFor="filingDate"
            //   value={inputValue.phone}
            name="filingDate"
            //   onChange={handleChange}
          />
        </div>
        <div>
          <Input
            type="text"
            label="steps to be taken"
            placeholder=""
            htmlFor="stepToBeTaken"
            //   value={inputValue.stepToBeTaken}
            name="stepToBeTaken"
            //   onChange={handleChange}
          />
        </div>
        <div>
          <Input
            type="Date"
            label="case update"
            placeholder=""
            htmlFor="caseUpdates"
            //   value={inputValue.stepToBeTaken}
            name="caseUpdates.date"
            //   onChange={handleChange}
          />
        </div>
        <div>
          <Input
            type="text"
            label="case update"
            placeholder=""
            htmlFor="caseUpdates"
            //   value={inputValue.stepToBeTaken}
            name="caseUpdates.update"
            //   onChange={handleChange}
          />
        </div>
        {/* </div> */}
        {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 flex-wrap gap-2 justify-between  sm:items-center"> */}
        {/* <div>
            <Input
              type="file"
              name="photo" // Use 'file' to match Multer configuration
              id=""
              accept=".pdf,.docx,.jpg,.jpeg, .png"
              onChange={handleChange}
              label="upload photo"
              htmlFor="photo"
            />
          </div> */}

        <div>
          <Input
            required
            type="text"
            label="Account Officer"
            placeholder=" "
            htmlFor="accountOfficer"
            // value={inputValue.accountOfficer}
            name="accountOfficer"
            // onChange={handleChange}
          />
        </div>
        <div>
          <Input
            required
            type="text"
            label="client"
            placeholder=" "
            htmlFor="client"
            // value={inputValue.accountOfficer}
            name="client"
            // onChange={handleChange}
          />
        </div>

        <div>
          <Input
            type="text"
            label="comments"
            placeholder=""
            htmlFor="generalComment"
            //   value={inputValue.generalComment}
            name="generalComment"
            //   onChange={handleChange}
          />
        </div>
        {/* </div> */}

        {/* <div className="flex flex-col sm:flex-row justify-between items-center"> */}
        {/* <p>
            <span>
              Already have an account?{" "}
              <Link to="/login" className=" text-gray-800  font-bold">
                Login here
              </Link>
            </span>
          </p> */}

        <Button>Sign Up</Button>
        {/* </div> */}
      </form>
    </>
  );
}
