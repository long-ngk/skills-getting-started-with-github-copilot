import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from app import activities, app


def test_delete_participant_removes_email():
    client = TestClient(app)
    activity_name = "Chess Club"
    activities[activity_name]["participants"] = ["michael@mergington.edu", "daniel@mergington.edu"]

    response = client.delete(f"/activities/{activity_name}/participants/michael@mergington.edu")

    assert response.status_code == 200
    assert "michael@mergington.edu" not in activities[activity_name]["participants"]
    assert "daniel@mergington.edu" in activities[activity_name]["participants"]
