import React from "react";
import PropTypes from "prop-types";
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
      send_from: "eemandigitalconcept@gmail.com",
      reply_to: "noreply@gmail.com",
      template: "caseReport",
      url: `dashboard/case-reports/${report._id}`,
      context: {
        name: report.caseReported.accountOfficer[0].firstName,
        suitNo: report.caseReported.suitNo,
        caseReported: `${report.caseReported.firstParty.name
          .map((n) => n.name)
          .join(", ")} vs ${report.caseReported.secondParty.name
          .map((n) => n.name)
          .join(", ")}`,
        update: report.update, // ✅ Pass as-is, backend will sanitize
        adjournedFor: report.adjournedFor,
        adjournedDate: new Date(report.adjournedDate).toLocaleDateString(),
        reportedBy: `${report.reportedBy.firstName} ${report.reportedBy.lastName}`,
        reportDate: new Date(report.date).toLocaleDateString(),
      },
    };

    try {
      const resultAction = await dispatch(
        sendAutomatedCustomEmail(emailData)
      ).unwrap();

      if (resultAction) {
        setEmailSent(true);
        // toast.success("Email sent successfully!");
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

// ✅ PropTypes validation
SendCaseReport.propTypes = {
  report: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    clientEmail: PropTypes.string.isRequired,
    update: PropTypes.string,
    adjournedFor: PropTypes.string,
    adjournedDate: PropTypes.string.isRequired,
    reportedBy: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
    }).isRequired,
    caseReported: PropTypes.shape({
      suitNo: PropTypes.string.isRequired,
      firstParty: PropTypes.shape({
        name: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          })
        ),
      }).isRequired,
      secondParty: PropTypes.shape({
        name: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          })
        ),
      }).isRequired,
      accountOfficer: PropTypes.arrayOf(
        PropTypes.shape({
          firstName: PropTypes.string.isRequired,
          lastName: PropTypes.string,
          email: PropTypes.string,
          phone: PropTypes.string,
        })
      ).isRequired,
    }).isRequired,
  }).isRequired,
};

export default SendCaseReport;
