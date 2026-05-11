-- One-time cleanup for legacy auction rows that were stored in hours.
-- The old application logic treated values <= 24 as hours and anything larger as minutes.
-- This update follows that same historical contract so existing rows become minute-based.

UPDATE auctions
SET duration = TRY_CAST(duration AS FLOAT) * 60.0
WHERE TRY_CAST(duration AS FLOAT) IS NOT NULL
  AND TRY_CAST(duration AS FLOAT) > 0
  AND TRY_CAST(duration AS FLOAT) <= 24;
