import sys
import os

# Add backend directory to python search path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from app.main import app
from mangum import Mangum

def rewrite_event_path(event):
    # Retrieve request path from Lambda event fields
    path = None
    if "rawPath" in event:
        path = event["rawPath"]
    elif "path" in event:
        path = event["path"]
    
    if not path and "requestContext" in event:
        if "http" in event["requestContext"] and "path" in event["requestContext"]["http"]:
            path = event["requestContext"]["http"]["path"]
        elif "path" in event["requestContext"]:
            path = event["requestContext"]["path"]
            
    if not path:
        return event

    # Remove Netlify's execution prefix: /.netlify/functions/api
    prefix = "/.netlify/functions/api"
    if path.startswith(prefix):
        subpath = path[len(prefix):].lstrip("/")
    else:
        subpath = path.lstrip("/")

    # Map the subpath to the correct FastAPI endpoint pattern
    api_prefixed = ("courses", "reminders", "notifications", "dashboard")
    if any(subpath.startswith(p) for p in api_prefixed):
        new_path = "/api/" + subpath
    else:
        new_path = "/" + subpath

    # Override the event paths
    if "rawPath" in event:
        event["rawPath"] = new_path
    if "path" in event:
        event["path"] = new_path
    if "requestContext" in event:
        if "http" in event["requestContext"] and "path" in event["requestContext"]["http"]:
            event["requestContext"]["http"]["path"] = new_path
        elif "path" in event["requestContext"]:
            event["requestContext"]["path"] = new_path

    return event

class NetlifyMangum(Mangum):
    def __call__(self, event, context):
        event = rewrite_event_path(event)
        return super().__call__(event, context)

# Single entrypoint handler for AWS Lambda / Netlify Serverless
handler = NetlifyMangum(app)
