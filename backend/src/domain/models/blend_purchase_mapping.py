class BlendPurchaseMapping:

    def __init__(
        self,
        sale_id: int,
        purchase_id: int,
        standard: str,
        quantity_used_kg: float
    ):

        if sale_id <= 0:
            raise ValueError("Sale ID must be valid")

        if purchase_id <= 0:
            raise ValueError("Purchase ID must be valid")

        if not standard:
            raise ValueError("Standard cannot be empty")

        if quantity_used_kg <= 0:
            raise ValueError("Quantity used must be greater than 0")

        self.id = None
        self.sale_id = sale_id
        self.purchase_id = purchase_id
        self.standard = standard
        self.quantity_used_kg = quantity_used_kg