export * from './user.types';
export * from './auction.types';
export * from './bid.types';
export * from './chat.types';
export * as buyerAuction from './buyer/auction.types';
export * as buyerBid from './buyer/bid.types';
export * as buyerLiveAuctionSocket from './buyer/LiveAuctionSocket.types';

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  Date?: string;
};