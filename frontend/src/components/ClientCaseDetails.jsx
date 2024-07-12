import React from "react";
import { Card, Row, Col, Typography, Spin, Alert } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import CaseReportList from "./CaseReportList";

const { Text } = Typography;

const ClientCaseDetails = () => {
  const { cases, reports, loading, error } = useDataGetterHook();
  const { user } = useAuthContext();

  const clientCase = user?.data?.user?.case;

  // Ensure reports are loaded
  if (loading.reports) {
    return (
      <Spin
        tip="Loading..."
        style={{ marginTop: "20px", textAlign: "center" }}
      />
    );
  }

  if (error.reports) {
    return (
      <Alert
        message="Error"
        description={error.reports}
        type="error"
        showIcon
        style={{ marginTop: "20px" }}
      />
    );
  }

  // Extract the first report for each unique case
  const firstReports = reports?.data?.reduce((acc, report) => {
    const caseId = report?.caseReported?._id;
    if (!acc[caseId]) {
      acc[caseId] = report;
    }
    return acc;
  }, {});

  const firstReportsArray = Object.values(firstReports || {});

  //   console.log(firstReportsArray, "RE");

  return (
    <div className="flex justify-between  p-4 my-4 mx-2 gap-4 rounded-md">
      <div className="mb-6">
        {/* <h1 className="text-gray-700 text-2xl font-medium">Case Overview</h1> */}
      </div>

      {/* <Row gutter={[16, 16]}>
        {clientCase?.map((singleCase, index) => (
          <Col key={index} xs={24} sm={12} md={11}>
            <Card
              title={`Case: ${singleCase.firstParty?.name[0]?.name} vs ${singleCase.secondParty?.name[0]?.name}`}
              bordered={false}
              hoverable
              style={{ width: "100%", marginBottom: "20px" }}>
              <p>
                <span className="font-medium">Status: </span>
                {singleCase.caseStatus === "decided" ? (
                  <CheckCircleOutlined style={{ color: "green" }} />
                ) : (
                  <CloseCircleOutlined style={{ color: "red" }} />
                )}
                {singleCase.caseStatus}
              </p>
            </Card>
          </Col>
        ))}
      </Row> */}
      <div className="w-[480px] h-[340px]  p-6 shadow-inner bg-gray-300 overflow-scroll hide-scrollbar">
        <CaseReportList
          showFilter={false}
          title="Latest Case Report"
          reports={firstReportsArray}
        />
      </div>
    </div>
  );
};

export default ClientCaseDetails;
