import { useEffect } from "react";
import CaseReportList from "../components/CaseReportList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";

const MainCaseReportList = () => {
  const { reports, error, loading, fetchData } = useDataGetterHook();

  // fetch data
  useEffect(() => {
    fetchData("reports", "reports");
  }, []);

  if (loading.reports) return <LoadingSpinner />;

  return (
    <div>
      {error.reports ? (
        <PageErrorAlert
          errorCondition={error.reports}
          errorMessage={error.reports}
        />
      ) : (
        <CaseReportList
          showFilter={true}
          reports={reports?.data}
          title="Case Report"
        />
      )}
    </div>
  );
};

export default MainCaseReportList;
