# backend/Dockerfile

FROM python:3.12-slim-bookworm

# 2. Install system dependencies
RUN apt-get update && apt-get install -y curl apt-transport-https gnupg2 unixodbc-dev g++ \
    # 3. Use the modern GPG method to add Microsoft's security key (replaces apt-key)
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    # 4. Add the Microsoft Debian 12 repository
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    # 5. Update and install the ODBC Driver 18
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