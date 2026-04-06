import time
import requests
from typing import Optional, Tuple

class Geocoder:
    def __init__(self, user_agent: str = "NearbyNeedBot/1.0"):
        self.user_agent = user_agent
        self.base_url = "https://nominatim.openstreetmap.org/search"

    def get_coords(self, address: str, city: str = "San Francisco", state: str = "CA") -> Tuple[Optional[float], Optional[float]]:
        """
        Geocodes an address using the free Nominatim (OpenStreetMap) API.
        Respects the Nominatim usage policy (1 request per second).
        """
        full_address = f"{address}, {city}, {state}"
        params = {
            "q": full_address,
            "format": "json",
            "limit": 1
        }
        headers = {
            "User-Agent": self.user_agent
        }

        try:
            # Respect rate limits
            time.sleep(1.1)
            response = requests.get(self.base_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
            
        except Exception as e:
            print(f"⚠️ Geocoding error for {full_address}: {str(e)}")
        
        return None, None
