import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import templateService from "./templateService";

const initialState = {
  templates: [],
  featuredTemplates: [],
  templatesByPracticeArea: {},
  selectedTemplate: null,
  generatedDocuments: [],
  selectedDocument: null,
  isLoading: false,
  isGenerating: false,
  isExporting: false,
  isError: false,
  isSuccess: false,
  message: "",
  pagination: {
    current: 1,
    total: 0,
    limit: 20,
    totalRecords: 0,
  },
};

export const getAllTemplates = createAsyncThunk(
  "template/getAll",
  async (params, thunkAPI) => {
    try {
      return await templateService.getAllTemplates(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getFeaturedTemplates = createAsyncThunk(
  "template/getFeatured",
  async (_, thunkAPI) => {
    try {
      return await templateService.getFeaturedTemplates();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getTemplatesByPracticeArea = createAsyncThunk(
  "template/getByPracticeArea",
  async (params, thunkAPI) => {
    try {
      return await templateService.getTemplatesByPracticeArea(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getTemplate = createAsyncThunk(
  "template/getOne",
  async (templateId, thunkAPI) => {
    try {
      return await templateService.getTemplate(templateId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const createTemplate = createAsyncThunk(
  "template/create",
  async (data, thunkAPI) => {
    try {
      return await templateService.createTemplate(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const updateTemplate = createAsyncThunk(
  "template/update",
  async ({ id, data }, thunkAPI) => {
    try {
      return await templateService.updateTemplate(id, data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const deleteTemplate = createAsyncThunk(
  "template/delete",
  async (id, thunkAPI) => {
    try {
      return await templateService.deleteTemplate(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const duplicateTemplate = createAsyncThunk(
  "template/duplicate",
  async (id, thunkAPI) => {
    try {
      return await templateService.duplicateTemplate(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const generateDocument = createAsyncThunk(
  "template/generate",
  async ({ templateId, data }, thunkAPI) => {
    try {
      return await templateService.generateDocument(templateId, data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getGeneratedDocuments = createAsyncThunk(
  "template/getGeneratedDocuments",
  async (params, thunkAPI) => {
    try {
      return await templateService.getGeneratedDocuments(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const getGeneratedDocument = createAsyncThunk(
  "template/getGeneratedDocument",
  async (id, thunkAPI) => {
    try {
      return await templateService.getGeneratedDocument(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const updateGeneratedDocument = createAsyncThunk(
  "template/updateGeneratedDocument",
  async ({ id, data }, thunkAPI) => {
    try {
      return await templateService.updateGeneratedDocument(id, data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

export const exportDocument = createAsyncThunk(
  "template/exportDocument",
  async ({ id, format }, thunkAPI) => {
    try {
      return await templateService.exportDocument(id, format);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || error.toString(),
      );
    }
  },
);

const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {
    resetTemplateState: (state) => {
      state.isLoading = false;
      state.isGenerating = false;
      state.isExporting = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
    },
    clearSelectedDocument: (state) => {
      state.selectedDocument = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllTemplates.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.templates = action.payload.data;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(getAllTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getFeaturedTemplates.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFeaturedTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredTemplates = action.payload.data;
      })
      .addCase(getFeaturedTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getTemplatesByPracticeArea.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTemplatesByPracticeArea.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templatesByPracticeArea = action.payload.data;
      })
      .addCase(getTemplatesByPracticeArea.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getTemplate.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedTemplate = action.payload.data;
      })
      .addCase(getTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createTemplate.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.templates.push(action.payload.data);
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateTemplate.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.templates.findIndex(
          (t) => t._id === action.payload.data._id,
        );
        if (index !== -1) {
          state.templates[index] = action.payload.data;
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteTemplate.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.templates = state.templates.filter(
          (t) => t._id !== action.meta.arg,
        );
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(duplicateTemplate.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(duplicateTemplate.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.templates.push(action.payload.data);
      })
      .addCase(duplicateTemplate.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(generateDocument.pending, (state) => {
        state.isGenerating = true;
      })
      .addCase(generateDocument.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.isSuccess = true;
        state.selectedDocument = action.payload.data;
        state.generatedDocuments.push(action.payload.data);
      })
      .addCase(generateDocument.rejected, (state, action) => {
        state.isGenerating = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getGeneratedDocuments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGeneratedDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.generatedDocuments = action.payload.data;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(getGeneratedDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getGeneratedDocument.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGeneratedDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedDocument = action.payload.data;
      })
      .addCase(getGeneratedDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateGeneratedDocument.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateGeneratedDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.generatedDocuments.findIndex(
          (d) => d._id === action.payload.data._id,
        );
        if (index !== -1) {
          state.generatedDocuments[index] = action.payload.data;
        }
        if (state.selectedDocument?._id === action.payload.data._id) {
          state.selectedDocument = action.payload.data;
        }
      })
      .addCase(updateGeneratedDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(exportDocument.pending, (state) => {
        state.isExporting = true;
      })
      .addCase(exportDocument.fulfilled, (state, action) => {
        state.isExporting = false;
      })
      .addCase(exportDocument.rejected, (state, action) => {
        state.isExporting = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const {
  resetTemplateState,
  clearSelectedTemplate,
  clearSelectedDocument,
} = templateSlice.actions;

export const selectTemplates = (state) => state.template.templates;
export const selectFeaturedTemplates = (state) =>
  state.template.featuredTemplates;
export const selectSelectedTemplate = (state) =>
  state.template.selectedTemplate;
export const selectTemplatesByPracticeArea = (state) =>
  state.template.templatesByPracticeArea;
export const selectGeneratedDocuments = (state) =>
  state.template.generatedDocuments;
export const selectSelectedDocument = (state) =>
  state.template.selectedDocument;
export const selectTemplateLoading = (state) => state.template.isLoading;
export const selectIsGenerating = (state) => state.template.isGenerating;
export const selectIsExporting = (state) => state.template.isExporting;
export const selectTemplatePagination = (state) => state.template.pagination;
export const selectTemplateError = (state) => state.template.isError;
export const selectTemplateSuccess = (state) => state.template.isSuccess;
export const selectTemplateMessage = (state) => state.template.message;

export default templateSlice.reducer;
