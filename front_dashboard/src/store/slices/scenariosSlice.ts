import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { 
  EnhancedScenario, 
  Scenario, 
  ScenarioStatus, 
  ExecutionStatus, 
  PhaseStatus, 
  EnvironmentalFactorType, 
  AnalysisType,
  AnalysisResult
} from '@/types';
import { scenarioApiService, ScenarioFormData } from '@/services/api/scenarioApiService';
import { ApiClientError } from '@/services/api/baseApiClient';


// وضعیت اولیه
interface ScenariosState {
  scenarios: EnhancedScenario[];
  currentScenario: EnhancedScenario | null;
  isLoading: boolean;
  error: string | null;
  simulationStatus: ExecutionStatus;
  scenarioExecutionTime: string | null;
  lastAnalysisResult: any | null;
}

const initialState: ScenariosState = {
  scenarios: [],
  currentScenario: null,
  isLoading: false,
  error: null,
  simulationStatus: ExecutionStatus.NOT_STARTED,
  scenarioExecutionTime: null,
  lastAnalysisResult: null,
};

// برای توسعه فعلی، از API service استفاده می‌کنیم
const MOCK_API_DELAY = 500;

// Thunks - Updated to use API service
export const fetchScenarios = createAsyncThunk(
  'scenarios/fetchScenarios',
  async (_, { rejectWithValue }) => {
    try {
      const scenarios = await scenarioApiService.getScenarios();
      return scenarios;
    } catch (error: any) {
      const message = error instanceof ApiClientError 
        ? error.message 
        : 'خطا در دریافت سناریوها';
      return rejectWithValue(message);
    }
  }
);

export const fetchScenarioById = createAsyncThunk(
  'scenarios/fetchScenarioById',
  async (id: string, { rejectWithValue }) => {
    try {
      const scenario = await scenarioApiService.getScenarioById(id);
      return scenario;
    } catch (error: any) {
      const message = error instanceof ApiClientError 
        ? error.message 
        : 'خطا در دریافت سناریو';
      return rejectWithValue(message);
    }
  }
);

export const createScenario = createAsyncThunk(
  'scenarios/createScenario',
  async (scenarioData: ScenarioFormData, { rejectWithValue }) => {
    try {
      const newScenario = await scenarioApiService.createScenario(scenarioData);
      return newScenario;
    } catch (error: any) {
      const message = error instanceof ApiClientError 
        ? error.message 
        : 'خطا در ایجاد سناریو';
      return rejectWithValue(message);
    }
  }
);

export const updateScenario = createAsyncThunk(
  'scenarios/updateScenario',
  async ({ id, updates }: { id: string; updates: Partial<EnhancedScenario> }, { rejectWithValue }) => {
    try {
      const updatedScenario = await scenarioApiService.updateScenario(id, updates);
      return { id, scenario: updatedScenario };
    } catch (error: any) {
      const message = error instanceof ApiClientError 
        ? error.message 
        : 'خطا در به‌روزرسانی سناریو';
      return rejectWithValue(message);
    }
  }
);

export const deleteScenario = createAsyncThunk(
  'scenarios/deleteScenario',
  async (id: string, { rejectWithValue }) => {
    try {
      await scenarioApiService.deleteScenario(id);
      return id;
    } catch (error: any) {
      const message = error instanceof ApiClientError 
        ? error.message 
        : 'خطا در حذف سناریو';
      return rejectWithValue(message);
    }
  }
);

// اسلایس جدید برای اجرای شبیه‌سازی سناریو
export const startScenarioExecution = createAsyncThunk(
  'scenarios/startExecution',
  async (id: string, { rejectWithValue }) => {
    try {
      // در نسخه نهایی، به API متصل می‌شود
      // const response = await axios.post(`/api/scenarios/${id}/execute`);
      // return response.data;
      
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
      return { id, status: ExecutionStatus.RUNNING, currentTime: new Date().toISOString() };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'خطا در شروع اجرای سناریو');
    }
  }
);

