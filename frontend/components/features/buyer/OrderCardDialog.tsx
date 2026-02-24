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
import { Input } from "@/components/ui/input";

const auctionOrderDetails = {
  auctionName: "Spring Harvest Auction",
  company: "ABC Tea Company",
  date: "2025-10-12",
  estateName: "Darjeeling Estate",
  quantity: "50 kg",
  grade: "BOP",
  basePrice: "$250",
  soldPrice: "$250",
  orderId: "ORD123456",
};

export function OrderCardDialog() {
  return (
    <Dialog>
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
        <DialogHeader className="pb-4 lg:mb-5">
          <DialogTitle
            style={{ color: "var(--color4)", fontWeight: "bold" }}
            className="text-2xl"
          >
            {auctionOrderDetails.auctionName}
          </DialogTitle>
          <DialogDescription style={{ color: "var(--color3)" }}>
            Detailed information about your auction history.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-10 h-full">
          <div className="flex flex-col md:flex-row gap-6 sm:items-center lg:items-start h-full">
            <div className="flex flex-row flex-1 w-full md:w-auto justify-center sm:justify-start">
              <div className="flex flex-col gap-3">
                <h2 className="text-m font-semibold mb-2">
                  {auctionOrderDetails.estateName}
                </h2>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Grade:</span>{" "}
                  {auctionOrderDetails.grade}
                </p>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Base Price:</span>{" "}
                  {auctionOrderDetails.soldPrice}
                </p>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Sold Price:</span>{" "}
                  {auctionOrderDetails.soldPrice}
                </p>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Order ID:</span>{" "}
                  {auctionOrderDetails.orderId}
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
      </DialogContent>
    </Dialog>
  );
}
