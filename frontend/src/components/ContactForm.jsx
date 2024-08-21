// components/ContactForm.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import { useDataFetch } from "../hooks/useDataFetch";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const devEmail = import.meta.env.VITE_DEVELOPER_EMAIL;
const ContactForm = () => {
  useRedirectLogoutUser("/login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const { dataFetcher } = useDataFetch();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    const errors = {};
    if (!formData.name) errors.name = "Name is required";

    //
    if (!formData.message) errors.message = "Message is required";
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const { name, message } = formData;
      console.log(devEmail);
      // Prepare email data
      const emailData = {
        subject: "Contact Request - A.T. Lukman & Co.",
        send_to: devEmail,
        send_from: user?.data?.email,
        reply_to: user?.data?.email,
        template: "contactRequest",
        context: {
          name,
          email: user?.data?.email,
          message,
        },
      };

      // Post data
      const response = await dataFetcher("contacts", "post", formData);
      await dispatch(sendAutomatedCustomEmail(emailData));

      if (response.message === "success") {
        toast.success("Message sent successfully");
        navigate("/dashboard"); // Navigate to the dashboard after sending the email
      }
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
    } catch (error) {
      toast.error("Error sending message");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl text-center font-medium text-gray-700  mb-4">
        Contact Developer
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {errors.name && (
            <div className="text-red-500 text-sm">{errors.name}</div>
          )}
        </div>
        {/* <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {errors.email && (
            <div className="text-red-500 text-sm">{errors.email}</div>
          )}
        </div> */}
        <div className="mb-4">
          <label className="block text-gray-700">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {errors.message && (
            <div className="text-red-500 text-sm">{errors.message}</div>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded">
          Send
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
