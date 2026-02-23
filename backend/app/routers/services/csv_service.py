from models import TeaPurchase, TeaBlendSale, Customer, BlendComposition, BlendPurchaseMapping

def insert_row(table: str, data: dict, db):
    model_map = {
        "TeaPurchase": TeaPurchase,
        "TeaBlendSale": TeaBlendSale,
        "Customer": Customer,
        "BlendComposition": BlendComposition,
        "BlendPurchaseMapping": BlendPurchaseMapping,
    }

    model = model_map.get(table)

    if not model:
        raise Exception("Invalid table name")

    obj = model(**data)
    db.add(obj)