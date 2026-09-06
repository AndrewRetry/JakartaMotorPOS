import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, ClientOptions, create_client

load_dotenv()

@lru_cache(maxsize=None)
def get_client(schema: str = "public") -> Client:
    """Returns a cached Supabase client with the given schema
    
    Note: uses service-role key (SECRETS), should never be exposed to frontend
    """
    
    url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if url or not service_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.")
    return create_client(url, service_key, options=ClientOptions(schema=schema))