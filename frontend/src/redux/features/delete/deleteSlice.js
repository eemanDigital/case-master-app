import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import deleteService from "./deleteService";
import { toast } from "react-toastify";

const initialState = {
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// delete Data
export const deleteData = createAsyncThunk(
  "delete/deleteData",
  async (endpoints, thunkAPI) => {
    try {
      return await deleteService.deleteData(endpoints);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const deleteSlice = createSlice({
  name: "delete",
  initialState,
  reducers: {
    RESET(state) {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // delete user
      .addCase(deleteData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteData.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(deleteData.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { RESET } = deleteSlice.actions;

export default deleteSlice.reducer;
