// User Types and Interfaces

export interface User {
  id: string;
  userCode: string; // کد کاربری
  personalInfo: {
    fullName: string;
    fullNameEn?: string;
    fatherName: string;
    nationalId: string;
    nationality: 'ایرانی' | 'غیرایرانی' | 'تبعه مضاعف';
    birthDate: string;
    gender: 'مرد' | 'زن';
    birthPlace?: string;
    maritalStatus?: 'مجرد' | 'متاهل' | 'مطلقه' | 'بیوه';
  };
  contactInfo: {
    landline?: string;
    mobile: string[];
    addresses?: string;
    email?: string;
    postalCode?: string;
    socialNetworks?: { platform: string; username: string }[];
  };
  professionalInfo: {
    status: 'آزاد' | 'نظامی' | 'غیرنظامی';
    details: FreelanceInfo | MilitaryInfo | CivilianInfo;
  };
  systemInfo: {
    role: string;
    accessLevel: string;
    permissions: string[];
    lastLogin?: string;
    loginCount: number;
    password: string;
    passwordLastChanged: string;
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface FreelanceInfo {
  businessType: string;
  expertise?: string;
  licenseNumber?: string;
}

export interface MilitaryInfo {
  forceType: 'ارتش' | 'سپاه' | 'بسیج' | 'نیروی انتظامی';
  rank: string;
  position: string;
  serviceNumber?: string;
  unit?: string;
}

export interface CivilianInfo {
  occupation: string;
  employer?: string;
  department?: string;
}

// Role and Access Level interfaces
export interface Role {
  id: string;
  name: string;
  englishName: string;
  description: string;
  accessLevel: string;
  permissions: string[];
}

export interface AccessLevel {
  id: string;
  name: string;
  englishName: string;
  description: string;
  color: string;
  priority: number;
}

// Quick Actions interfaces
export interface QuickActionPayload {
  userId: string;
  action: 'toggleActive' | 'changePassword' | 'updateAccessLevel';
  data?: any;
}

export interface PasswordChangeData {
  newPassword: string;
  confirmPassword: string;
}

export interface AccessLevelChangeData {
  newAccessLevel: string;
  newRole: string;
  newPermissions: string[];
}

// View and Filter interfaces
export interface UserFilters {
  search?: string;
  role?: string;
  accessLevel?: string;
  nationality?: string;
  gender?: string;
  status?: string; // professional status
  isActive?: boolean;
}

export interface ViewMode {
  type: 'table' | 'card';
}

export interface UserState {
  users: User[];
  roles: Role[];
  accessLevels: AccessLevel[];
  selectedUser: User | null;
  filters: UserFilters;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}