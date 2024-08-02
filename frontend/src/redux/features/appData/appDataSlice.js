// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import appDataService from "./appDataService";

// const initialState = {
//   isLoading: false,
//   isError: false,
//   isSuccess: false,
//   data: [],
//   message: "",
// };

// export const getCases = createAsyncThunk(
//   "auth/getCases",
//   async (_, thunkAPI) => {
//     try {
//       return await appDataService.getCases();
//     } catch (error) {
//       const message =
//         (error.response &&
//           error.response.data &&
//           error.response.data.message) ||
//         error.message ||
//         error.toString();
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );

// const appDataSlice = createSlice({
//   name: "appData",
//   initialState,
//   reducers: {
//     RESET(state) {
//       state.isError = false;
//       state.isSuccess = false;
//       state.isLoading = false;
//       state.message = "";
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // register user
//       .addCase(register.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(register.fulfilled, (state, action) => {
//         state.isSuccess = true;
//         state.isLoading = false;
//         state.message = true;
//         state.user = action.payload;
//         state.isLoggedIn = true; // Update isLoggedIn state
//         toast.success("Registration Successful");
//       })
//       .addCase(register.rejected, (state, action) => {
//         state.isError = true;
//         // state.isLoading = false;
//         state.message = action.payload;
//         state.user = null;
//         state.isLoggedIn = false; // Update isLoggedIn state
//         toast.error(action.payload);
//       })
// });

// export const {} = appDataSlice.actions;

// export default appDataSlice.reducer;
