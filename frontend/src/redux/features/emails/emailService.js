import axios from "axios";
import { API_URL } from "../auth/authService";

// send automated email using template
const sendAutomatedEmail = async (emailData) => {
  const response = await axios.post(API_URL + "sendAutomatedEmail", emailData);
  return response.data.message;
};

// send automated custom email using template
const sendAutomatedCustomEmail = async (emailData) => {
  const response = await axios.post(
    API_URL + "sendAutomatedCustomEmail",
    emailData
  );
  return response.data.message;
};

// Send custom email with HTML content and attachments
const sendCustomEmail = async (emailData) => {
  const {
    send_to,
    reply_to,
    subject,
    htmlContent,
    textContent,
    attachments,
  } = emailData;

  // Create FormData for file uploads
  const formData = new FormData();
  
  if (Array.isArray(send_to)) {
    send_to.forEach(email => formData.append('send_to', email));
  } else {
    formData.append('send_to', send_to);
  }

  if (reply_to) formData.append('reply_to', reply_to);
  if (subject) formData.append('subject', subject);
  if (htmlContent) formData.append('htmlContent', htmlContent);
  if (textContent) formData.append('textContent', textContent);

  // Handle attachments - send as regular form field with JSON string
  if (attachments && attachments.length > 0) {
    const attachmentData = attachments.map((att) => {
      if (att.file) {
        // It's a File object - append to FormData
        formData.append('attachments', att.file);
        return null;
      } else if (att.base64 && att.filename) {
        // It's base64 encoded content
        return {
          content: att.base64,
          filename: att.filename,
        };
      }
      return null;
    }).filter(Boolean);

    // If we have base64 attachments, send as JSON string
    if (attachmentData.length > 0) {
      formData.append('attachment', JSON.stringify(attachmentData));
    }
  }

  const response = await axios.post(API_URL + "sendCustomEmail", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

// Helper to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data URL prefix
    reader.onerror = error => reject(error);
  });
};

const emailService = {
  sendAutomatedEmail,
  sendAutomatedCustomEmail,
  sendCustomEmail,
  fileToBase64,
};

export default emailService;
