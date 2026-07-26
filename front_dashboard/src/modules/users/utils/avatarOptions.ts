import avatar1 from '@/assets/avatars/Avatar-1.png';
import avatar2 from '@/assets/avatars/Avatar-2.png';
import avatar3 from '@/assets/avatars/Avatar-3.png';
import avatar4 from '@/assets/avatars/Avatar-4.png';
import avatar5 from '@/assets/avatars/Avatar-5.png';
import avatar6 from '@/assets/avatars/Avatar-6.png';
import avatar7 from '@/assets/avatars/Avatar-7.png';
import avatar8 from '@/assets/avatars/Avatar-8.png';
import avatar9 from '@/assets/avatars/Avatar-9.png';
import avatar10 from '@/assets/avatars/Avatar-10.png';
import avatar11 from '@/assets/avatars/Avatar-11.png';
import avatar12 from '@/assets/avatars/Avatar-12.png';

export const AVATAR_OPTIONS = [
  { id: 'avatar-1', src: avatar1 },
  { id: 'avatar-2', src: avatar2 },
  { id: 'avatar-3', src: avatar3 },
  { id: 'avatar-4', src: avatar4 },
  { id: 'avatar-5', src: avatar5 },
  { id: 'avatar-6', src: avatar6 },
  { id: 'avatar-7', src: avatar7 },
  { id: 'avatar-8', src: avatar8 },
  { id: 'avatar-9', src: avatar9 },
  { id: 'avatar-10', src: avatar10 },
  { id: 'avatar-11', src: avatar11 },
  { id: 'avatar-12', src: avatar12 },
] as const;

export const resolveAvatarSrc = (avatar?: string | null): string | undefined =>
  AVATAR_OPTIONS.find((option) => option.id === avatar)?.src;
