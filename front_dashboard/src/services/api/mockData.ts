import { EnhancedScenario, ScenarioStatus } from '@/types';

// Mock data storage in JSON format
export const mockScenariosData: EnhancedScenario[] = [
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
    objectives: ['دفع حملات دشمن', 'حفظ مواضع کلیدی'],
    metadata: {},
    phases: [],
    environmentalConditions: [],
    createdAt: '2023-09-01T10:30:00Z',
    updatedAt: '2023-10-10T14:45:00Z',
    executionStatus: 'not_started' as any,
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
    objectives: ['تصرف نقاط کلیدی شهری', 'پاکسازی مناطق'],
    metadata: {},
    phases: [],
    environmentalConditions: [],
    createdAt: '2023-10-15T08:20:00Z',
    updatedAt: '2023-10-20T11:35:00Z',
    executionStatus: 'not_started' as any,
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
    executionStatus: 'not_started' as any,
  },
  {
    id: 'narvik40',
    name: 'نبردهای نارویک ۱۹۴۰',
    description: 'مجموعه‌ای از درگیری‌های دریایی و زمینی بین نیروهای آلمان و متفقین از آوریل تا ژوئن ۱۹۴۰ در نروژ',
    startTime: '1940-04-09T06:00:00Z',
    endTime: '1940-06-08T18:00:00Z',
    status: ScenarioStatus.DRAFT,
    units: [],
    layers: [],
    events: [],
    objectives: [
      'کنترل بندر نارویک',
      'حفاظت از خطوط تدارکاتی',
      'مقاومت در برابر حمله آلمان'
    ],
    metadata: {
      historical: true,
      conflict: 'World War II',
      location: 'Narvik, Norway'
    },
    phases: [],
    environmentalConditions: [],
    createdAt: '2023-11-15T10:00:00Z',
    updatedAt: '2023-11-20T15:30:00Z',
    executionStatus: 'not_started' as any,
  },
  {
    id: 'falkland82',
    name: 'جنگ فالکلند ۱۹۸۲',
    description: 'جنگ فالکلند یک درگیری نظامی بود که در سال ۱۹۸۲ بین آرژانتین و بریتانیا رخ داد',
    startTime: '1982-04-02T00:00:00Z',
    endTime: '1982-06-14T23:59:59Z',
    status: ScenarioStatus.ACTIVE,
    units: [],
    layers: [],
    events: [],
    objectives: [
      'بازپس‌گیری جزایر فالکلند',
      'شکست نیروهای آرژانتینی',
      'احیای حاکمیت بریتانیا'
    ],
    metadata: {
      historical: true,
      conflict: 'Falklands War',
      location: 'Falkland Islands'
    },
    phases: [],
    environmentalConditions: [],
    createdAt: '2023-11-10T08:30:00Z',
    updatedAt: '2023-11-25T12:15:00Z',
    executionStatus: 'not_started' as any,
  }
];

// Demo scenarios that can be loaded
export const demoScenariosData = [
  {
    name: "جنگ فالکلند ۱۹۸۲",
    id: "falkland82",
    summary: "جنگ فالکلند یک درگیری نظامی بود که در سال ۱۹۸۲ بین آرژانتین و بریتانیا رخ داد.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8b/HMS_Broadsword_and_Hermes%2C_1982_%28IWM%29.jpg",
  },
  {
    name: "نبردهای نارویک ۱۹۴۰",
    id: "narvik40", 
    summary: "مجموعه‌ای از درگیری‌های دریایی و زمینی بین نیروهای آلمان و متفقین از آوریل تا ژوئن ۱۹۴۰.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Norwegian_Army_Colt_heavy_machine_gun_at_the_Narvik_front.jpg",
  },
];

// In-memory storage for mock API
class MockStorage {
  private scenarios: Map<string, EnhancedScenario> = new Map();
  private lastId = 5; // Updated to account for the 5 scenarios we now have

  constructor() {
    // Initialize with mock data
    mockScenariosData.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });
  }

  // Get all scenarios
  getAllScenarios(): EnhancedScenario[] {
    return Array.from(this.scenarios.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Get scenario by ID
  getScenarioById(id: string): EnhancedScenario | undefined {
    return this.scenarios.get(id);
  }

  // Create new scenario
  createScenario(scenarioData: Omit<EnhancedScenario, 'id' | 'createdAt' | 'updatedAt'>): EnhancedScenario {
    this.lastId++;
    const now = new Date().toISOString();
    const newScenario: EnhancedScenario = {
      ...scenarioData,
      id: `scenario-${this.lastId}`,
      createdAt: now,
      updatedAt: now,
    };
    
    this.scenarios.set(newScenario.id, newScenario);
    return newScenario;
  }

  // Update existing scenario
  updateScenario(id: string, updates: Partial<EnhancedScenario>): EnhancedScenario | null {
    const existingScenario = this.scenarios.get(id);
    if (!existingScenario) {
      return null;
    }

    const updatedScenario: EnhancedScenario = {
      ...existingScenario,
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: existingScenario.createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    };

    this.scenarios.set(id, updatedScenario);
    return updatedScenario;
  }

  // Delete scenario
  deleteScenario(id: string): boolean {
    return this.scenarios.delete(id);
  }

  // Search scenarios
  searchScenarios(query: string): EnhancedScenario[] {
    const searchTerm = query.toLowerCase();
    return this.getAllScenarios().filter(scenario =>
      scenario.name.toLowerCase().includes(searchTerm) ||
      scenario.description.toLowerCase().includes(searchTerm) ||
      scenario.objectives?.some(obj => obj.toLowerCase().includes(searchTerm))
    );
  }

  // Filter scenarios by status
  filterByStatus(status: ScenarioStatus[]): EnhancedScenario[] {
    return this.getAllScenarios().filter(scenario =>
      status.includes(scenario.status)
    );
  }
}

// Singleton instance
export const mockStorage = new MockStorage();

// Simulate API delay
export const simulateApiDelay = (min: number = 100, max: number = 300): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Error simulation for testing
export const shouldSimulateError = (errorRate: number = 0.00): boolean => {
  return Math.random() < errorRate;
};

export const simulatedErrors = [
  { message: 'Network connection failed', code: 'NETWORK_ERROR' },
  { message: 'Server temporarily unavailable', code: 'SERVER_ERROR' },
  { message: 'Invalid request format', code: 'VALIDATION_ERROR' },
];

export const getRandomError = () => {
  return simulatedErrors[Math.floor(Math.random() * simulatedErrors.length)];
};