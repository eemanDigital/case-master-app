import { createSlice } from "@reduxjs/toolkit";

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    isDarkMode: localStorage.getItem("darkMode")
      ? JSON.parse(localStorage.getItem("darkMode"))
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  },
  reducers: {
    setTheme: (state, action) => {
      state.isDarkMode = action.payload;
      localStorage.setItem("darkMode", JSON.stringify(action.payload));
    },
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem("darkMode", JSON.stringify(state.isDarkMode));
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
