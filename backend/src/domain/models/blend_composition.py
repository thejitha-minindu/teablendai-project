class BlendComposition:

    def __init__(
        self,
        blend_id: int,
        standard: str,
        ratio: float
    ):

        if blend_id <= 0:
            raise ValueError("Blend ID must be valid")

        if not standard:
            raise ValueError("Standard cannot be empty")

        if ratio <= 0 or ratio > 100:
            raise ValueError("Ratio must be between 0 and 100")

        self.id = None
        self.blend_id = blend_id
        self.standard = standard
        self.ratio = ratio