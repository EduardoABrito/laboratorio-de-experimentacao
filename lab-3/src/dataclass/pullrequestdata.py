from dataclasses import dataclass
from datetime import datetime

@dataclass
class PullRequestData:
    repository: str
    title: str
    created_at: datetime
    merged_at: datetime
    closed_at: datetime
    body_length: int
    changed_files: int
    additions: int
    deletions: int
    review_time: float
    participants: int
    comments: int
