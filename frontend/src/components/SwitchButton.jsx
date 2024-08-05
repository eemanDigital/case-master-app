// const SwitchButton = ({ currentState, updatedState, text, stateText, onClick }) => {
//   return (
//     <>
//       <button
//         className={`px-4 py-2 m-2 ${
//           currentState === stateText
//             ? "bg-blue-500 text-white"
//             : "bg-white text-black"
//         }`}
//         onClick={() => updatedState(stateText)}>
//         {text}
//       </button>
//     </>
//   );
// };

// export default SwitchButton;

const SwitchButton = ({
  currentState,
  updatedState,
  text,
  stateText,
  onClick,
}) => {
  return (
    <button
      className={`px-4 py-2 m-2 ${
        currentState === stateText
          ? "bg-blue-500 text-white"
          : "bg-white text-black"
      }`}
      onClick={() => {
        updatedState(stateText);
        onClick();
      }}>
      {text}
    </button>
  );
};

export default SwitchButton;
