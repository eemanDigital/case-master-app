import { toast } from "react-toastify";

export const validateRegister = (
  firstName,
  lastName,
  password,
  email,
  passwordConfirm,
  address,
  yearOfCall,
  lawSchoolAttended,
  phone,
  gender,
  universityAttended
) => {
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !passwordConfirm ||
    !gender ||
    !address ||
    !phone
    // !isLawyer ||
    // !yearOfCall ||
    // !universityAttended ||
    // !lawSchoolAttended
  ) {
    toast.error("Please provide all required fields");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast.error("Please provide a valid email address");
    return;
  }

  const disposableEmailProviders = [
    "mailinator.com",
    "trashmail.com",
    "tempmail.com",
  ];
  const emailDomain = email.split("@")[1];
  if (disposableEmailProviders.includes(emailDomain)) {
    toast.error("Disposable email addresses are not allowed");
    return;
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    toast.error(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );
    return;
  }

  if (password !== passwordConfirm) {
    toast.error("Passwords do not match");
    return;
  }

  if (!gender) {
    toast.error("Please provide a gender");
    return;
  }

  if (!address) {
    toast.error("Please provide an address");
    return;
  }

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    toast.error("Please provide a valid phone number");
    return;
  }

  if (!yearOfCall) {
    toast.error("Please provide a valid year of call");
    return;
  }

  if (!universityAttended) {
    toast.error("Please provide the university attended");
    return;
  }

  if (!lawSchoolAttended) {
    toast.error("Please provide the law school attended");
    return;
  }
};
