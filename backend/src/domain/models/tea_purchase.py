from datetime import date


class TeaPurchase:

    def __init__(
        self,
        source_type: str,
        standard: str,
        price_per_kg: float,
        quantity_kg: float,
        purchase_date: date
    ):

        if price_per_kg <= 0:
            raise ValueError("Price must be greater than 0")

        if quantity_kg <= 0:
            raise ValueError("Quantity must be greater than 0")

        self.id = None
        self.source_type = source_type
        self.standard = standard
        self.price_per_kg = price_per_kg
        self.quantity_kg = quantity_kg
        self.purchase_date = purchase_date