export * from './user.types';
export * from './auction.types';
export * from './bid.types';
export * from './chat.types';
export * from './buyer/auction.types';
export * from './buyer/bid.types'
export * from './buyer/LiveAuctionSocket.types';

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  Date?: string;
};