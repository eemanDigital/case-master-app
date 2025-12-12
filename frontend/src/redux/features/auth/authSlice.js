import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";
import { toast } from "react-toastify";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const initialState = {
  isLoggedIn: false,
  user: null,
  users: null,
  usersLoading: false,
  usersLastFetched: null,
  twoFactor: false,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// register user
export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
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

// ✅ UPDATED: login user - auto-fetch user data after successful login
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      const response = await authService.login(userData);
      // ✅ Don't auto-fetch here - let the Login component handle it
      // This gives us more control over the flow
      return response;
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

// logout user
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    return await authService.logout();
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// get login status
export const getLoginStatus = createAsyncThunk(
  "auth/getLoginStatus",
  async (_, thunkAPI) => {
    try {
      return await authService.getLoginStatus();
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

// get user
export const getUser = createAsyncThunk("auth/getUser", async (_, thunkAPI) => {
  try {
    return await authService.getUser();
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// get users - WITH CACHING
export const getUsers = createAsyncThunk(
  "auth/getUsers",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const now = Date.now();

      // ✅ CHECK CACHE FIRST
      if (
        state.auth.users?.data?.length &&
        state.auth.usersLastFetched &&
        now - state.auth.usersLastFetched < CACHE_DURATION
      ) {
        console.log("✅ Using cached users data");
        return state.auth.users;
      }

      console.log("📡 Fetching fresh users data from API");
      return await authService.getUsers();
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

// send verification email
export const sendVerificationMail = createAsyncThunk(
  "auth/sendVerificationMail",
  async (email, thunkAPI) => {
    try {
      return await authService.sendVerificationMail(email);
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

// ✅ UPDATED: verify user - refresh user data after verification
export const verifyUser = createAsyncThunk(
  "auth/verifyUser",
  async (verificationToken, thunkAPI) => {
    try {
      const response = await authService.verifyUser(verificationToken);
      // ✅ Auto-fetch fresh user data after verification
      await thunkAPI.dispatch(getUser());
      return response;
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

// forgot password
export const forgotUserPassword = createAsyncThunk(
  "auth/forgotUserPassword",
  async (userData, thunkAPI) => {
    try {
      return await authService.forgotUserPassword(userData);
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

// reset password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, userData }, thunkAPI) => {
    try {
      return await authService.resetPassword(resetToken, userData);
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

// change password
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (userData, thunkAPI) => {
    try {
      return await authService.changePassword(userData);
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

// delete user
export const deleteUser = createAsyncThunk(
  "auth/deleteUser",
  async (id, thunkAPI) => {
    try {
      return await authService.deleteUser(id);
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

// send login code for 2fa
export const sendLoginCode = createAsyncThunk(
  "auth/sendLoginCode",
  async (email, thunkAPI) => {
    try {
      return await authService.sendLoginCode(email);
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

// ✅ UPDATED: login with code 2FA - fetch user data after successful login
export const loginWithCode = createAsyncThunk(
  "auth/loginWithCode",
  async ({ code, email }, thunkAPI) => {
    try {
      const response = await authService.loginWithCode(code, email);
      // ✅ Auto-fetch fresh user data after 2FA login
      await thunkAPI.dispatch(getUser());
      return response;
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

// ✅ UPDATED: login With Google - fetch user data after successful login
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (userToken, thunkAPI) => {
    try {
      const response = await authService.loginWithGoogle(userToken);
      // ✅ Auto-fetch fresh user data after Google login
      await thunkAPI.dispatch(getUser());
      return response;
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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    RESET(state) {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = "";
      state.twoFactor = false; // ✅ Also reset twoFactor flag
    },
    // Clear users cache
    clearUsersCache(state) {
      state.users = null;
      state.usersLastFetched = null;
      console.log("🗑️ Users cache cleared");
    },
    // Update single user in cache
    updateUserInCache(state, action) {
      if (state.users?.data) {
        const index = state.users.data.findIndex(
          (u) => u._id === action.payload._id
        );
        if (index !== -1) {
          state.users.data[index] = action.payload;
          console.log("✏️ User updated in cache:", action.payload._id);
        }
      }
    },
    // Remove user from cache
    removeUserFromCache(state, action) {
      if (state.users?.data) {
        state.users.data = state.users.data.filter(
          (u) => u._id !== action.payload
        );
        console.log("🗑️ User removed from cache:", action.payload);
      }
    },
    // ✅ NEW: Manual user update for verification status
    updateCurrentUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        console.log("✏️ Current user updated:", action.payload);
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // register user
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = "User added successfully";
        state.users = null;
        state.usersLastFetched = null;
        toast.success("User added successfully");
      })
      .addCase(register.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // login user
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.isLoggedIn = true;
        // ✅ Set basic user data, full data will be fetched by getUser
        state.user = action.payload;
        toast.success("Login Successful");
      })
      .addCase(login.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        state.user = null;
        state.isLoggedIn = false;
        toast.error(action.payload);
        if (
          action.payload?.includes("New Browser") ||
          action.payload?.includes("new browser")
        ) {
          state.twoFactor = true;
        }
      })

      // logout user
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.user = null;
        state.isLoggedIn = false;
        state.users = null;
        state.usersLastFetched = null;
        toast.success(action.payload);
      })
      .addCase(logout.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // login status
      .addCase(getLoginStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLoginStatus.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.isLoggedIn = action.payload;
      })
      .addCase(getLoginStatus.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        state.isLoggedIn = false; // ✅ Set to false on error
      })

      // get user
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.isLoggedIn = true;
        state.user = action.payload;
        console.log(
          "✅ User data refreshed:",
          action.payload?.data?.isVerified
        );
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        // Don't show toast for getUser failures - happens silently
      })

      // get users - WITH CACHE TRACKING
      .addCase(getUsers.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.usersLoading = false;
        state.users = action.payload;
        state.usersLastFetched = Date.now();
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isError = true;
        state.usersLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // send verification email
      .addCase(sendVerificationMail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendVerificationMail.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(sendVerificationMail.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // verify user
      .addCase(verifyUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyUser.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
        // ✅ User data will be updated by the getUser call in the thunk
        toast.success(action.payload);
      })
      .addCase(verifyUser.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // forgot password
      .addCase(forgotUserPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotUserPassword.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(forgotUserPassword.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // reset password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
        state.users = null;
        state.usersLastFetched = null;
        toast.success(action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // send login code
      .addCase(sendLoginCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendLoginCode.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(sendLoginCode.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // login with code
      .addCase(loginWithCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginWithCode.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.isLoggedIn = true;
        state.twoFactor = false;
        // ✅ User data will be updated by getUser call in thunk
        toast.success("Login Successful");
      })
      .addCase(loginWithCode.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        state.user = null;
        toast.error(action.payload);
      })

      // login with google
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.isLoading = false;
        state.isLoggedIn = true;
        // ✅ User data will be updated by getUser call in thunk
        toast.success("Login Successful");
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.message = action.payload;
        state.user = null;
        toast.error(action.payload);
      });
  },
});

export const {
  RESET,
  clearUsersCache,
  updateUserInCache,
  removeUserFromCache,
  updateCurrentUser,
} = authSlice.actions;

export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectUser = (state) => state.auth.user;
export const selectIsLoading = (state) => state.auth.isLoading;

export default authSlice.reducer;
