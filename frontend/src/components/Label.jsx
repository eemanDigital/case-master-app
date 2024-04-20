const Label = ({ text, htmlfor }) => {
  return (
    <label
      htmlFor={htmlfor}
      className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 ">
      {text}
    </label>
  );
};

export default Label;
