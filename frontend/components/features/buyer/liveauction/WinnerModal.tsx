"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WinnerModalProps {
  isOpen: boolean;
  winnerId: string | null;
  userId?: string | null;
  finalPrice: number;
  auctionName: string;
  onClose: () => void;
  onViewOrder?: () => void;
  onViewHistory?: () => void;
}

export function WinnerModal({
  isOpen,
  winnerId,
  userId,
  finalPrice,
  auctionName,
  onClose,
  onViewOrder,
  onViewHistory,
}: WinnerModalProps) {
  const isMyWin = winnerId !== null && winnerId === userId;
  const hasWinner = winnerId !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-1/2 flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {isMyWin && "Congratulations! You Won!"}
            {hasWinner && !isMyWin && "Auction Ended"}
            {!hasWinner && "Auction Ended"}
          </DialogTitle>
          <DialogDescription className="text-center space-y-4 flex-1">
            <div>
              <p className="text-sm text-muted-foreground">Auction</p>
              <p className="text-lg font-semibold text-foreground">{auctionName}</p>
            </div>

            {isMyWin && (
              <>
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-muted-foreground">Final Price</p>
                  <p className="text-3xl font-bold text-green-700">LKR {finalPrice}</p>
                </div>
              </>
            )}

            {hasWinner && !isMyWin && (
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-muted-foreground">Winner ID</p>
                <p className="text-sm font-mono text-amber-700 break-all">{winnerId}</p>
                <p className="mt-2 text-sm text-muted-foreground">Final Price: LKR {finalPrice}</p>
              </div>
            )}

            {!hasWinner && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-semibold text-gray-700">No winner - Reserve not met</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {hasWinner && "The grace period has ended and the winner has been confirmed."}
              {!hasWinner && "This auction will now appear in your auction history."}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="!absolute !bottom-0 !left-0 !right-0 !flex !justify-center !gap-2 !p-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {isMyWin && (
            <Button onClick={onViewOrder} className="bg-green-600 hover:bg-green-700 text-white">
              View Order
            </Button>
          )}
          {hasWinner && !isMyWin && onViewHistory && (
            <Button onClick={onViewHistory} className="bg-amber-600 hover:bg-amber-700 text-white">
              View History
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
