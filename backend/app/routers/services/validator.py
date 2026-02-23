def validate_data(df, required_fields):
    valid_rows = []
    invalid_rows = []
    warnings = []

    for index, row in df.iterrows():
        row_dict = row.to_dict()
        missing_fields = []

        for field in required_fields:
            if field not in row_dict or pd.isna(row_dict[field]):
                missing_fields.append(field)

        if missing_fields:
            row_dict["errors"] = f"Missing: {', '.join(missing_fields)}"
            invalid_rows.append(row_dict)
        else:
            valid_rows.append(row_dict)

        # Example warning: Quantity less than zero
        if "QuantityKg" in row_dict and row_dict.get("QuantityKg", 0) < 0:
            warnings.append(f"Row {index}: Negative quantity")

    return valid_rows, invalid_rows, warnings
