import { useParams, Link } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import { formatDate } from "../utils/formatDate";
import Button from "../components/Button";
import CaseDocumentUpload from "../components/CaseDocumentUpload";

const CaseDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();

  useEffect(() => {
    dataFetcher(`cases/${id}`, "GET");
  }, [id]);

  useEffect(() => {
    if (data?.data) {
      localStorage.setItem("caseData", JSON.stringify(data?.data));
    }
  }, [data?.data]);

  const fileHeaders = {
    "Content-Type": "application/json",
  };

  // Retrieve token from browser cookies
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  async function handleDownload(event, docId, fileName) {
    event.preventDefault();
    try {
      const response = await fetch(`/${id}/documents/${docId}/download`, {
        method: "GET",
        headers: {
          ...fileHeaders,
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <section>
      <Link to="../.." relative="path">
        Go Back to case lists
      </Link>

      <div className="flex justify-evenly">
        <div>
          <b>{data?.data?.firstParty.description} </b>
          {data?.data?.firstParty?.name?.map((singleName, index) => (
            <div key={singleName._id}>
              <h1>
                <strong>{index + 1}. </strong>
                {singleName.name}
              </h1>
            </div>
          ))}
        </div>
        vs
        <div>
          <b>{data?.data?.secondParty.description} </b>
          {data?.data?.secondParty?.name?.map((singleName, index) => (
            <div key={singleName._id}>
              <h1>
                <strong>{index + 1}.</strong> {singleName.name}
              </h1>
            </div>
          ))}
        </div>
        <div>
          {data?.data?.otherParty.map((singleParty) => (
            <>
              <b>{singleParty.description}</b>
              {singleParty?.name?.map((n, index) => (
                <div key={n._id}>
                  <h1>
                    <strong>{index + 1}. </strong>
                    {n.name}
                  </h1>
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-col">
        <p className="font-bold">
          <strong>SUIT NO:</strong> {data?.data?.suitNo}
        </p>
        <p className="font-bold">
          <strong>Filing Date:</strong>{" "}
          {data?.data?.filingDate && formatDate(data?.data?.filingDate)}
        </p>
        <p>
          <strong>Case Summary: </strong> {data?.data?.caseSummary}
        </p>
        <p>
          <strong>Mode Of Commencement</strong> {data?.data?.modeOfCommencement}
        </p>
        <p>
          <strong>Filed By the Office</strong>{" "}
          {data?.data?.isFiledByTheOffice ? <h1>Yes</h1> : <h1>No</h1>}
        </p>
        <p>
          <strong>Office Case File No: </strong> {data?.data?.caseOfficeFileNo}
        </p>
        <p>
          <strong>Nature of Case</strong> {data?.data?.natureOfCase}
        </p>
        <p className="flex flex-col">
          <strong>Court: </strong> {data?.data?.courtName}
          <strong>Court No: </strong> {data?.data?.courtNo}
          <strong>Court Location: </strong> {data?.data?.location}
          <strong>State: </strong> {data?.data?.state}
        </p>
        <p>
          <strong>Case Status: </strong> {data?.data?.caseStatus}
        </p>
        <p>
          <strong>Case Category: </strong> {data?.data?.category}
        </p>
        <p>
          <strong>Case Priority/Ratings: </strong> {data?.data?.casePriority}
        </p>
        {data?.data?.judge.map((j) => (
          <p key={j._id}>
            <strong>Judge: </strong>
            {j.name || (
              <span className="text-red-500 font-semibold">Not provided</span>
            )}
          </p>
        ))}
        <hr />
        <h1 className="font-bold">Case Reports</h1>
        {Array.isArray(data?.data?.reports)
          ? data?.data?.reports.map((u) => (
              <div key={u._id}>
                <p>
                  <strong>Date: </strong>
                  {formatDate(u?.date) || (
                    <span className="text-red-500 font-semibold">
                      Not provided
                    </span>
                  )}
                </p>
                <p>
                  <strong>Update: </strong>
                  {u.update || (
                    <span className="text-red-500 font-semibold">
                      Not provided
                    </span>
                  )}
                </p>
                <p>
                  <strong>Next Adjourned Date: </strong>
                  {(u?.adjournedDate && formatDate(u?.adjournedDate)) || (
                    <span className="text-red-500 font-semibold">
                      Not provided
                    </span>
                  )}
                </p>
              </div>
            ))
          : []}
        <hr />
        <div>
          <h3 className="font-bold">Case Strength: </h3>
          {data?.data?.caseStrengths.map((caseStrength) => (
            <p key={caseStrength._id}>
              {caseStrength?.name || (
                <span className="text-red-500 font-semibold">Not provided</span>
              )}
            </p>
          ))}
        </div>
        <div>
          <h3 className="font-bold">Case Weaknesses: </h3>
          {data?.data?.caseWeaknesses.map((caseWeakness) => (
            <p key={caseWeakness._id}>
              {caseWeakness?.name || (
                <span className="text-red-500 font-semibold">Not provided</span>
              )}
            </p>
          ))}
        </div>
        {data?.data?.stepToBeTaken.map((step) => (
          <p key={step._id}>
            <strong>Steps to be taken: </strong>
            {step.name || (
              <span className="text-red-500 font-semibold">Not provided</span>
            )}
          </p>
        ))}
        <hr />
        <div>
          <strong>Client: </strong>
          {data?.data?.client.map((c) => (
            <p key={c._id}>
              {c.name || (
                <span className="text-red-500 font-semibold">Not provided</span>
              )}
            </p>
          ))}
        </div>
        <hr />
        <p>
          <strong>General Comment: </strong> {data?.data?.generalComment}
        </p>
      </div>
      <div>
        <h1>Documents Uploads</h1>
        {data?.data?.documents.map((document) => (
          <div key={document._id}>
            <h1>Document&apos;s Name: {document?.fileName}</h1>
            <Button
              onClick={(event) =>
                handleDownload(event, document._id, document.fileName)
              }>
              Download File
            </Button>
          </div>
        ))}
      </div>
      <CaseDocumentUpload caseId={id} />
    </section>
  );
};

export default CaseDetails;