export const pauseScenarioExecution = createAsyncThunk(
  'scenarios/pauseExecution',
  async (id: string, { rejectWithValue }) => {
    try {
      // در نسخه نهایی، به API متصل می‌شود
      // const response = await axios.post(`/api/scenarios/${id}/pause`);
      // return response.data;
      
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
      return { id, status: ExecutionStatus.PAUSED };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'خطا در توقف اجرای سناریو');
    }
  }
);

export const resumeScenarioExecution = createAsyncThunk(
  'scenarios/resumeExecution',
  async (id: string, { rejectWithValue }) => {
    try {
      // در نسخه نهایی، به API متصل می‌شود
      // const response = await axios.post(`/api/scenarios/${id}/resume`);
      // return response.data;
      
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
      return { id, status: ExecutionStatus.RUNNING };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'خطا در ادامه اجرای سناریو');
    }
  }
);

export const stopScenarioExecution = createAsyncThunk(
  'scenarios/stopExecution',
  async (id: string, { rejectWithValue }) => {
    try {
      // در نسخه نهایی، به API متصل می‌شود
      // const response = await axios.post(`/api/scenarios/${id}/stop`);
      // return response.data;
      
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
      return { id, status: ExecutionStatus.COMPLETED };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'خطا در اتمام اجرای سناریو');
    }
  }
);

export const analyzeScenario = createAsyncThunk(
  'scenarios/analyze',
  async ({ id, analysisType }: { id: string; analysisType: AnalysisType }, { rejectWithValue }) => {
    try {
      // در نسخه نهایی، به API متصل می‌شود
      // const response = await axios.post(`/api/scenarios/${id}/analyze`, { analysisType });
      // return response.data;
      
      await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY));
      
      // نتیجه مصنوعی برای نمایش قابلیت
      const mockResult: AnalysisResult = {
        id: `analysis-${Date.now()}`,
        type: analysisType,
        timestamp: new Date().toISOString(),
        data: {
          chart: {
            labels: ['نیروهای خودی', 'نیروهای دشمن'],
            values: [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)],
          },
          statistics: {
            effectiveness: Math.random() * 100,
            probability: Math.random() * 100,
            risk: Math.random() * 100,
          }
        },
        conclusions: [
          'برتری نسبی نیروهای خودی در منطقه',
          'احتمال موفقیت عملیات در صورت حفظ منابع'
        ],
        recommendations: [
          'افزایش پشتیبانی آتش غیرمستقیم',
          'تقویت واحدهای شناسایی در جناح شرقی'
        ]
      };
      
      return { id, result: mockResult };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'خطا در تحلیل سناریو');
    }
  }
);

