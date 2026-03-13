import csv
import io
import math
from typing import Any

from sqlalchemy.orm import Query


def paginate(query: Query, skip: int = 0, limit: int = 50) -> list:
    """Apply offset/limit pagination to a SQLAlchemy query and return results."""
    return query.offset(skip).limit(limit).all()


def rows_to_csv(rows: list[dict[str, Any]]) -> str:
    """Convert a list of dicts to a CSV string."""
    if not rows:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return straight-line distance in metres between two GPS coordinates."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
