import { useParams } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import { formatDate } from "../utils/formatDate";

const CaseDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();

  console.log(data?.data);
  useEffect(() => {
    dataFetcher(`cases/${id}`, "GET");
  }, [id]);

  return (
    <section>
      <div className="flex justify-evenly">
        <div>
          <b>{data?.data?.firstParty.description} </b>
          {data?.data?.firstParty?.name?.map((singleName, index) => {
            return (
              <div key={singleName._id}>
                <h1>
                  <strong>{index + 1}. </strong>
                  {""}
                  {singleName.name}
                </h1>
              </div>
            );
          })}
        </div>
        vs
        <div>
          <b>{data?.data?.secondParty.description} </b>

          {data?.data?.secondParty?.name?.map((singleName, index) => {
            return (
              <div key={singleName._id}>
                <h1>
                  <strong>{index + 1}.</strong> {singleName.name}
                </h1>
              </div>
            );
          })}
        </div>
        <div>
          {/* OtherParty mapping */}
          {data?.data?.otherParty.map((singleParty) => {
            return (
              <>
                <b>{singleParty.description}</b>
                {singleParty?.name?.map((n, index) => {
                  console.log(n);
                  return (
                    <div key={n._id}>
                      <h1>
                        <strong>{index + 1}. </strong>
                        {""}
                        {n.name}
                      </h1>
                    </div>
                  );
                })}
              </>
            );
          })}
        </div>
      </div>

      <div className="mt-3   flex flex-col">
        <p className=" font-bold">
          <strong>SUIT NO:</strong> {data?.data?.suitNo}
        </p>
        <p className=" font-bold">
          <strong>Filing Date:</strong>{" "}
          {data?.data?.filingDate && formatDate(data?.data?.filingDate)}
        </p>
        <p className="">
          <strong>Case Summary: </strong> {data?.data?.caseSummary}
        </p>
        <p className="">
          <strong>Mode Of Commencement</strong> {data?.data?.modeOfCommencement}
        </p>
        <p className="">
          <strong>Office Case File No: </strong> {data?.data?.caseOfficeFileNo}
        </p>
        <p className="">
          <strong>Nature of Case</strong> {data?.data?.natureOfCase}
        </p>{" "}
        <p className="">
          <strong>Court: </strong> {data?.data?.courtName}
        </p>
        <p className="">
          <strong>Case Status: </strong> {data?.data?.caseStatus}
        </p>
        <p className="">
          <strong>Case Priority/Ratings: </strong> {data?.data?.casePriority}
        </p>
        {data?.data?.judge.map((j) => {
          // console.log(j);
          return (
            <p key={j._id}>
              <strong>Judge: </strong>
              {j.name || (
                <span className="text-red-500 font-semibold">Not provided</span>
              )}{" "}
            </p>
          );
        })}
        <hr />
        {/* Case Updates */}
        <h1 className=" font-bold">Case Reports</h1>
        {Array.isArray(data?.data?.reports)
          ? data?.data?.reports.map((u) => {
              // console.log(j);
              return (
                <div key={u._id}>
                  <p>
                    <strong>Date: </strong>
                    {formatDate(u?.date) || (
                      <span className="text-red-500 font-semibold">
                        Not provided
                      </span>
                    )}{" "}
                  </p>
                  <p>
                    <strong>Update: </strong>
                    {u.update || (
                      <span className="text-red-500 font-semibold">
                        Not provided
                      </span>
                    )}{" "}
                  </p>
                  <p>
                    <strong>Next Adjourned Date: </strong>
                    {(u?.adjournedDate && formatDate(u?.adjournedDate)) || (
                      <span className="text-red-500 font-semibold">
                        Not provided
                      </span>
                    )}{" "}
                  </p>
                </div>
              );
            })
          : []}
        <hr />
        <div>
          <h3 className="font-bold"> Case Strength: </h3>
          {data?.data?.caseStrengths.map((caseStrength) => {
            // console.log(caseStrength);
            return (
              <p key={caseStrength._id}>
                {caseStrength?.name || (
                  <span className="text-red-500 font-semibold">
                    Not provided
                  </span>
                )}{" "}
              </p>
            );
          })}
        </div>
        <div>
          <h3 className="font-bold"> Case Weaknesses: </h3>
          {data?.data?.caseWeaknesses.map((caseWeakness) => {
            // console.log(caseStrength);
            return (
              <p key={caseWeakness._id}>
                {caseWeakness?.name || (
                  <span className="text-red-500 font-semibold">
                    Not provided
                  </span>
                )}{" "}
              </p>
            );
          })}
        </div>
        {data?.data?.stepToBeTaken.map((step) => {
          // console.log(step);
          return (
            <p key={step._id}>
              <strong>Steps to be taken: </strong>
              {step.name || (
                <span className="text-red-500 font-semibold">Not provided</span>
              )}{" "}
            </p>
          );
        })}
        <hr />
        <div>
          <strong>Client: </strong>
          {data?.data?.client.map((c) => {
            // console.log(step);

            return (
              <p key={c._id}>
                {c.name || (
                  <span className="text-red-500 font-semibold">
                    Not provided
                  </span>
                )}{" "}
              </p>
            );
          })}
        </div>
        <hr />
        <p className="">
          <strong>General Comment: </strong> {data?.data?.generalComment}
        </p>
      </div>
    </section>
  );
};

export default CaseDetails;
