from enum import Enum

class AuctionStatus(str, Enum):

    SCHEDULE = "Scheduled"
    LIVE = "Live"
    HISTORY = "History"

STATUS_VALUES = {
    AuctionStatus.SCHEDULE.value,
    AuctionStatus.LIVE.value,
    AuctionStatus.HISTORY.value,
}
