import { useGoogleLogin } from "@react-oauth/google";
import GoogleCalenderForm from "../pages/GoogleCalenderForm";
import { Button } from "antd";
import axios from "axios";
// import { useState } from "react";

const baseURL = import.meta.env.VITE_BASE_URL;
const headers = {
  "Content-Type": "application/json",
  // Authorization: `Bearer ${token}`,
};
const GoogleAuth = () => {
  //   const [signedIn, setSignedIn] = useState(true);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      axios
        .post(
          `${baseURL}/google/create-token`,
          {
            code: codeResponse.code,
          },
          { headers }
        ) // Correctly passing headers as part of the configuration object
        .then((response) => {
          console.log(response.data);
          //   setSignedIn(true);
        })
        .catch((error) => console.log(error.message));
    },
    onError: (err) => console.log(err),
    scope: "email profile https://www.googleapis.com/auth/calendar",
    // redirect_uri: "http://localhost:5173/dashboard",
    flow: "auth-code",
  });

  return (
    <>
      <div>
        <Button onClick={() => login()}>Sign in with Google 🚀</Button>
        <GoogleCalenderForm />
      </div>
    </>
  );
};

export default GoogleAuth;
