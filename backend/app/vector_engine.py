"""
Vector Engine for AI-powered video ranking
Based on CLAUDE.md algorithm specification
"""

import numpy as np
from typing import Optional, List, Dict, Set

class UserVectorState:
    """Maintains dynamic user preference state for personalized ranking."""
    
    def __init__(self, initial_embedding: np.ndarray, alpha: float = 0.5, beta: float = 1.0):
        self.alpha = alpha
        self.beta = beta
        
        # Normalize initial preference vector
        self.u0 = self._normalize(initial_embedding)
        
        # Initialize accumulators
        self.S = np.zeros(1536)  # Weighted sum of video vectors
        self.N = 0.0  # Sum of absolute weights
        self.seen_ids: Set[str] = set()
        self.unlocked_ids: Set[str] = set()
        self.saved_ids: Set[str] = set()
        self.last_interaction: Optional[Dict] = None  # For undo
    
    def _normalize(self, v: np.ndarray) -> np.ndarray:
        """Normalize vector to unit length."""
        norm = np.linalg.norm(v)
        if norm < 1e-10:
            return v
        return v / norm
    
    def _calculate_weight(self, swipe_type: str, watch_ratio: float) -> float:
        """
        Calculate interaction weight (s) based on swipe type and attention.
        
        Args:
            swipe_type: 'right' | 'left' | 'down'
            watch_ratio: watch_time / video_length (clamped 0-1)
        """
        r = np.clip(watch_ratio, 0.0, 1.0)
        
        if swipe_type == 'right':
            # Positive: more weight if watched longer
            return 0.5 + 0.5 * r
        elif swipe_type == 'left':
            # Negative: penalize more for quick rejects
            return -(0.5 + 0.5 * (1 - r))
        elif swipe_type == 'down':
            # Soft negative for feed ranking
            return -0.3 * (1 - r)
        else:
            return 0.0
    
    def record_interaction(
        self, 
        video_id: str,
        video_embedding: np.ndarray,
        swipe_type: str,
        watch_time: float,
        video_length: float
    ) -> None:
        """Record a swipe interaction and update vector state."""
        
        # Store for potential undo
        self.last_interaction = {
            'video_id': video_id,
            'video_embedding': video_embedding.copy(),
            'swipe_type': swipe_type,
            'watch_time': watch_time,
            'video_length': video_length,
            'prev_S': self.S.copy(),
            'prev_N': self.N
        }
        
        # Calculate watch ratio
        watch_ratio = watch_time / max(video_length, 1e-6)
        
        # Calculate weight
        s = self._calculate_weight(swipe_type, watch_ratio)
        
        # Update accumulators
        self.S = self.S + (s * video_embedding)
        self.N = self.N + abs(s)
        
        # Track seen videos
        self.seen_ids.add(video_id)
        
        # Track unlocks and saves
        if swipe_type == 'right':
            self.unlocked_ids.add(video_id)
        elif swipe_type == 'down':
            self.saved_ids.add(video_id)
    
    def undo_last_interaction(self) -> bool:
        """Undo the last swipe interaction. Returns True if successful."""
        if self.last_interaction is None:
            return False
        
        video_id = self.last_interaction['video_id']
        swipe_type = self.last_interaction['swipe_type']
        
        # Restore vector state
        self.S = self.last_interaction['prev_S']
        self.N = self.last_interaction['prev_N']
        
        # Remove from tracking sets
        self.seen_ids.discard(video_id)
        self.unlocked_ids.discard(video_id)
        self.saved_ids.discard(video_id)
        
        # Clear undo state (can only undo once)
        self.last_interaction = None
        
        return True
    
    def get_scoring_vector(self) -> np.ndarray:
        """
        Compute final scoring vector (u) for ranking.
        
        u_raw = α * u0 + β * u_interaction
        u = normalize(u_raw)
        """
        # Compute interaction centroid
        if self.N > 0:
            u_interaction = self.S / self.N
        else:
            u_interaction = np.zeros(1536)
        
        # Blend initial preferences with learned behavior
        u_raw = self.alpha * self.u0 + self.beta * u_interaction
        
        return self._normalize(u_raw)
    
    def rank_videos(self, videos: List[Dict]) -> List[Dict]:
        """
        Rank unseen videos by cosine similarity to scoring vector.
        
        Args:
            videos: List of dicts with 'id' and 'embedding' keys
            
        Returns:
            Sorted list (highest score first)
        """
        u = self.get_scoring_vector()
        
        scored = []
        for video in videos:
            if video['id'] in self.seen_ids:
                continue
            
            v = video['embedding']
            if isinstance(v, list):
                v = np.array(v)
            score = np.dot(u, self._normalize(v))  # Cosine sim (both normalized)
            scored.append({**video, 'score': score})
        
        return sorted(scored, key=lambda x: x['score'], reverse=True)