"use client";

type HistoryCardProps = {
    notifyId: string;
    date: string;
    time: string;
    title: string;
    type: string;
    revisers: string;
};

export function HistoryCard({
    notifyId,
    date,
    time,
    title,
    type,
    revisers,
}: HistoryCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-5  mb-5 w-full max-w-full min-w-0 block min-h-48">

            {/* TOP ROW */}
            <div className="flex gap-6 mb-4 font-medium text-sm">
                <p>Notify ID : {notifyId}</p>
                <p>Date : {date}</p>
                <p>Time : {time}</p>
            </div>

            {/* TITLE */}
            <h3 className="font-semibold mb-3">Notification info</h3>

            {/* INFO BOX */}
            <div className="bg-gray-200 p-4 rounded-lg space-y-2 text-sm">
                <p>
                    <span className="font-medium">Notification Title :</span> {title}
                </p>
                <p>
                    <span className="font-medium">Notification Type :</span> {type}
                </p>
                <p>
                    <span className="font-medium">Revisers :</span> {revisers}
                </p>
            </div>

        </div>
    );
}
