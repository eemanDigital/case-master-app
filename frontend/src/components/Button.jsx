const Button = ({ children, type, buttonStyle, ...props }) => {
  const defaultStyle =
    "bg-slate-500 m-2 px-5 py-2 rounded text-slate-300 hover:bg-slate-400";

  return (
    <button type={type} {...props} className={buttonStyle || defaultStyle}>
      {children}
    </button>
  );
};

export default Button;
