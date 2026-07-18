import time

# Ultra-lightweight lookups for global table syncs
MUTATION_STATES = {
    "barang": time.time(),
    # add more
}

def update_mutation_time(entity_name: str):
    """Call whenever a CSV file is successfully written to."""
    MUTATION_STATES[entity_name] = time.time()

def get_mutation_time(entity_name: str) -> float:
    """Retrieve the last structural change timestamp for an entity."""
    return MUTATION_STATES.get(entity_name, 0.0)