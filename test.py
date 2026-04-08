
import requests
from datetime import datetime
import logging
import time

# --- Configuration ---
API_KEY = '4KhEPzhCIsWZkFGJRUzECgdCw7UZOwQ8fNUrHf1430S2AiM2A8yAHyIS'
ENDPOINT = "https://api.pexels.com/v1/curated?per_page=1"

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(message)s',
    handlers=[
        logging.FileHandler("api_usage.log"),
        logging.StreamHandler()
    ]
)

def check_usage():
    headers = {"Authorization": API_KEY}
    
    try:
        response = requests.get(ENDPOINT, headers=headers)
        
        # Extract the specific Pexels Rate Limit Headers
        limit = response.headers.get("X-Ratelimit-Limit")
        remaining = response.headers.get("X-Ratelimit-Remaining")
        reset_time = response.headers.get("X-Ratelimit-Reset")

        if response.status_code == 200:
            # Convert Unix timestamp to readable time
            readable_reset = datetime.fromtimestamp(int(reset_time)).strftime('%Y-%m-%d %H:%M:%S')
            
            log_msg = (
                f"SUCCESS | Limit: {limit} | "
                f"Remaining: {remaining} | "
                f"Reset At: {readable_reset}"
            )
            logging.info(log_msg)
        else:
            logging.error(f"FAILED | Status: {response.status_code} | Msg: {response.text}")

    except Exception as e:
        logging.error(f"CRITICAL ERROR | {str(e)}")

if __name__ == "__main__":
    check_usage()