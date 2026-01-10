export * from './user.types';
export * from './chat.types';
export * from './buyer/auction.types';
export * from './buyer/bid.types'

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  Date?: string;
};