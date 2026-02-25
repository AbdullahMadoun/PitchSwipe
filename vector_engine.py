"""
Demo vector engine implementing the PitchSwipe spec (Section II).
This is a standalone helper for the prototype; in production wire into FastAPI.
"""

import math
from typing import List, Dict, Tuple

Vector = List[float]


def normalize(v: Vector) -> Vector:
    norm = math.sqrt(sum(x * x for x in v))
    if norm < 1e-9:
        return v
    return [x / norm for x in v]


def clamp_ratio(watch_time: float, video_length: float) -> float:
    denom = max(video_length, 1e-6)
    r = watch_time / denom
    return max(0.0, min(1.0, r))


def swipe_weight(direction: str, r: float) -> float:
    if direction == "right":
        return 0.5 + 0.5 * r
    if direction == "left":
        return -(0.5 + 0.5 * (1 - r))
    if direction == "down":
        return -0.3 * (1 - r)
    return 0.0


def cosine(a: Vector, b: Vector) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    num = sum(x * y for x, y in zip(a, b))
    denom = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return num / denom if denom else 0.0


def update_user_state(
    u0_raw: Vector,
    interactions: List[Tuple[Vector, str, float, float]],
    alpha: float = 0.5,
    beta: float = 1.0,
) -> Vector:
    """
    interactions: list of (video_vector, direction, watch_time, video_length)
    """
    u0 = normalize(u0_raw)
    S = [0.0] * len(u0)
    N = 0.0

    for v_i, direction, watch_time, video_length in interactions:
        r = clamp_ratio(watch_time, video_length)
        s = swipe_weight(direction, r)
        if not v_i or len(v_i) != len(u0):
            continue
        S = [s_acc + s * v_comp for s_acc, v_comp in zip(S, v_i)]
        N += abs(s)

    u_interaction = [x / N for x in S] if N > 0 else [0.0] * len(u0)
    u_raw = [alpha * u0_i + beta * u_int_i for u0_i, u_int_i in zip(u0, u_interaction)]
    return normalize(u_raw)


def rank_videos(user_vector: Vector, videos: Dict[str, Vector]) -> List[Tuple[str, float]]:
    """
    videos: mapping video_id -> embedding
    returns sorted list (video_id, score) desc
    """
    scores = []
    for vid, emb in videos.items():
        scores.append((vid, cosine(user_vector, emb)))
    return sorted(scores, key=lambda x: x[1], reverse=True)

