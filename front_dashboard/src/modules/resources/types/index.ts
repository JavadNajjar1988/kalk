// Resource Types and Interfaces

export interface Resource {
  id: string;
  personalInfo: {
    fullName: string;
    fullNameEn?: string;
    nationality: 'ایرانی' | 'غیرایرانی' | 'تبعه مضاعف';
    birthDate: string;
    gender: 'مرد' | 'زن';
    birthPlace?: string;
  };
  legalInfo: {
    status: 'اشخاص کلیدی' | 'نظامی' | 'غیرنظامی';
    subStatus: 'زنده' | 'شهید' | 'آسیب دیده';
    details: KeyPersonnelInfo | MilitaryResourceInfo | CivilianResourceInfo;
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface KeyPersonnelInfo {
  position: string;
  authorityLevel: 'فرمانده کل' | 'فرمانده ارشد' | 'فرمانده میانی' | 'فرمانده پایین';
  unitUnderCommand?: string;
  // For martyrs and injured
  dateOfIncident?: string;
  locationOfIncident?: string;
  positionAtIncident?: string;
  severity?: 'خفیف' | 'متوسط' | 'شدید' | 'بحرانی';
}

export interface MilitaryResourceInfo {
  forceType: 'ارتش' | 'سپاه' | 'بسیج' | 'نیروی انتظامی';
  rank: string;
  position: string;
  // For martyrs and injured
  dateOfIncident?: string;
  locationOfIncident?: string;
  causeOfMartyrdom?: 'نبرد مستقیم' | 'انفجار' | 'حمله هوایی' | 'تک‌تیراندازی' | 'مایین';
  severity?: 'خفیف' | 'متوسط' | 'شدید' | 'بحرانی';
}

export interface CivilianResourceInfo {
  occupation: string;
  roleInOperations?: 'مشاور' | 'تحلیلگر' | 'مترجم' | 'پزشک' | 'راننده';
  // For martyrs and injured
  dateOfIncident?: string;
  locationOfIncident?: string;
  occupationAtIncident?: string;
}

export interface ResourceFilters {
  search?: string;
  status?: string;
  subStatus?: string;
  nationality?: string;
  gender?: string;
  isActive?: boolean;
}

export interface ResourceState {
  resources: Resource[];
  selectedResource: Resource | null;
  filters: ResourceFilters;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}