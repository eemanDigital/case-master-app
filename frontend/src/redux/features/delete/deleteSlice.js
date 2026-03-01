import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import deleteService from "./deleteService";

const initialState = {
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

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

export const postData = createAsyncThunk(
  "delete/postData",
  async ({ endpoint, data }, thunkAPI) => {
    try {
      return await deleteService.postData({ endpoint, data });
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

export const putData = createAsyncThunk(
  "delete/putData",
  async ({ endpoint, data }, thunkAPI) => {
    try {
      return await deleteService.putData({ endpoint, data });
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

export const patchData = createAsyncThunk(
  "delete/patchData",
  async ({ endpoint, data }, thunkAPI) => {
    try {
      return await deleteService.patchData({ endpoint, data });
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
      .addCase(deleteData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteData.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(deleteData.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(postData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(postData.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(postData.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(putData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(putData.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(putData.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(patchData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(patchData.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
      })
      .addCase(patchData.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
      });
  },
});

export const { RESET } = deleteSlice.actions;

export default deleteSlice.reducer;
