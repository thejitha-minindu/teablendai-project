import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function LiveAuctionPageCard() {
return (
    <Card className="w-full mx-auto">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-start gap-4">
        <div className="flex flex-col">
          <CardTitle style={{ color: "var(--color4)", fontWeight: "bold" }}>
            Auction Title
          </CardTitle>
          <CardDescription style={{ color: "var(--color3)" }}>
            Company Name
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row items-start sm:items-end text-sm text-muted-foreground">
          <div className="flex flex-col items-start">
            <p className="mb-1 text-md">
                <span className="font-medium">Quantity:</span> 120 Kg
            </p>
            <p className="mb-1 text-md">
                <span className="font-medium">Grade: </span> A
            </p>
            <p className="mb-1 text-md">
                <span className="font-medium">Base price: </span> 120 Kg
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
          <div className="flex flex-col justify-between flex-1 w-full md:w-auto gap-5">
            <Button variant="outline">More Details</Button>
          </div>
      </CardFooter>
    </Card>
  );
}