import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import notesService from "./notesService";

const initialState = {
  notes: [],
  currentNote: null,
  trashNotes: [],
  stats: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    pageSize: 10,
  },
  filters: {
    search: "",
    category: "",
    sort: "newest",
    isPinned: "",
    isFavorite: "",
  },
  isLoading: false,
  isError: false,
  error: "",
};

export const fetchNotes = createAsyncThunk(
  "notes/fetchNotes",
  async (params = {}, thunkAPI) => {
    try {
      return await notesService.getNotes(params);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch notes";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchNote = createAsyncThunk(
  "notes/fetchNote",
  async (id, thunkAPI) => {
    try {
      return await notesService.getNote(id);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch note";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createNote = createAsyncThunk(
  "notes/createNote",
  async (noteData, thunkAPI) => {
    try {
      const response = await notesService.createNote(noteData);
      toast.success("Note created successfully");
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to create note";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateNote = createAsyncThunk(
  "notes/updateNote",
  async ({ id, noteData }, thunkAPI) => {
    try {
      const response = await notesService.updateNote(id, noteData);
      toast.success("Note updated successfully");
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to update note";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteNote = createAsyncThunk(
  "notes/deleteNote",
  async ({ id, hard = false }, thunkAPI) => {
    try {
      await notesService.deleteNote(id, hard);
      toast.success(hard ? "Note permanently deleted" : "Note moved to trash");
      return id;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete note";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const restoreNote = createAsyncThunk(
  "notes/restoreNote",
  async (id, thunkAPI) => {
    try {
      const response = await notesService.restoreNote(id);
      toast.success("Note restored successfully");
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to restore note";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const togglePin = createAsyncThunk(
  "notes/togglePin",
  async (id, thunkAPI) => {
    try {
      const response = await notesService.togglePin(id);
      toast.success(response.data.note.isPinned ? "Note pinned" : "Note unpinned");
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to pin note";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  "notes/toggleFavorite",
  async (id, thunkAPI) => {
    try {
      const response = await notesService.toggleFavorite(id);
      toast.success(response.data.note.isFavorite ? "Added to favorites" : "Removed from favorites");
      return response;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to favorite note";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchTrashNotes = createAsyncThunk(
  "notes/fetchTrashNotes",
  async (params = {}, thunkAPI) => {
    try {
      return await notesService.getTrashNotes(params);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch trash notes";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchNoteStats = createAsyncThunk(
  "notes/fetchStats",
  async (_, thunkAPI) => {
    try {
      return await notesService.getNoteStats();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to fetch stats";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentNote: (state, action) => {
      state.currentNote = action.payload;
    },
    clearError: (state) => {
      state.isError = false;
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notes = action.payload.data.notes;
        state.pagination = action.payload.data.pagination;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.error = action.payload;
      })
      .addCase(fetchNote.fulfilled, (state, action) => {
        state.currentNote = action.payload.data.note;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.notes.unshift(action.payload.data.note);
        state.pagination.totalDocs += 1;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex(n => n._id === action.payload.data.note._id);
        if (index !== -1) {
          state.notes[index] = action.payload.data.note;
        }
        if (state.currentNote?._id === action.payload.data.note._id) {
          state.currentNote = action.payload.data.note;
        }
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.notes = state.notes.filter(n => n._id !== action.payload);
        state.pagination.totalDocs -= 1;
      })
      .addCase(restoreNote.fulfilled, (state, action) => {
        state.trashNotes = state.trashNotes.filter(n => n._id !== action.payload.data.note._id);
        state.notes.unshift(action.payload.data.note);
      })
      .addCase(togglePin.fulfilled, (state, action) => {
        const note = state.notes.find(n => n._id === action.payload.data.note._id);
        if (note) {
          note.isPinned = action.payload.data.note.isPinned;
        }
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const note = state.notes.find(n => n._id === action.payload.data.note._id);
        if (note) {
          note.isFavorite = action.payload.data.note.isFavorite;
        }
      })
      .addCase(fetchTrashNotes.fulfilled, (state, action) => {
        state.trashNotes = action.payload.data.notes;
      })
      .addCase(fetchNoteStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      });
  },
});

export const { setFilters, resetFilters, setCurrentNote, clearError } = notesSlice.actions;
export default notesSlice.reducer;
