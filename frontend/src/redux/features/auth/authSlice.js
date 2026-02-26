import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";
import { toast } from "react-toastify";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const initialState = {
  // ── Auth ──────────────────────────────────────
  isLoggedIn: false,
  user: null,
  twoFactor: false,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",

  // ── Users list (with cache) ───────────────────
  users: null,
  usersLoading: false,
  usersLastFetched: null,

  // ── Statistics ────────────────────────────────
  userStatistics: null, // GET /statistics/general
  staffStatistics: null, // GET /statistics/staff
  clientStatistics: null, // GET /statistics/clients
  statusStatistics: null, // GET /statistics/status
  statisticsLoading: false,
  statisticsError: null,
};

// ============================================
// AUTH THUNKS
// ============================================

export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    return await authService.logout();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || error.message || error.toString(),
    );
  }
});

export const getLoginStatus = createAsyncThunk(
  "auth/getLoginStatus",
  async (_, thunkAPI) => {
    try {
      return await authService.getLoginStatus();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getUser = createAsyncThunk("auth/getUser", async (_, thunkAPI) => {
  try {
    return await authService.getUser();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || error.message || error.toString(),
    );
  }
});

export const getUsers = createAsyncThunk(
  "auth/getUsers",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const now = Date.now();
      if (
        state.auth.users?.data?.length &&
        state.auth.usersLastFetched &&
        now - state.auth.usersLastFetched < CACHE_DURATION
      ) {
        return state.auth.users;
      }
      return await authService.getUsers();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

// ============================================
// STATISTICS THUNKS
// ============================================

export const getUserStatistics = createAsyncThunk(
  "auth/getUserStatistics",
  async (_, thunkAPI) => {
    try {
      return await authService.getUserStatistics();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getStaffStatistics = createAsyncThunk(
  "auth/getStaffStatistics",
  async (_, thunkAPI) => {
    try {
      return await authService.getStaffStatistics();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getClientStatistics = createAsyncThunk(
  "auth/getClientStatistics",
  async (_, thunkAPI) => {
    try {
      return await authService.getClientStatistics();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getStatusStatistics = createAsyncThunk(
  "auth/getStatusStatistics",
  async (_, thunkAPI) => {
    try {
      return await authService.getStatusStatistics();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

// ============================================
// USER MANAGEMENT THUNKS
// ============================================

export const sendVerificationMail = createAsyncThunk(
  "auth/sendVerificationMail",
  async (email, thunkAPI) => {
    try {
      return await authService.sendVerificationMail(email);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const verifyUser = createAsyncThunk(
  "auth/verifyUser",
  async (verificationToken, thunkAPI) => {
    try {
      const response = await authService.verifyUser(verificationToken);
      await thunkAPI.dispatch(getUser());
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const forgotUserPassword = createAsyncThunk(
  "auth/forgotUserPassword",
  async (userData, thunkAPI) => {
    try {
      return await authService.forgotUserPassword(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, userData }, thunkAPI) => {
    try {
      return await authService.resetPassword(resetToken, userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (userData, thunkAPI) => {
    try {
      return await authService.changePassword(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const deleteUser = createAsyncThunk(
  "auth/deleteUser",
  async (id, thunkAPI) => {
    try {
      return await authService.deleteUser(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const softDeleteUser = createAsyncThunk(
  "auth/softDeleteUser",
  async (id, thunkAPI) => {
    try {
      return await authService.softDeleteUser(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const restoreUser = createAsyncThunk(
  "auth/restoreUser",
  async (id, thunkAPI) => {
    try {
      return await authService.restoreUser(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const upgradeUser = createAsyncThunk(
  "auth/upgradeUser",
  async ({ id, userData }, thunkAPI) => {
    try {
      return await authService.upgradeUser(id, userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

// ============================================
// 2FA & SOCIAL AUTH THUNKS
// ============================================

export const sendLoginCode = createAsyncThunk(
  "auth/sendLoginCode",
  async (email, thunkAPI) => {
    try {
      return await authService.sendLoginCode(email);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const loginWithCode = createAsyncThunk(
  "auth/loginWithCode",
  async ({ code, email }, thunkAPI) => {
    try {
      // `code` is now a plain string e.g. "123456"
      // authService.loginWithCode should post { loginCode: code } to
      // PATCH /api/v1/users/loginWithCode/:email
      const response = await authService.loginWithCode(code, email);
      await thunkAPI.dispatch(getUser());
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async ({ userToken }, thunkAPI) => {
    try {
      const response = await authService.loginWithGoogle(userToken);
      await thunkAPI.dispatch(getUser());
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

// ============================================
// SLICE
// ============================================

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    RESET(state) {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = "";
      state.twoFactor = false;
    },
    clearUsersCache(state) {
      state.users = null;
      state.usersLastFetched = null;
    },
    updateUserInCache(state, action) {
      if (state.users?.data) {
        const index = state.users.data.findIndex(
          (u) => u._id === action.payload._id,
        );
        if (index !== -1) state.users.data[index] = action.payload;
      }
    },
    removeUserFromCache(state, action) {
      if (state.users?.data) {
        state.users.data = state.users.data.filter(
          (u) => u._id !== action.payload,
        );
      }
    },
    updateCurrentUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearStatistics(state) {
      state.userStatistics = null;
      state.staffStatistics = null;
      state.clientStatistics = null;
      state.statusStatistics = null;
      state.statisticsError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ── register ──────────────────────────────────
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "User added successfully";
        state.users = null;
        state.usersLastFetched = null;
        toast.success("User added successfully");
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── login ─────────────────────────────────────
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isLoggedIn = true;
        state.user = action.payload;
        toast.success("Login Successful");
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
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

      // ── logout ────────────────────────────────────
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = null;
        state.isLoggedIn = false;
        state.users = null;
        state.usersLastFetched = null;
        state.userStatistics = null;
        state.staffStatistics = null;
        state.clientStatistics = null;
        state.statusStatistics = null;
        toast.success(action.payload);
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── getLoginStatus ────────────────────────────
      .addCase(getLoginStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLoginStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isLoggedIn = action.payload;
      })
      .addCase(getLoginStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.isLoggedIn = false;
      })

      // ── getUser ───────────────────────────────────
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isLoggedIn = true;
        state.user = action.payload;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // ── getUsers ──────────────────────────────────
      .addCase(getUsers.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.isSuccess = true;
        state.users = action.payload;
        state.usersLastFetched = Date.now();
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── getUserStatistics ─────────────────────────
      .addCase(getUserStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })
      .addCase(getUserStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.userStatistics = action.payload;
      })
      .addCase(getUserStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        // Store as string to prevent objects reaching JSX
        state.statisticsError = String(
          action.payload || "Failed to load statistics",
        );
        toast.error(state.statisticsError);
      })

      // ── getStaffStatistics ────────────────────────
      .addCase(getStaffStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })
      .addCase(getStaffStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.staffStatistics = action.payload;
      })
      .addCase(getStaffStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.statisticsError = String(
          action.payload || "Failed to load staff statistics",
        );
        toast.error(state.statisticsError);
      })

      // ── getClientStatistics ───────────────────────
      .addCase(getClientStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })
      .addCase(getClientStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.clientStatistics = action.payload;
      })
      .addCase(getClientStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.statisticsError = String(
          action.payload || "Failed to load client statistics",
        );
        toast.error(state.statisticsError);
      })

      // ── getStatusStatistics ───────────────────────
      .addCase(getStatusStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })
      .addCase(getStatusStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statusStatistics = action.payload;
      })
      .addCase(getStatusStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.statisticsError = String(
          action.payload || "Failed to load status statistics",
        );
        toast.error(state.statisticsError);
      })

      // ── sendVerificationMail ──────────────────────
      .addCase(sendVerificationMail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendVerificationMail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(sendVerificationMail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── verifyUser ────────────────────────────────
      .addCase(verifyUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(verifyUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── forgotUserPassword ────────────────────────
      .addCase(forgotUserPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotUserPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(forgotUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── resetPassword ─────────────────────────────
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── changePassword ────────────────────────────
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── deleteUser (hard) ─────────────────────────
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        state.users = null;
        state.usersLastFetched = null;
        toast.success(action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── softDeleteUser ────────────────────────────
      .addCase(softDeleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(softDeleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updated = action.payload?.data?.user || action.payload?.data;
        if (updated && state.users?.data) {
          const idx = state.users.data.findIndex((u) => u._id === updated._id);
          if (idx !== -1) state.users.data[idx] = updated;
        }
        toast.success("User deactivated successfully");
      })
      .addCase(softDeleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── restoreUser ───────────────────────────────
      .addCase(restoreUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updated = action.payload?.data?.user || action.payload?.data;
        if (updated && state.users?.data) {
          const idx = state.users.data.findIndex((u) => u._id === updated._id);
          if (idx !== -1) state.users.data[idx] = updated;
        }
        toast.success("User restored successfully");
      })
      .addCase(restoreUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── upgradeUser ───────────────────────────────
      .addCase(upgradeUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(upgradeUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updated = action.payload?.data?.user || action.payload?.data;
        if (updated && state.users?.data) {
          const idx = state.users.data.findIndex((u) => u._id === updated._id);
          if (idx !== -1) state.users.data[idx] = updated;
        }
        toast.success("User updated successfully");
      })
      .addCase(upgradeUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── sendLoginCode ─────────────────────────────
      .addCase(sendLoginCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendLoginCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
        toast.success(action.payload);
      })
      .addCase(sendLoginCode.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        toast.error(action.payload);
      })

      // ── loginWithCode ─────────────────────────────
      .addCase(loginWithCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginWithCode.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isLoggedIn = true;
        state.twoFactor = false;
        toast.success("Login Successful");
      })
      .addCase(loginWithCode.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        toast.error(action.payload);
      })

      // ── loginWithGoogle ───────────────────────────
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginWithGoogle.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isLoggedIn = true;
        toast.success("Login Successful");
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        toast.error(action.payload);
      });
  },
});

// ── Actions ───────────────────────────────────────────────────────────────────
export const {
  RESET,
  clearUsersCache,
  updateUserInCache,
  removeUserFromCache,
  updateCurrentUser,
  clearStatistics,
} = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;
export const selectUser = (state) => state.auth.user;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectUsers = (state) => state.auth.users;
export const selectUsersLoading = (state) => state.auth.usersLoading;
export const selectUserStatistics = (state) => state.auth.userStatistics;
export const selectStaffStatistics = (state) => state.auth.staffStatistics;
export const selectClientStatistics = (state) => state.auth.clientStatistics;
export const selectStatusStatistics = (state) => state.auth.statusStatistics;
export const selectStatisticsLoading = (state) => state.auth.statisticsLoading;
export const selectStatisticsError = (state) => state.auth.statisticsError;

export default authSlice.reducer;
