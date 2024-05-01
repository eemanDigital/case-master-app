// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const Cases = () => {
  const { cases, loading, error } = useDataGetterHook();

  const casesData = Array.isArray(cases?.data)
    ? cases?.data.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.name[0]?.name;
        const secondName = secondParty?.name[0]?.name;

        return (
          <>
            <Link>
              <h1 className="text-2xl">{`${firstName || ""} vs ${
                secondName || ""
              }`}</h1>
            </Link>
          </>
        );
      })
    : [];

  // const caseData = cases?.data?.map((singleCase, index) => {
  //   console.log(singleCase.firstParty.name[0]);
  //   // console.log(singleCase);
  //   return (
  //     <div key={index} className="w-full">
  //       <Link className="block">
  //         <ul className="block w-[100%]">
  //           {singleCase.firstParty.name.map((fname) => (
  //             <li key={fname}>
  //               {fname} vs.{" "}
  //               {singleCase.secondParty.name.map((secName) => {
  //                 return <li key={secName}>{secName}</li>;
  //               })}
  //             </li>
  //           ))}
  //         </ul>
  //       </Link>
  //     </div>
  //   );
  // });

  return (
    <section className={` `}>
      <h1>
        {!error && !loading && cases.length === 0 && <h1>No Data Available</h1>}
      </h1>
      <div className="">{!error && casesData}</div>
      <div>
        <h1>{error}</h1>
      </div>

      {loading && <h1>Data loading...</h1>}
    </section>
  );
};

export default Cases;
