import re

def parse_hours(hours_str: str):
    """
    Simpler heuristic to map SFHSA hours to the NearbyNeed schema.
    Example: 'Monday–Friday: | 11:30 am–12:30 pm'
    """
    schedule = {
        "days": [],
        "start_time": "09:00",
        "end_time": "17:00",
        "type": "fixed"
    }
    
    if "Monday–Friday" in hours_str:
        schedule["days"] = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    elif "Monday–Saturday" in hours_str:
        schedule["days"] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    else:
        schedule["days"] = ["Mon", "Tue", "Wed", "Thu", "Fri"] # Fallback
        
    # Extract times
    # Normalizing en-dash to hyphen for easier regex
    normalized = hours_str.replace("–", "-")
    times = re.findall(r'(\d+:\d+\s+[ap]m)', normalized.lower())
    
    if len(times) >= 2:
        # Convert to HH:MM 24h
        def to_24(t):
            t = t.strip()
            is_pm = "pm" in t
            parts = t.replace("am", "").replace("pm", "").strip().split(":")
            h = int(parts[0])
            m = parts[1]
            if is_pm and h < 12: h += 12
            if not is_pm and h == 12: h = 0
            return f"{h:02d}:{m}"
            
        schedule["start_time"] = to_24(times[0])
        schedule["end_time"] = to_24(times[1])
        
    return schedule
