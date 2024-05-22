const Input = ({ label, text, textarea, disable, inputStyle, ...props }) => {
  // console.log(props);
  return (
    <p>
      <label
        htmlFor
        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 ">
        {label}
      </label>
      {textarea ? (
        <textarea
          {...props}
          placeholder
          className="appearance-none block w-full bg-gray-200 text-gray-700 border  rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
        />
      ) : (
        <input
          placeholder
          {...props}
          // disabled
          className={
            inputStyle ||
            `appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-900 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`
          }
        />
      )}
      <p className="text-gray-600 text-xs italic">{text}</p>
    </p>
  );
};

export default Input;
