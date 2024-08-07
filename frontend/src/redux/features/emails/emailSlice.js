import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import emailService from "./emailService";

const initialState = {
  sendingEmail: false,
  emailSent: false,
  msg: "",
};

// send automated email
export const sendAutomatedEmail = createAsyncThunk(
  "email/sendAutomatedEmail",
  async (emailData, thunkAPI) => {
    try {
      return await emailService.sendAutomatedEmail(emailData);
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

export const sendAutomatedCustomEmail = createAsyncThunk(
  "email/sendAutomatedCustomEmail",
  async (emailData, thunkAPI) => {
    try {
      return await emailService.sendAutomatedCustomEmail(emailData);
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

const emailSlice = createSlice({
  name: "email",
  initialState,
  reducers: {
    EMAIL_RESET(state) {
      state.sendingEmail = false;
      state.emailSent = false;
      state.msg = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // send automated email
      .addCase(sendAutomatedEmail.pending, (state) => {
        state.sendingEmail = true;
      })
      .addCase(sendAutomatedEmail.fulfilled, (state, action) => {
        state.sendingEmail = false;
        state.emailSent = true;
        state.msg = action.payload;
        toast.success(action.payload);
      })
      .addCase(sendAutomatedEmail.rejected, (state, action) => {
        state.sendingEmail = false;
        state.emailSent = false;
        state.msg = action.payload;
        toast.error(action.payload);
      })
      // send Automated Custom Email
      .addCase(sendAutomatedCustomEmail.pending, (state) => {
        state.sendingEmail = true;
      })
      .addCase(sendAutomatedCustomEmail.fulfilled, (state, action) => {
        state.sendingEmail = false;
        state.emailSent = true;
        state.msg = action.payload;
        toast.success(action.payload);
      })
      .addCase(sendAutomatedCustomEmail.rejected, (state, action) => {
        state.sendingEmail = false;
        state.emailSent = false;
        state.msg = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { EMAIL_RESET } = emailSlice.actions;

export default emailSlice.reducer;
