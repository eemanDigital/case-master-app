import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import UpdateClientInfo from "./UpdateClientInfo";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAdminHook } from "../hooks/useAdminHook";
import PageErrorAlert from "../components/PageErrorAlert";
import GoBackButton from "../components/GoBackButton";
import UpdateClientStatus from "./UpDateClientStatus";

const ClientDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isClient, isSuperOrAdmin } = useAdminHook();

  // fetch client data
  useEffect(() => {
    dataFetcher(`users/${id}`, "GET");
  }, [id]);

  // load spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // error alert
  if (error) {
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row md:flex-row lg:flex-row justify-between  space-y-4 sm:space-y-0 sm:space-x-4">
        <GoBackButton />
        {isClient && <UpdateClientInfo />}
        {isSuperOrAdmin && <UpdateClientStatus clientId={id} />}
      </div>

      <div className="p-4 bg-white shadow-md rounded-md font-poppins">
        <h2 className="text-xl font-semibold mb-4">Client Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="font-bold uppercase text-secondary">
              First Name:
            </span>
            <span>{data?.data?.firstName}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold uppercase text-secondary">
              Second Name:
            </span>
            <span>{data?.data?.secondName || "N/A"}</span>
          </div>
          <div className="flex flex-col ">
            <span className="font-bold uppercase text-secondary">Email:</span>
            <span>{data?.data?.email}</span>
          </div>
          <div className="flex flex-col ">
            <span className="font-bold uppercase text-secondary">Phone:</span>
            <span>{data?.data?.phone}</span>
          </div>
          <div className="flex flex-col ">
            <span className="font-bold uppercase text-secondary">Address:</span>
            <span>{data?.data?.address}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold uppercase text-secondary">Case:</span>
            <div>
              {data?.data?.case?.map((c, index) => (
                <div key={index} className="mb-2">
                  <p>
                    {index + 1}: {c.firstParty?.name[0]?.name} vs{" "}
                    {c.secondParty?.name[0]?.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold uppercase text-secondary">
              Is Active:
            </span>
            <span>
              {data?.data?.isActive
                ? "Yes, an active Client"
                : "No, not an active Client"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDetails;
