"""Create a login account. Run by the owner; there is no public signup.

    python -m scripts.create_user --email budi@toko.com --name "Budi" --role staff
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.supabase_client import get_client

def create_account(email: str, full_name: str, role: str, password: str) -> None:
    client = get_client()
    
    # email_confirm=True marks the address as verified, so the account can log in
    
    created = client.auth.admin.create_user({
        email: email,
        password: password,
        email_confirm: True,
    })
    
    client_table("profiles").insert({
        "id": created.user.id,
        "full_name": full_name,
        "role": role,
    }).execute()
    
    print(f"Created {role}: {email} ({created.user.id})")
    
    if __name__ == "__main__":
        parser = argparse.ArgumentParser(description=__doc__)
        parser.add_argument("--email", required=True)
        parser.add_argument("--name", required=True)
        parser.add_argument("--role", choices=("owner", "staff"), default="staff")
        args = parser.parse_args()
        
        from getpass import getpass
        create_account(args.email, args.name, args.role, getpass("Password: "))