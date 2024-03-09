import { createContext, useState } from "react";

export const BackgroundContextProvider = () => {
  const BackgroundContext = createContext();
  const [background, setBackground] = useState(false);

  function toggleBg() {
    setBackground(() => !background);
  }

  return { BackgroundContext, background, setBackground, toggleBg };
};
