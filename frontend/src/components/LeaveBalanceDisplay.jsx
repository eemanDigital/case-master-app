import { useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";

const LeaveBalanceDisplay = ({ userId }) => {
  const { data, loading, error, dataFetcher } = useDataFetch();

  // console.log("BALANCE", data?.data?.annualLeaveBalance);

  useEffect(() => {
    dataFetcher(`leaves/balances/${userId}`, "get");
  }, [userId]);

  return (
    <div>
      <p className="font-semibold ">
        Annual Leave Balance{" "}
        <span className="text-red-600">{data?.data?.annualLeaveBalance} </span>
      </p>
      <p className=" font-semibold ">
        Sick Leave Balance{" "}
        <span className="text-red-600">{data?.data?.sickLeaveBalance} </span>
      </p>
    </div>
  );
};

export default LeaveBalanceDisplay;
