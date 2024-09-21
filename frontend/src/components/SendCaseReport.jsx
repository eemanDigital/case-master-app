import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "antd";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { toast } from "react-toastify";

const SendCaseReport = ({ report }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const [emailError, setEmailError] = React.useState(null);

  const handleSendEmail = async () => {
    setLoading(true);

    const emailData = {
      subject: "Case Report - A.T. Lukman & Co.",
      send_to: report.clientEmail,
      send_from: user?.data?.email,
      reply_to: "noreply@gmail.com",
      template: "caseReport",
      url: `dashboard/case-reports/${report._id}`,
      context: {
        name: report.caseReported.accountOfficer[0].firstName,
        caseName: `${report.caseReported.firstParty.name
          .map((n) => n.name)
          .join(", ")} vs ${report.caseReported.secondParty.name
          .map((n) => n.name)
          .join(", ")}`,
        suitNo: report.caseReported.suitNo,
        caseReported: `${report.caseReported.firstParty.name
          .map((n) => n.name)
          .join(", ")} vs ${report.caseReported.secondParty.name
          .map((n) => n.name)
          .join(", ")}`,
        update: report.update,
        adjournedFor: report.adjournedFor,
        adjournedDate: new Date(report.adjournedDate).toLocaleDateString(),
        reportedBy: `${report.reportedBy.firstName} ${report.reportedBy.lastName}`,
      },
    };

    try {
      const resultAction = await dispatch(
        sendAutomatedCustomEmail(emailData)
      ).unwrap();

      if (resultAction) {
        setEmailSent(true);
        toast.success("Email sent successfully!");
      }
    } catch (error) {
      setEmailError(error);
      toast.error(error || "Failed to send email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      onClick={handleSendEmail}
      loading={loading}
      className="blue-btn"
      disabled={loading || emailSent}>
      {emailSent ? "Email Sent" : "Send Report To Client"}
    </Button>
  );
};

export default SendCaseReport;
