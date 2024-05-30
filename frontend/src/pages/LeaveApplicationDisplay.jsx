import { useDataGetterHook } from "../hooks/useDataGetterHook";

const LeaveApplicationDisplay = () => {
  const { leaveApps, loadingLeaveApp, errorLeaveApp } = useDataGetterHook();

  console.log("LEAVE", leaveApps);
  return <div>LeaveApplicationDisplay</div>;
};

export default LeaveApplicationDisplay;
