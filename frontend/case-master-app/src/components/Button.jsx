const Button = ({ children, ...props }) => {
  const defaultStyle =
    "bg-slate-500 m-2 px-5 py-2 rounded text-slate-300 hover:bg-slate-400";

  return (
    <button {...props} className={defaultStyle}>
      {children}
    </button>
  );
};

export default Button;
