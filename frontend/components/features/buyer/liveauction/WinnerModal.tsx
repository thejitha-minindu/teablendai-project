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
  winnerName?: string;
  finalPrice: number;
  auctionName: string;
  onClose: () => void;
  onViewOrder?: () => void;
}

export function WinnerModal({
  isOpen,
  winnerId,
  winnerName,
  finalPrice,
  auctionName,
  onClose,
  onViewOrder,
}: WinnerModalProps) {
  const isMyWin = winnerId !== null; // You can compare with current user ID if needed

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4">
              <span className="text-4xl">🏆</span>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {isMyWin ? "Congratulations! You Won!" : "Auction has ended"}
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
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

                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-muted-foreground">Winner ID</p>
                  <p className="text-sm font-mono text-blue-700 break-all">{winnerId}</p>
                </div>
              </>
            )}

            {!isMyWin && winnerId && (
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-muted-foreground">Winner ID</p>
                <p className="text-sm font-mono text-amber-700 break-all">{winnerId}</p>
                <p className="mt-2 text-sm text-muted-foreground">Final Price: LKR {finalPrice}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              The grace period has ended and the winner has been confirmed.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {isMyWin && (
            <Button onClick={onViewOrder} className="bg-green-600 hover:bg-green-700 text-white">
              View Order
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
