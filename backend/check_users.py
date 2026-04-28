#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.config import get_settings
from src.infrastructure.database.connection import get_db_session
from src.domain.models.user import User

def main():
    settings = get_settings()
    print('Database server:', getattr(settings, 'MSSQL_SERVER', 'Not set'))
    print('Database name:', getattr(settings, 'MSSQL_DATABASE', 'Not set'))

    session = get_db_session()
    try:
        users = session.query(User).all()
        print(f'\nFound {len(users)} users in database:')
        for i, user in enumerate(users[:20]):  # Show first 20 users
            print(f'{i+1:2d}. ID: {user.user_id}, Email: {user.email}, Name: {user.first_name} {user.last_name}')
        if len(users) > 20:
            print(f'... and {len(users) - 20} more users')
    except Exception as e:
        print(f'Error querying database: {e}')
    finally:
        session.close()

if __name__ == '__main__':
    main()