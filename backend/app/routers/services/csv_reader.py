import io
import pandas as pd
from fastapi import UploadFile


def read_csv_file(file: UploadFile) -> pd.DataFrame:
    """Read an uploaded CSV `file` (FastAPI `UploadFile`) into a pandas DataFrame.

    This function ensures the file pointer is reset, decodes bytes to text
    if necessary, and uses an in-memory text buffer for pandas.
    """
    # Ensure pointer at start
    try:
        file.file.seek(0)
    except Exception:
        pass

    content = file.file.read()

    # If bytes, decode to string (try UTF-8 then fall back)
    if isinstance(content, (bytes, bytearray)):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")
    else:
        text = content

    return pd.read_csv(io.StringIO(text))
