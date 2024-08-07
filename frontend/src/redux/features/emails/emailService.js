import axios from "axios";
import { API_URL } from "../auth/authService";

// send automated email
const sendAutomatedEmail = async (emailData) => {
  const response = await axios.post(API_URL + "sendAutomatedEmail", emailData);
  return response.data.message;
};
// send automated email
const sendAutomatedCustomEmail = async (emailData) => {
  const response = await axios.post(
    API_URL + "sendAutomatedCustomEmail",
    emailData
  );
  return response.data.message;
};

const emailService = {
  sendAutomatedEmail,
  sendAutomatedCustomEmail,
};

export default emailService;
