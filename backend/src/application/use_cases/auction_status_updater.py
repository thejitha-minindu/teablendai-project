from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from src.domain.models.auction import Auction as AuctionModel
from src.domain.models.auction_status import AuctionStatus


SCHEDULE_STATUS_VALUES = {AuctionStatus.SCHEDULE.value, "Scheduled"}


def _normalize_datetime_for_compare(dt_value: datetime) -> datetime:
    if dt_value.tzinfo is not None:
        return dt_value.astimezone().replace(tzinfo=None)
    return dt_value


def _duration_to_minutes(duration_value: float) -> int:
    try:
        duration = float(duration_value)
    except (TypeError, ValueError):
        return 0

    if duration <= 0:
        return 0

    if duration <= 24:
        return int(round(duration * 60))

    return int(round(duration))


def sync_auction_statuses(db: Session) -> None:
    now_local = datetime.now()
    changed = False

    scheduled = (
        db.query(AuctionModel)
        .filter(AuctionModel.status.in_(SCHEDULE_STATUS_VALUES))
        .all()
    )
    for auction in scheduled:
        start_time = _normalize_datetime_for_compare(auction.start_time)
        if start_time <= now_local:
            auction.status = AuctionStatus.LIVE.value
            db.add(auction)
            changed = True

    # Flush Scheduled→Live changes so the next query sees them even with autoflush=False.
    # This ensures fully-expired auctions (past start_time + duration) transition directly
    # to "History" in a single sync call instead of getting stuck at "Live" for one cycle.
    if changed:
        db.flush()

    live_auctions = db.query(AuctionModel).filter(AuctionModel.status == AuctionStatus.LIVE.value).all()
    for auction in live_auctions:
        start_time = _normalize_datetime_for_compare(auction.start_time)
        duration_minutes = _duration_to_minutes(auction.duration)
        end_time = start_time + timedelta(minutes=duration_minutes)

        if now_local >= end_time:
            auction.status = AuctionStatus.HISTORY.value
            if not auction.buyer:
                auction.sold_price = 0
            db.add(auction)
            changed = True

    if changed:
        db.commit()
