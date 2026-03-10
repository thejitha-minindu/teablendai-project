from src.application.use_cases.admin.admin_csv_upload_service import AdminCSVUploadService

class CSVUploadUseCase:
    def __init__(self, db):
        self.service = AdminCSVUploadService(db)

    def process_csv(self, file, table, mapping):
        return self.service.process_csv(file, table, mapping)