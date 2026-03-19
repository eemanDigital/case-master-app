import axios from "axios";
import fileDownload from "js-file-download";

const baseURL = import.meta.env.VITE_BASE_URL;

export const downloadPdfReport = async (endpoint, filename) => {
  try {
    const response = await axios.get(`${baseURL}${endpoint}`, {
      responseType: "blob",
    });
    fileDownload(response.data, filename);
    return true;
  } catch (error) {
    console.error("PDF download error:", error);
    throw error;
  }
};

export const downloadRetainerReport = async (matterId, matterNumber) => {
  const filename = `${matterNumber || "retainer"}_report_${Date.now()}.pdf`;
  return downloadPdfReport(`/retainers/${matterId}/report`, filename);
};

export const downloadCorporateReport = async (matterId, matterNumber) => {
  const filename = `${matterNumber || "corporate"}_report_${Date.now()}.pdf`;
  return downloadPdfReport(`/corporate/${matterId}/report`, filename);
};

export const downloadAdvisoryReport = async (matterId, matterNumber) => {
  const filename = `${matterNumber || "advisory"}_report_${Date.now()}.pdf`;
  return downloadPdfReport(`/advisory/${matterId}/report`, filename);
};

export const downloadGeneralReport = async (matterId, matterNumber) => {
  const filename = `${matterNumber || "general"}_report_${Date.now()}.pdf`;
  return downloadPdfReport(`/general/${matterId}/report`, filename);
};

export const downloadPropertyReport = async (matterId, matterNumber) => {
  const filename = `${matterNumber || "property"}_report_${Date.now()}.pdf`;
  return downloadPdfReport(`/property/${matterId}/report`, filename);
};

export const downloadLitigationReport = async (matterId, matterNumber) => {
  const filename = `${matterNumber || "litigation"}_report_${Date.now()}.pdf`;
  return downloadPdfReport(`/litigation/${matterId}/report`, filename);
};
