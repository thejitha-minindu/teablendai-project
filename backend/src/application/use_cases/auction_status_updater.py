from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.domain.models.auction import Auction as AuctionModel
from src.domain.models.bid import Bid as BidModel
from src.domain.models.auction_status import AuctionStatus


SCHEDULE_STATUS_VALUES = {AuctionStatus.SCHEDULE.value, "Scheduled"}


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


def sync_auction_statuses(db: Session) -> dict:
    """Sync all auction statuses and return LIVE→HISTORY transitions for broadcasting"""
    now_utc = datetime.now(timezone.utc)
    changed = False
    history_transitions = []

    # SCHEDULE → LIVE
    scheduled = db.query(AuctionModel).filter(
        AuctionModel.status.in_(SCHEDULE_STATUS_VALUES)
    ).all()
    
    for auction in scheduled:
        start_time = auction.start_time
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)
        if start_time <= now_utc:
            auction.status = AuctionStatus.LIVE.value
            db.add(auction)
            changed = True

    if changed:
        db.flush()

    # LIVE → HISTORY (with buyer resolution)
    live_auctions = db.query(AuctionModel).filter(
        AuctionModel.status == AuctionStatus.LIVE.value
    ).all()
    
    for auction in live_auctions:
        start_time = auction.start_time
        duration_minutes = _duration_to_minutes(auction.duration)
        end_time = start_time + timedelta(minutes=duration_minutes)

        if now_utc >= end_time:
            auction.status = AuctionStatus.HISTORY.value
            
            highest_bid = db.query(BidModel).filter(
                BidModel.auction_id == auction.auction_id
            ).order_by(desc(BidModel.bid_amount)).first()
            
            if highest_bid:
                auction.buyer = highest_bid.buyer_id
                auction.sold_price = highest_bid.bid_amount
            else:
                auction.sold_price = 0
            
            db.add(auction)
            changed = True
            
            history_transitions.append({
                'auction_id': str(auction.auction_id),
                'buyer': str(auction.buyer) if auction.buyer else None,
                'sold_price': auction.sold_price
            })

    if changed:
        db.commit()
    
    return {'history_transitions': history_transitions}
