// import { useState } from "react";
import { useEffect } from "react";
import Button from "../components/Button";
import Input from "../components/Inputs";
import Label from "../components/Label";
// import Select from "../components/Select";
import { status, modes, courts, casePriority } from "../data/options";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { RiDeleteBin5Line } from "react-icons/ri";
import { IoIosArrowDown } from "react-icons/io";
// import { useForm } from "react-hook-form";

export default function CreateCase() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    isSubmitSuccessful,
    watch,
  } = useForm({
    firstParty: {
      title: "",
      processesFiled: [],
      name: [],
    },
    secondParty: {
      title: "",
      processesFiled: [],
      name: [],
    },
    otherParty: [
      {
        title: "",
        name: "",
        processesFiled: [],
      },
    ],
    suitNo: "",
    caseOfficeFileNo: "",
    courtName: "",
    judge: [{ name: "" }],
    caseSummary: "",
    caseStatus: "",
    natureOfCase: "",
    filingDate: "",
    modeOfCommencement: "",
    otherModeOfCommencement: "",
    caseStrengths: [],
    caseWeaknesses: [],
    casePriority: "",
    stepToBeTaken: [],
    caseUpdates: [{ date: "", update: "" }],
    // task: [],
    accountOfficer: [],
    client: [],
    generalComment: "",
  });

  const onSubmitForm = (formData) => {
    console.log(formData);
  };

  // console.log({ isSubmitSuccessful });

  // FIRST PARTY USEFIELDARRAY
  const { fields, append, remove } = useFieldArray({
    control,
    name: "firstParty.processesFiled", // Array field path
  });

  const {
    fields: nameFields,
    append: appendName,
    remove: removeName,
  } = useFieldArray({
    control,
    name: "firstParty.name", // Array field path
  });

  // SECOND PARTY USEFIELDARRAY
  const {
    fields: secondPartyNameFields,
    append: appendSecondPartyName,
    remove: removeSecondPartyName,
  } = useFieldArray({
    control,
    name: "secondParty.name", // Array field path
  });

  const {
    fields: secondPartyProcessFields,
    append: appendSecondPartyProcess,
    remove: removeSecondPartyProcess,
  } = useFieldArray({
    control,
    name: "secondParty.processesFiled", // Array field path
  });

  // OTHER PARTY FIELD
  const {
    fields: otherPartyFields,
    append: appendOtherParty,
    remove: removeOtherParty,
  } = useFieldArray({
    control,
    name: "otherParty", // Array field path
  });

  // JUDGE FIELD
  const {
    fields: judgeFields,
    append: appendJudgeName,
    remove: removeJudgeName,
  } = useFieldArray({
    control,
    name: "judge",
  });

  // CASE STRENGTHS FIELD
  const {
    fields: caseStrengthsFields,
    append: appendCaseStrengths,
    remove: removeCaseStrengths,
  } = useFieldArray({
    control,
    name: "caseStrengths",
  });
  // CASE WEAKNESSES FIELD
  const {
    fields: caseWeaknessFields,
    append: appendCaseWeaknesses,
    remove: removeCaseWeaknesses,
  } = useFieldArray({
    control,
    name: "caseWeaknesses",
  });

  // STEPS TO BE TAKEN
  const {
    fields: stepsToBeTakenFields,
    append: appendstepsToBeTaken,
    remove: removestepsToBeTaken,
  } = useFieldArray({
    control,
    name: "stepToBeTaken",
  });

  // CLIENT FIELD
  const {
    fields: clientFields,
    append: appendClient,
    remove: removeClient,
  } = useFieldArray({
    control,
    name: "client",
  });

  // UPDATE
  const watchCaseUpdates = watch("caseUpdates");

  const removeCaseUpdate = (index) => {
    control.setValue(
      "caseUpdates",
      watchCaseUpdates.filter((_, i) => i !== index)
    ); // Use control.setValue for nested arrays
  };

  const appendCaseUpdate = () => {
    control.setValue("caseUpdates", [
      ...watchCaseUpdates,
      { date: "", update: "" },
    ]);
  };

  // RESET FIELD AFTER SUBMISSION
  useEffect(() => {
    reset();
  }, [isSubmitSuccessful, reset]);

  // STYLES
  // inputField style
  const inputFieldStyle = `appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-1 px-1 mb-3 leading-tight focus:outline-none focus:bg-white`;
  // label style

  const btnStyle =
    " bg-slate-500 text-[10px] m-2 px-2 py-2 rounded text-slate-300 hover:bg-slate-400";

  const selectStyle =
    "appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white";
  const arrowDownDivStyle =
    "pointer-events-none absolute inset-y-0 right-0 flex top-[50] items-center px-2 text-gray-700";

  return (
    <>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmitForm)}
        className="gap-5  items-stretch  justify-between bg-white   basis-3/5 shadow-md  rounded-md px-8 pt-6 pb-8 m-4">
        {/* FIRST PARTY */}
        {/* first party title */}
        <h1 className="text-4xl capitalize ">first Party</h1>

        <div className="flex flex-wrap gap-4 justify-between rounded-md  shadow-inner bg-slate-100 p-4 my-3">
          <div>
            <Label text="first party's title" htmlfor="firstPartyTitle" />
            <input
              className={inputFieldStyle}
              type="text"
              label="title"
              placeholder="e.g. Plaintiff"
              htmlFor="firstPartyTitle"
              id="firstPartyTitle"
              {...register("firstParty.title")}
            />
          </div>

          {/* first party name field */}
          <div className="">
            <Label text="first party's name" htmlfor="firstPartyName" />
            <div className="form-group ">
              {nameFields.map((field, index) => (
                <div key={field.id} className="flex">
                  <input
                    className={inputFieldStyle}
                    {...register(`firstParty.name[${index}]`)}
                  />
                  <button
                    className={btnStyle}
                    type="button"
                    onClick={() => removeName(index)}>
                    <RiDeleteBin5Line className="text-[14px]" />
                  </button>
                </div>
              ))}
            </div>
            <button
              className={btnStyle}
              type="button"
              onClick={() => appendName("")}>
              Add Name
            </button>
          </div>
          <div className="">
            {/* first party process filed */}
            <div className="form-group">
              <Label text=" Processes Filed" htmlfor="processesFiled" />

              {fields.map((field, index) => (
                <div key={field.id} className="flex  items-center">
                  <input
                    className={inputFieldStyle}
                    {...register(`firstParty.processesFiled[${index}]`)}
                  />
                  <button
                    className={btnStyle}
                    type="button"
                    onClick={() => remove(index)}>
                    <RiDeleteBin5Line className="text-[14px]" />
                  </button>
                </div>
              ))}
              <button
                className={btnStyle}
                type="button"
                onClick={() => append("")}>
                Add Process
              </button>
            </div>
          </div>
        </div>
        {/* SECOND PARTY */}
        <div>
          <h1 className="text-4xl capitalize">Second Party</h1>

          <div className="flex flex-wrap gap-4 justify-between  rounded-md  shadow-inner bg-slate-100 p-4 my-3">
            <div>
              <Label text="second party's title" htmlfor="secondPartyTitle" />
              <input
                className={inputFieldStyle}
                type="text"
                label="title"
                placeholder="e.g. Defendant"
                id="secondPartyTitle"
                {...register("secondParty.title")}
              />
            </div>

            {/* second party name field */}
            <div className="">
              <Label text="second party's name" htmlfor="secondPartyName" />
              <div className="form-group ">
                {secondPartyNameFields.map((field, index) => (
                  <div key={field.id} className="flex">
                    <input
                      className={inputFieldStyle}
                      {...register(`secondParty.name[${index}]`)}
                    />
                    <button
                      className={btnStyle}
                      type="button"
                      onClick={() => removeSecondPartyName(index)}>
                      <RiDeleteBin5Line className="text-[14px]" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className={btnStyle}
                type="button"
                onClick={() => appendSecondPartyName("")}>
                Add Name
              </button>
            </div>

            <div className="">
              <Label text=" Processes Filed" htmlfor="processesFiled" />

              {/* Second party process filed */}
              <div className="form-group">
                {secondPartyProcessFields.map((field, index) => (
                  <div key={field.id} className="flex  items-center">
                    <input
                      className={inputFieldStyle}
                      {...register(`secondParty.processesFiled[${index}]`)}
                    />
                    <button
                      className={btnStyle}
                      type="button"
                      onClick={() => removeSecondPartyProcess(index)}>
                      <RiDeleteBin5Line className="text-[14px]" />
                    </button>
                  </div>
                ))}
                <button
                  className={btnStyle}
                  type="button"
                  onClick={() => appendSecondPartyProcess("")}>
                  Add Process
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* OTHER PARTY */}
        <div>
          <h1 className="text-4xl capitalize">Other Party</h1>
          {otherPartyFields.map((party, partyIndex) => (
            <div key={partyIndex}>
              <label htmlFor={`otherParty[${partyIndex}].title`}>Title</label>
              <input
                className={inputFieldStyle}
                type="text"
                {...register(`otherParty[${partyIndex}].title`)}
                defaultValue={party.title}
              />

              <label htmlFor={`otherParty[${partyIndex}].name`}>Name</label>
              <input
                className={inputFieldStyle}
                type="text"
                {...register(`otherParty[${partyIndex}].name`)}
                defaultValue={party.name}
              />

              <label>Processes Filed</label>
              {party?.processesFiled?.map((process, processIndex) => (
                <div key={processIndex}>
                  <input
                    className={inputFieldStyle}
                    type="text"
                    {...register(
                      `otherParty[${partyIndex}].processesFiled[${processIndex}]`
                    )}
                    defaultValue={process}
                  />
                  <button
                    className={btnStyle}
                    type="button"
                    onClick={() => removeOtherParty(partyIndex, processIndex)}>
                    Remove Process
                  </button>
                </div>
              ))}
              <button
                className={btnStyle}
                type="button"
                onClick={() => appendOtherParty(partyIndex)}>
                Add Process
              </button>
              <button
                className={btnStyle}
                type="button"
                onClick={() => removeOtherParty(partyIndex)}>
                Remove Party
              </button>
            </div>
          ))}
          <button
            className={btnStyle}
            type="button"
            onClick={() =>
              appendOtherParty({ title: "", name: "", processesFiled: [] })
            }>
            Add Other Party
          </button>
        </div>

        {/* mode of commencement */}
        <div className="flex flex-wrap gap-4 justify-between  items-center rounded-md  shadow-inner bg-slate-100 p-4 my-3">
          <div className="relative">
            <Label text="mode of commencement" />
            <select
              className={selectStyle}
              {...register("modeOfCommencement")}
              // className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              id="grid-state">
              {modes.map((el, index) => {
                // console.log(el);
                return (
                  <option value={el} key={index}>
                    {el}
                  </option>
                );
              })}
            </select>
            <div className={arrowDownDivStyle}>
              <IoIosArrowDown />
            </div>

            {/* mode of commencement */}
            <div className="relative">
              <Label text="court" />
              <select
                className={selectStyle}
                {...register("modeOfCommencement")}
                id="grid-state">
                {modes.map((el, index) => {
                  return (
                    <option value={el} key={index}>
                      {el}
                    </option>
                  );
                })}
              </select>
              <div className={arrowDownDivStyle}>
                <IoIosArrowDown />
              </div>
            </div>
          </div>

          {/* other mode of commencement */}
          <div>
            <Label text="Specify Mode of Commencement" />
            <input
              className={inputFieldStyle}
              type="text"
              //   value={inputValue.email}
              name="otherModeOfCommencement"
              {...register("otherModeOfCommencement")}
              //   onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Label text="Select Court" />
            <select
              className={selectStyle}
              {...register("court")}
              id="grid-state">
              {courts.map((el, index) => {
                return (
                  <option value={el} key={index}>
                    {el}
                  </option>
                );
              })}
            </select>
            <div className={arrowDownDivStyle}>
              <IoIosArrowDown />
            </div>
          </div>

          {/* case status */}
          <div className="relative">
            <Label text="case status" />
            <select
              className={selectStyle}
              {...register("caseStatus")}
              id="grid-state">
              {status.map((el, index) => {
                return (
                  <option value={el} key={index}>
                    {el}
                  </option>
                );
              })}
            </select>
            <div className={arrowDownDivStyle}>
              <IoIosArrowDown />
            </div>
          </div>

          {/* case status */}
          <div className="relative">
            <Label text="case status" />
            <select
              className={selectStyle}
              {...register("casePriority")}
              id="grid-state">
              {casePriority.map((el, index) => {
                return (
                  <option value={el} key={index}>
                    {el}
                  </option>
                );
              })}
            </select>
            <div className={arrowDownDivStyle}>
              <IoIosArrowDown />
            </div>
          </div>
        </div>

        {/* JUDGE */}
        <div className="flex flex-wrap gap-4 justify-between  items-center rounded-md  shadow-inner bg-slate-100 p-4 my-3">
          <div>
            <Label text="judge's name" htmlfor="judge" />
            {judgeFields.map((judge, index) => (
              <div key={judge.id} className="flex  items-center">
                <input
                  className={inputFieldStyle}
                  {...register(`judge[${index}]`)}
                  // defaultValue={judge} // Assuming each judge has a 'name' property
                />
                <button
                  className={btnStyle}
                  type="button"
                  onClick={() => removeJudgeName(index)}>
                  <RiDeleteBin5Line />
                </button>
              </div>
            ))}
            <button
              className={btnStyle}
              type="button"
              onClick={() => appendJudgeName("")}>
              Add Judge
            </button>
          </div>

          {/* case strength */}
          <div>
            <Label text="Strength of the case" htmlfor="caseStrength" />
            {caseStrengthsFields.map((caseStrength, index) => (
              <div key={caseStrength.id} className="flex  items-center">
                <input
                  className={inputFieldStyle}
                  {...register(`caseStrengths[${index}]`)}
                  // defaultValue={caseStrength} // Assuming each judge has a 'name' property
                />
                <button
                  className={btnStyle}
                  type="button"
                  onClick={() => removeCaseStrengths(index)}>
                  <RiDeleteBin5Line />
                </button>
              </div>
            ))}
            <button
              className={btnStyle}
              type="button"
              onClick={() => appendCaseStrengths("")}>
              Add Strength
            </button>
          </div>

          {/* case weakness */}
          <div>
            <Label text="weakness of the case" htmlfor="caseWeaknesses" />
            {caseWeaknessFields.map((caseWeakness, index) => (
              <div key={caseWeakness.id} className="flex  items-center">
                <input
                  className={inputFieldStyle}
                  {...register(`caseWeaknesses[${index}]`)}
                />
                <button
                  className={btnStyle}
                  type="button"
                  onClick={() => removeCaseWeaknesses(index)}>
                  <RiDeleteBin5Line />
                </button>
              </div>
            ))}
            <button
              className={btnStyle}
              type="button"
              onClick={() => appendCaseWeaknesses("")}>
              Add Weakness
            </button>
          </div>
          {/* steps to be taken */}

          <div>
            <Label text="steps to be taken" htmlfor="stepToBeTaken" />
            {stepsToBeTakenFields.map((step, index) => (
              <div key={step.id} className="flex  items-center">
                <input
                  className={inputFieldStyle}
                  {...register(`stepToBeTaken[${index}]`)}
                />
                <button
                  className={btnStyle}
                  type="button"
                  onClick={() => removestepsToBeTaken(index)}>
                  <RiDeleteBin5Line />
                </button>
              </div>
            ))}
            <button
              className={btnStyle}
              type="button"
              onClick={() => appendstepsToBeTaken("")}>
              Add Steps
            </button>
          </div>

          <div>
            <Label text="our client(s)" htmlfor="stepToBeTaken" />
            {clientFields.map((client, index) => (
              <div key={client.id} className="flex  items-center">
                <input
                  className={inputFieldStyle}
                  {...register(`client[${index}]`)}
                />
                <button
                  className={btnStyle}
                  type="button"
                  onClick={() => removeClient(index)}>
                  <RiDeleteBin5Line />
                </button>
              </div>
            ))}
            <button
              className={btnStyle}
              type="button"
              onClick={() => appendClient("")}>
              Add Client
            </button>
          </div>

          {/* case update */}

          <h2>Case Updates</h2>
          {watchCaseUpdates?.map((caseUpdate, index) => (
            <div key={index} className="flex items-center justify-between mb-2">
              <input
                className={inputFieldStyle}
                type="date"
                {...register(`caseUpdates[${index}].date`)}
                placeholder="Update Date"
                defaultValue={caseUpdate.date}
              />
              <input
                className={inputFieldStyle}
                type="text"
                {...register(`caseUpdates[${index}].update`)}
                placeholder="Case Update"
                defaultValue={caseUpdate.update}
              />
              <button
                className={btnStyle} // Assuming you have a styling class
                type="button"
                onClick={() => removeCaseUpdate(index)}>
                <RiDeleteBin5Line className="text-[14px]" />
              </button>
            </div>
          ))}
          <button className={btnStyle} type="button" onClick={appendCaseUpdate}>
            Add Case Update
          </button>
        </div>

        {/* suit no */}
        <div>
          <Input
            type="text"
            label="suit no"
            placeholder="e.g. SUIT NO: CA/345/2023"
            htmlFor="suitNo"
            //   value={inputValue.email}
            name="suitNo"
            {...register("suitNo")}
          />
        </div>
        {/* case file no */}
        <div>
          <input
            type="text"
            label="office case file no"
            placeholder="e.g. FILE NO: FA/345AD/45"
            htmlFor="caseOfficeFileNo"
            {...register("caseOfficeFileNo", {})}
          />
        </div>
        {/* case summary */}

        <div>
          <input
            type="text"
            label="case summary"
            placeholder=""
            htmlFor="caseSummary"
            {...register("caseSummary", {})}
          />
        </div>

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
          <Label text="general comment" />
          <input
            className={inputFieldStyle}
            type="text"
            placeholder=""
            //   value={inputValue.generalComment}
            {...register("generalComment")}
            //   onChange={handleChange}
          />
        </div>

        <Button>Sign Up</Button>
        {/* </div> */}
      </form>
    </>
  );
}
