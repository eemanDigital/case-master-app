// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { ToastContainer } from "react-toastify";
import Spinner from "../components/Spinner";
import Button from "../components/Button";
import { CiEdit } from "react-icons/ci";

const Cases = () => {
  const { cases, loadingCases, errorCases } = useDataGetterHook();

  const casesData = Array.isArray(cases?.data)
    ? cases?.data.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.name[0]?.name;
        const secondName = secondParty?.name[0]?.name;

        return (
          <div
            key={singleCase._id}
            className="flex flex-col bg-slate-200 p-4 rounded-md w-[300px]">
            <Link className="">
              <h1 className="text-2xl font-semibold">{`${firstName || ""} vs ${
                secondName || ""
              }`}</h1>
            </Link>

            <div className="mt-4">
              <p>
                <span className="text-red-600 ">Mode</span>
                {""}: {singleCase.modeOfCommencement}
              </p>
              <p>
                <span className="text-red-600 ">Suit No.</span>:{" "}
                {singleCase.suitNo}
              </p>
              <p>
                <span className="text-red-600 ">Nature of Case</span>:{" "}
                {singleCase.natureOfCase}
              </p>
              <p>
                <span className="text-red-600 ">Status</span>:{" "}
                {singleCase.caseStatus}
              </p>
            </div>
          </div>
        );
      })
    : [];

  return (
    <section>
      <h1 className="text-center font-bold text-4xl mb-4">Cases</h1>
      <h1>
        {!errorCases && !loadingCases && cases.length === 0 && (
          <h1>No Data Available</h1>
        )}
      </h1>
      <div className="flex flex-wrap  justify-between gap-3">
        {!errorCases && casesData}
      </div>
      <div className="flex">{errorCases}</div>

      {loadingCases && <Spinner />}

      <Link to="add-case">
        <Button>+ Add Case</Button>
      </Link>

      <ToastContainer />
    </section>
  );
};

export default Cases;
