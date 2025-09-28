import type { User, Role, AccessLevel } from '../types';

interface UsersData {
  users: User[];
  roles: Role[];
  accessLevels: AccessLevel[];
}

let cachedData: UsersData | null = null;

export const loadUsersData = async (): Promise<UsersData> => {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await import('../data/users.json');
    const rawData = response.default as any;
    
    // Type assertion to ensure compatibility
    cachedData = {
      users: rawData.users as User[],
      roles: rawData.roles as Role[],
      accessLevels: rawData.accessLevels as AccessLevel[]
    };
    
    return cachedData;
  } catch (error) {
    console.error('Error loading users data:', error);
    return {
      users: [],
      roles: [],
      accessLevels: []
    };
  }
};

export const invalidateUsersCache = () => {
  cachedData = null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const data = await loadUsersData();
  return data.users.find(user => user.id === id) || null;
};

export const getUserByCode = async (userCode: string): Promise<User | null> => {
  const data = await loadUsersData();
  return data.users.find(user => user.userCode === userCode) || null;
};

export const getRoleById = async (id: string): Promise<Role | null> => {
  const data = await loadUsersData();
  return data.roles.find(role => role.id === id) || null;
};

export const getAccessLevelById = async (id: string): Promise<AccessLevel | null> => {
  const data = await loadUsersData();
  return data.accessLevels.find(level => level.id === id) || null;
};