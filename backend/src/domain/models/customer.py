class Customer:

    def __init__(
        self,
        name: str,
        region: str
    ):

        if not name:
            raise ValueError("Customer name cannot be empty")

        if not region:
            raise ValueError("Region cannot be empty")

        self.id = None
        self.name = name
        self.region = region