// اسلایس سناریو
const scenariosSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    setCurrentScenario: (state, action: PayloadAction<EnhancedScenario>) => {
      state.currentScenario = action.payload;
    },
    clearCurrentScenario: (state) => {
      state.currentScenario = null;
    },
    advanceScenarioTime: (state, action: PayloadAction<string>) => {
      state.scenarioExecutionTime = action.payload;
      if (state.currentScenario) {
        state.currentScenario.currentTime = action.payload;
      }
    },
    updateScenarioUnits: (state, action: PayloadAction<{ scenarioId: string; units: any[] }>) => {
      const { scenarioId, units } = action.payload;
      const scenarioIndex = state.scenarios.findIndex(s => s.id === scenarioId);
      
      if (scenarioIndex >= 0) {
        state.scenarios[scenarioIndex].units = units;
      }
      
      if (state.currentScenario?.id === scenarioId) {
        state.currentScenario.units = units;
      }
    },
    updateScenarioEvents: (state, action: PayloadAction<{ scenarioId: string; events: any[] }>) => {
      const { scenarioId, events } = action.payload;
      const scenarioIndex = state.scenarios.findIndex(s => s.id === scenarioId);
      
      if (scenarioIndex >= 0) {
        state.scenarios[scenarioIndex].events = events;
      }
      
      if (state.currentScenario?.id === scenarioId) {
        state.currentScenario.events = events;
      }
    },
    updateScenarioPhases: (state, action: PayloadAction<{ scenarioId: string; phases: any[] }>) => {
      const { scenarioId, phases } = action.payload;
      const scenarioIndex = state.scenarios.findIndex(s => s.id === scenarioId);
      
      if (scenarioIndex >= 0) {
        state.scenarios[scenarioIndex].phases = phases;
      }
      
      if (state.currentScenario?.id === scenarioId) {
        state.currentScenario.phases = phases;
      }
    },
  },
  extraReducers: (builder) => {
    // دریافت همه سناریوها
    builder.addCase(fetchScenarios.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchScenarios.fulfilled, (state, action) => {
      state.scenarios = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchScenarios.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // دریافت سناریو با شناسه
    builder.addCase(fetchScenarioById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchScenarioById.fulfilled, (state, action) => {
      state.currentScenario = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchScenarioById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // ایجاد سناریو
    builder.addCase(createScenario.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createScenario.fulfilled, (state, action) => {
      state.scenarios.push(action.payload);
      state.isLoading = false;
    });
    builder.addCase(createScenario.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // به‌روزرسانی سناریو
    builder.addCase(updateScenario.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateScenario.fulfilled, (state, action) => {
      const { id, scenario } = action.payload;
      const index = state.scenarios.findIndex((s) => s.id === id);
      
      if (index !== -1) {
        state.scenarios[index] = scenario;
      }
      
      if (state.currentScenario?.id === id) {
        state.currentScenario = scenario;
      }
      
      state.isLoading = false;
    });
    builder.addCase(updateScenario.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // حذف سناریو
    builder.addCase(deleteScenario.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteScenario.fulfilled, (state, action) => {
      state.scenarios = state.scenarios.filter((scenario) => scenario.id !== action.payload);
      
      if (state.currentScenario?.id === action.payload) {
        state.currentScenario = null;
      }
      
      state.isLoading = false;
    });
    builder.addCase(deleteScenario.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // شروع اجرای سناریو
    builder.addCase(startScenarioExecution.fulfilled, (state, action) => {
      const { id, status, currentTime } = action.payload;
      
      if (state.currentScenario?.id === id) {
        state.currentScenario.executionStatus = status;
        state.currentScenario.currentTime = currentTime;
        state.simulationStatus = status;
        state.scenarioExecutionTime = currentTime;
      }
    });
    
    // توقف اجرای سناریو
    builder.addCase(pauseScenarioExecution.fulfilled, (state, action) => {
      const { id, status } = action.payload;
      
      if (state.currentScenario?.id === id) {
        state.currentScenario.executionStatus = status;
        state.simulationStatus = status;
      }
    });
    
    // ادامه اجرای سناریو
    builder.addCase(resumeScenarioExecution.fulfilled, (state, action) => {
      const { id, status } = action.payload;
      
      if (state.currentScenario?.id === id) {
        state.currentScenario.executionStatus = status;
        state.simulationStatus = status;
      }
    });
    
    // اتمام اجرای سناریو
    builder.addCase(stopScenarioExecution.fulfilled, (state, action) => {
      const { id, status } = action.payload;
      
      if (state.currentScenario?.id === id) {
        state.currentScenario.executionStatus = status;
        state.simulationStatus = status;
      }
    });
    
    // تحلیل سناریو
    builder.addCase(analyzeScenario.fulfilled, (state, action) => {
      const { id, result } = action.payload;
      
      if (state.currentScenario?.id === id) {
        if (!state.currentScenario.analysisResults) {
          state.currentScenario.analysisResults = [];
        }
        
        state.currentScenario.analysisResults.push(result);
        state.lastAnalysisResult = result;
      }
    });
  },
});

// Selectors
export const selectScenarios = (state: RootState) => state.scenarios.scenarios;
export const selectCurrentScenario = (state: RootState) => state.scenarios.currentScenario;
export const selectScenariosLoading = (state: RootState) => state.scenarios.isLoading;
export const selectScenariosError = (state: RootState) => state.scenarios.error;
export const selectSimulationStatus = (state: RootState) => state.scenarios.simulationStatus;
export const selectScenarioExecutionTime = (state: RootState) => state.scenarios.scenarioExecutionTime;
export const selectLastAnalysisResult = (state: RootState) => state.scenarios.lastAnalysisResult;

// Actions
export const { 
  setCurrentScenario, 
  clearCurrentScenario, 
  advanceScenarioTime, 
  updateScenarioUnits, 
  updateScenarioEvents,
  updateScenarioPhases
} = scenariosSlice.actions;

// Reducer
export default scenariosSlice.reducer;

// داده‌های مصنوعی برای توسعه
const mockScenarios: EnhancedScenario[] = [
  {
    id: 'scenario-1',
    name: 'عملیات دفاعی در ارتفاعات شمالی',
    description: 'سناریوی دفاعی برای مقابله با نیروهای دشمن در ارتفاعات شمالی',
    startTime: '2023-10-15T08:00:00Z',
    endTime: '2023-10-18T16:00:00Z',
    status: ScenarioStatus.ACTIVE,
    units: [],
    layers: [],
    events: [],
    objectives: [
      'دفاع از ارتفاعات استراتژیک',
      'ممانعت از پیشروی دشمن',
      'حفظ خطوط تدارکاتی'
    ],
    metadata: {
      author: 'فرماندهی عملیات منطقه',
      classification: 'محرمانه',
      version: '1.2'
    },
    phases: [
      {
        id: 'phase-1',
        name: 'استقرار نیروها',
        description: 'استقرار اولیه نیروها در مواضع دفاعی',
        startTime: '2023-10-15T08:00:00Z',
        endTime: '2023-10-15T14:00:00Z',
        objectives: ['استقرار کامل در مواضع دفاعی', 'آماده‌سازی موانع'],
        tasks: [],
        status: 'completed' as PhaseStatus,
        order: 1
      },
      {
        id: 'phase-2',
        name: 'دفاع اصلی',
        description: 'دفاع اصلی در برابر حملات دشمن',
        startTime: '2023-10-15T14:00:00Z',
        endTime: '2023-10-17T20:00:00Z',
        objectives: ['دفع حملات دشمن', 'حفظ مواضع کلیدی'],
        tasks: [],
        status: 'in_progress' as PhaseStatus,
        order: 2
      },
      {
        id: 'phase-3',
        name: 'ضد حمله',
        description: 'ضد حمله به نیروهای دشمن',
        startTime: '2023-10-17T20:00:00Z',
        endTime: '2023-10-18T16:00:00Z',
        objectives: ['بازپس‌گیری مناطق از دست رفته', 'تثبیت موقعیت'],
        tasks: [],
        status: 'planned' as PhaseStatus,
        order: 3
      }
    ],
    environmentalConditions: [
      {
        id: 'env-1',
        type: 'weather' as EnvironmentalFactorType,
        startTime: '2023-10-15T08:00:00Z',
        endTime: '2023-10-16T08:00:00Z',
        value: 1, // آفتابی
        description: 'آفتابی با دید عالی'
      },
      {
        id: 'env-2',
        type: 'weather' as EnvironmentalFactorType,
        startTime: '2023-10-16T08:00:00Z',
        endTime: '2023-10-17T08:00:00Z',
        value: 2, // نیمه ابری
        description: 'نیمه ابری با دید خوب'
      },
      {
        id: 'env-3',
        type: 'weather' as EnvironmentalFactorType,
        startTime: '2023-10-17T08:00:00Z',
        endTime: '2023-10-18T16:00:00Z',
        value: 4, // بارانی
        description: 'بارندگی متوسط با دید محدود'
      }
    ],
    createdAt: '2023-09-01T10:30:00Z',
    updatedAt: '2023-10-10T14:45:00Z',
    executionStatus: ExecutionStatus.NOT_STARTED
  },
  {
    id: 'scenario-2',
    name: 'عملیات آفندی مناطق شهری',
    description: 'سناریوی حمله به مواضع دشمن در مناطق شهری',
    startTime: '2023-11-05T06:00:00Z',
    endTime: '2023-11-07T18:00:00Z',
    status: ScenarioStatus.DRAFT,
    units: [],
    layers: [],
    events: [],
    objectives: [
      'پاکسازی منطقه شهری',
      'تأمین امنیت غیرنظامیان',
      'تصرف مراکز کلیدی'
    ],
    metadata: {
      author: 'فرماندهی عملیات ویژه',
      classification: 'سری',
      version: '0.9'
    },
    phases: [
      {
        id: 'phase-1',
        name: 'محاصره منطقه',
        description: 'محاصره کامل منطقه شهری هدف',
        startTime: '2023-11-05T06:00:00Z',
        endTime: '2023-11-05T12:00:00Z',
        objectives: ['استقرار در اطراف منطقه', 'قطع مسیرهای فرار دشمن'],
        tasks: [],
        status: 'planned' as PhaseStatus,
        order: 1
      },
      {
        id: 'phase-2',
        name: 'نفوذ اولیه',
        description: 'نفوذ نیروهای ویژه به مناطق کلیدی',
        startTime: '2023-11-05T12:00:00Z',
        endTime: '2023-11-06T00:00:00Z',
        objectives: ['تصرف نقاط حساس', 'شناسایی مواضع دشمن'],
        tasks: [],
        status: 'planned' as PhaseStatus,
        order: 2
      },
      {
        id: 'phase-3',
        name: 'پاکسازی اصلی',
        description: 'عملیات اصلی پاکسازی منطقه',
        startTime: '2023-11-06T00:00:00Z',
        endTime: '2023-11-07T12:00:00Z',
        objectives: ['پاکسازی ساختمان به ساختمان', 'تأمین امنیت غیرنظامیان'],
        tasks: [],
        status: 'planned' as PhaseStatus,
        order: 3
      },
      {
        id: 'phase-4',
        name: 'تثبیت',
        description: 'تثبیت موقعیت و تأمین امنیت منطقه',
        startTime: '2023-11-07T12:00:00Z',
        endTime: '2023-11-07T18:00:00Z',
        objectives: ['استقرار نیروهای امنیتی', 'ارائه کمک‌های اولیه به غیرنظامیان'],
        tasks: [],
        status: 'planned' as PhaseStatus,
        order: 4
      }
    ],
    environmentalConditions: [],
    createdAt: '2023-10-15T08:20:00Z',
    updatedAt: '2023-10-20T11:35:00Z',
    executionStatus: ExecutionStatus.NOT_STARTED
  },
  {
    id: 'scenario-3',
    name: 'رزمایش مشترک دریایی و هوایی',
    description: 'رزمایش مشترک نیروهای دریایی و هوایی در منطقه خلیج',
    startTime: '2023-12-01T07:30:00Z',
    endTime: '2023-12-05T16:00:00Z',
    status: ScenarioStatus.PAUSED,
    units: [],
    layers: [],
    events: [],
    objectives: [
      'تقویت هماهنگی بین نیروها',
      'آزمایش تاکتیک‌های جدید',
      'ارزیابی آمادگی رزمی'
    ],
    metadata: {},
    phases: [],
    environmentalConditions: [],
    createdAt: '2023-11-01T09:45:00Z',
    updatedAt: '2023-11-05T13:20:00Z',
    executionStatus: ExecutionStatus.NOT_STARTED
  }
];