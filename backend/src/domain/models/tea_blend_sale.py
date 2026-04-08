from datetime import date


class TeaBlendSale:

    def __init__(
        self,
        customer_id: int,
        blend_name: str,
        price_per_kg: float,
        quantity_kg: float,
        sale_date: date
    ):

        if customer_id <= 0:
            raise ValueError("Customer ID must be valid")

        if price_per_kg <= 0:
            raise ValueError("Price per kg must be greater than 0")

        if quantity_kg <= 0:
            raise ValueError("Quantity must be greater than 0")

        if not blend_name:
            raise ValueError("Blend name cannot be empty")

        self.id = None
        self.customer_id = customer_id
        self.blend_name = blend_name
        self.price_per_kg = price_per_kg
        self.quantity_kg = quantity_kg
        self.sale_date = sale_date