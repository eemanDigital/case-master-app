import { useEffect } from "react";
import CaseReportList from "../components/CaseReportList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

const MainCaseReportList = () => {
  const { reports, error, loading, fetchData } = useDataGetterHook();

  // fetch data
  useEffect(() => {
    fetchData("reports", "reports");
  }, []);

  if (loading.reports) return <LoadingSpinner />;
  if (error.reports) return toast.error(error.reports);

  return (
    <div>
      <CaseReportList
        showFilter={true}
        reports={reports?.data}
        title="Case Report"
      />
    </div>
  );
};

export default MainCaseReportList;
