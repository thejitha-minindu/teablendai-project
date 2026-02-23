TABLE_FIELDS = {
    "TeaPurchase": ["PurchaseID", "SourceType", "Standard", "PricePerKg", "QuantityKg", "PurchaseDate"],
    "TeaBlendSale": ["SaleID", "CustomerID", "BlendName", "PricePerKg", "QuantityKg", "SaleDate"],
    "BlendComposition": ["BlendID", "Standard", "Ratio"],
    "Customer": ["CustomerID", "Name", "Region"],
    "BlendPurchaseMapping": ["MappingID", "SaleID", "PurchaseID", "Standard", "QuantityUsedKg"]
}
