# backend/Dockerfile

FROM python:3.12-slim

# Install system dependencies and Microsoft ODBC Driver 18 for Azure SQL
RUN apt-get update && apt-get install -y curl apt-transport-https gnupg2 unixodbc-dev g++ \
    && curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql18

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# EXPOSE 8000
# CMD ["uvicorn", "src.application.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Command to run the application
CMD ["sh", "-c", "uvicorn src.application.main:app --host 0.0.0.0 --port ${PORT:-8000}"]