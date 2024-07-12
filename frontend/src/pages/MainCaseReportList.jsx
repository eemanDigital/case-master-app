import CaseReportList from "../components/CaseReportList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const MainCaseReportList = () => {
  const { reports, error, loading } = useDataGetterHook();

  if (loading.reports) return <p>Loading...</p>;
  if (error.reports) return <p>{error.reports}</p>;
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
