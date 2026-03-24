import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cacComplianceApi from './cacComplianceApi';

const initialState = {
  letters: [],
  currentLetter: null,
  lettersPagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  error: null,
};

export const fetchLetters = createAsyncThunk(
  'cacLetters/fetchLetters',
  async (params, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getLetters(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch letters');
    }
  }
);

export const fetchLettersByCompany = createAsyncThunk(
  'cacLetters/fetchLettersByCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.getLettersByCompany(companyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch company letters');
    }
  }
);

export const generateLetter = createAsyncThunk(
  'cacLetters/generateLetter',
  async (data, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.generateLetter(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate letter');
    }
  }
);

export const updateLetter = createAsyncThunk(
  'cacLetters/updateLetter',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.updateLetter(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update letter');
    }
  }
);

export const markLetterSent = createAsyncThunk(
  'cacLetters/markLetterSent',
  async ({ id, sentTo }, { rejectWithValue }) => {
    try {
      const response = await cacComplianceApi.markLetterSent(id, sentTo);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark letter as sent');
    }
  }
);

export const deleteLetter = createAsyncThunk(
  'cacLetters/deleteLetter',
  async (id, { rejectWithValue }) => {
    try {
      await cacComplianceApi.deleteLetter(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete letter');
    }
  }
);

const cacLettersSlice = createSlice({
  name: 'cacLetters',
  initialState,
  reducers: {
    clearCurrentLetter: (state) => {
      state.currentLetter = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLetters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLetters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.letters = action.payload.data;
        state.lettersPagination = action.payload.pagination;
      })
      .addCase(fetchLetters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchLettersByCompany.fulfilled, (state, action) => {
        state.letters = action.payload;
      })
      .addCase(generateLetter.fulfilled, (state, action) => {
        state.letters.unshift(action.payload);
        state.currentLetter = action.payload;
      })
      .addCase(updateLetter.fulfilled, (state, action) => {
        const index = state.letters.findIndex(l => l._id === action.payload._id);
        if (index !== -1) {
          state.letters[index] = action.payload;
        }
        state.currentLetter = action.payload;
      })
      .addCase(markLetterSent.fulfilled, (state, action) => {
        const index = state.letters.findIndex(l => l._id === action.payload._id);
        if (index !== -1) {
          state.letters[index] = action.payload;
        }
      })
      .addCase(deleteLetter.fulfilled, (state, action) => {
        state.letters = state.letters.filter(l => l._id !== action.payload);
        if (state.currentLetter?._id === action.payload) {
          state.currentLetter = null;
        }
      });
  },
});

export const { clearCurrentLetter, clearError } = cacLettersSlice.actions;
export default cacLettersSlice.reducer;
