from typing import List
from src.domain.entities.user import User
from src.domain.repositories.user_repository import UserRepository

class GetAllUsersUseCase:
    def __init__(self, user_repository: UserRepository):
        self._user_repository = user_repository

    async def execute(self) -> List[User]:
        return await self._user_repository.get_all()