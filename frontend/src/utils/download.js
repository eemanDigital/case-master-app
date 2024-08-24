import Axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;
import fileDownload from "js-file-download";

export function download(id, filename) {
  try {
    Axios.get(`${baseURL}/documents/download/${id}`, {
      responseType: "blob",
    }).then((res) => {
      fileDownload(res.data, filename);
    });
  } catch (err) {
    console.log(err);
  }
}
