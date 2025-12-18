import { HistoryCard } from "@/components/admincomponents/HistoryCard";

export default function TrackAuctionPage() {
    const notifications = [
        {
            notifyId: "NOT001NF",
            date: "2023-10-15",
            time: "14:30",
            title: "Auction Registration Reminder",
            type: "Reminder",
            revisers: "All Users"
        },
        {
            notifyId: "NOT002NF",
            date: "2023-10-16",
            time: "09:15",
            title: "Bid Submission Deadline",
            type: "Alert",
            revisers: "Registered Bidders"
        },
        {
            notifyId: "NOT003NF",
            date: "2023-10-17",
            time: "16:45",
            title: "Auction Results Announcement",
            type: "Announcement",
            revisers: "All Participants"
        },
        {
            notifyId: "NOT004NF",
            date: "2023-10-18",
            time: "11:20",
            title: "Payment Due Reminder",
            type: "Reminder",
            revisers: "Winning Bidders"
        },
        {
            notifyId: "NOT005NF",
            date: "2023-10-19",
            time: "13:00",
            title: "System Maintenance Notification",
            type: "Maintenance",
            revisers: "All Users"
        },
        {
            notifyId: "NOT006NF",
            date: "2023-10-20",
            time: "15:30",
            title: "New Auction Listing",
            type: "Update",
            revisers: "Subscribed Users"
        },
        {
            notifyId: "NOT007NF",
            date: "2023-10-21",
            time: "10:00",
            title: "Document Verification Required",
            type: "Action Required",
            revisers: "Pending Verification"
        },
        {
            notifyId: "NOT008NF",
            date: "2023-10-22",
            time: "17:45",
            title: "Auction Extended Notice",
            type: "Update",
            revisers: "Active Bidders"
        },
        {
            notifyId: "NOT009NF",
            date: "2023-10-23",
            time: "12:10",
            title: "Terms & Conditions Update",
            type: "Policy Change",
            revisers: "All Users"
        },
        {
            notifyId: "NOT010NF",
            date: "2023-10-24",
            time: "08:30",
            title: "Weekly Auction Summary",
            type: "Report",
            revisers: "Administrators"
        }
    ];

    return (
        <div className="p-6">
            {notifications.map((notification, index) => (
                <HistoryCard
                    key={index}
                    notifyId={notification.notifyId}
                    date={notification.date}
                    time={notification.time}
                    title={notification.title}
                    type={notification.type}
                    revisers={notification.revisers}
                />
            ))}
        </div>
    );
}