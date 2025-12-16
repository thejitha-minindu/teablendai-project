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
  time: "10:00 AM",
  estateName: "Darjeeling Estate",
  grade: "FTGFOP1",
  soldPrice: "$500",
};

export function OrderCardDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">More</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col lg:p-15 md:p-10 p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>{auctionOrderDetails.auctionName}</DialogTitle>
          <DialogDescription>
            Detailed information about your auction history.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-10 h-full">
          <div className="flex flex-col md:flex-row gap-6 sm:items-center lg:items-start h-full">
            <div className="flex flex-row flex-1 w-full md:w-auto justify-center sm:justify-start">
              <div>
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
              </div>
            </div>

            <div className="flex flex-col h-full items-center sm:items-start text-xs lg:mr-5 mt-0 mb-4 md:mb-0"></div>
          </div>

          <DialogFooter className="flex flex-col md:flex-row md:justify-center md:items-center gap-2 lg:mt-10">
            <Button variant="outline">Go to Payment</Button>
            <Button variant="outline">Download Invoice</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
