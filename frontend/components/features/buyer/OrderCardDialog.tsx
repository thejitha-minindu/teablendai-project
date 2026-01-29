import * as React from "react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAuctionOrderDialog } from "@/services/buyer/auctionService";
import { AuctionOrderDialog } from "@/types/auction.types";

interface OrderCardDialogProps {
  auctionId: string;
}

export function OrderCardDialog({ auctionId }: OrderCardDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<AuctionOrderDialog | null>(null);

  useEffect(() => {
    if (isOpen && auctionId) {
      setLoading(true);
      setError(null);
      getAuctionOrderDialog(auctionId)
        .then((data) => {
          setDialogData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load order details");
          setLoading(false);
        });
    }
  }, [isOpen, auctionId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          style={{ transition: "background 0.2s" }}
          className="hover:text-white hover:cursor-pointer"
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color3)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
        >
          More
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col lg:p-15 md:p-10 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-10 text-red-500">
            <p>{error}</p>
          </div>
        ) : dialogData ? (
          <>
            <DialogHeader className="pb-4 lg:mb-5">
              <DialogTitle
                style={{ color: "var(--color4)", fontWeight: "bold" }}
                className="text-2xl"
              >
                {dialogData.auction_name}
              </DialogTitle>
              <DialogDescription style={{ color: "var(--color3)" }}>
                Detailed information about your order.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-10 h-full">
              <div className="flex flex-col md:flex-row gap-6 sm:items-center lg:items-start h-full">
                <div className="flex flex-row flex-1 w-full md:w-auto justify-center sm:justify-start">
                  <div className="flex flex-col gap-3">
                    <h2 className="text-m font-semibold mb-2">
                      {dialogData.estate_name}
                    </h2>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Grade:</span>{" "}
                      {dialogData.grade}
                    </p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Quantity:</span>{" "}
                      {dialogData.quantity} kg
                    </p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Base Price:</span>{" "}
                      {dialogData.base_price} LKR
                    </p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Sold Price:</span>{" "}
                      {dialogData.sold_price ? `${dialogData.sold_price} LKR` : "-"}
                    </p>
                    <p className="mb-1 text-sm">
                      <span className="font-medium">Order ID:</span>{" "}
                      {dialogData.order_id || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col h-full items-center sm:items-start text-xs lg:mr-5 mt-0 mb-4 md:mb-0"></div>
              </div>

              <DialogFooter className="flex flex-col md:flex-row md:justify-center md:items-center gap-2 lg:mt-10">
                <Button
                  variant="outline"
                  className="hover:text-white hover:cursor-pointer"
                  style={{ transition: "background 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--color3)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                >
                  Go to Payment
                </Button>
                <Button
                  variant="outline"
                  className="hover:text-white hover:cursor-pointer"
                  style={{ transition: "background 0.2s" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--color3)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                >
                  Download Invoice
                </Button>
              </DialogFooter>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
