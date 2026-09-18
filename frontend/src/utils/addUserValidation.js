import notify from "./notify";

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
    notify.error("Please provide all required fields");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    notify.error("Please provide a valid email address");
    return;
  }

  const disposableEmailProviders = [
    "mailinator.com",
    "trashmail.com",
    "tempmail.com",
  ];
  const emailDomain = email.split("@")[1];
  if (disposableEmailProviders.includes(emailDomain)) {
    notify.error("Disposable email addresses are not allowed");
    return;
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    notify.error(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );
    return;
  }

  if (password !== passwordConfirm) {
    notify.error("Passwords do not match");
    return;
  }

  if (!gender) {
    notify.error("Please provide a gender");
    return;
  }

  if (!address) {
    notify.error("Please provide an address");
    return;
  }

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    notify.error("Please provide a valid phone number");
    return;
  }

  if (!yearOfCall) {
    notify.error("Please provide a valid year of call");
    return;
  }

  if (!universityAttended) {
    notify.error("Please provide the university attended");
    return;
  }

  if (!lawSchoolAttended) {
    notify.error("Please provide the law school attended");
    return;
  }
};
