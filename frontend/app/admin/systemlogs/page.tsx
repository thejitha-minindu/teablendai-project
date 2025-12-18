import { UseractivityCard } from "@/components/admincomponents/systemactivity";

export default function TrackAuctionPage() {
    const activities = [
        {
            auctionName: "fx000001 User",
            activityType: "Login",
            timestamp: "2023-10-15 14:30:22"
        },
        {
            auctionName: "fx000002 Admin",
            activityType: "Document Upload",
            timestamp: "2023-10-15 15:45:10"
        },
        {
            auctionName: "fx000003 Bidder",
            activityType: "Bid Placed",
            timestamp: "2023-10-15 16:20:33"
        },
        {
            auctionName: "fx000004 Viewer",
            activityType: "Auction Viewed",
            timestamp: "2023-10-16 09:15:45"
        },
        {
            auctionName: "fx000005 Moderator",
            activityType: "User Verified",
            timestamp: "2023-10-16 11:30:18"
        },
        {
            auctionName: "fx000006 User",
            activityType: "Profile Updated",
            timestamp: "2023-10-17 13:45:29"
        },
        {
            auctionName: "fx000007 Administrator",
            activityType: "System Settings Changed",
            timestamp: "2023-10-17 15:10:55"
        },
        {
            auctionName: "fx000008 Bidder",
            activityType: "Payment Processed",
            timestamp: "2023-10-18 10:25:37"
        },
        {
            auctionName: "fx000009 Analyst",
            activityType: "Report Generated",
            timestamp: "2023-10-18 16:40:12"
        },
        {
            auctionName: "fx000010 Support",
            activityType: "Ticket Resolved",
            timestamp: "2023-10-19 12:05:48"
        }
    ];

    return (
        <div className="p-6">
            {activities.map((activity, index) => (
                <UseractivityCard 
                    key={index}
                    auctionName={activity.auctionName}
                    activityType={activity.activityType}
                    timestamp={activity.timestamp}
                />
            ))}
        </div>
    );
}