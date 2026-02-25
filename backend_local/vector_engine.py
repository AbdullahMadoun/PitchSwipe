"""
Vector Engine with OpenAI Embeddings for PitchSwipe
Implements the recommendation algorithm from CLAUDE.md
"""

import numpy as np
from typing import Optional, List, Dict, Set
import os
import httpx
import json

class VectorEngine:
    """Implements the PitchSwipe recommendation algorithm with OpenAI embeddings"""
    
    def __init__(self, openai_api_key: Optional[str] = None):
        self.api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            print("Warning: No OpenAI API key provided. Using random vectors for demo.")
        
    async def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding from OpenAI API or fallback to random for demo"""
        
        if not self.api_key:
            # Return random vector for demo if no API key
            return np.random.randn(1536)
        
        # Call OpenAI API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "input": text,
                    "model": "text-embedding-3-small"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return np.array(data["data"][0]["embedding"])
            else:
                print(f"OpenAI API error: {response.status_code}")
                return np.random.randn(1536)

class UserVectorState:
    """Maintains dynamic user preference state for personalized ranking"""
    
    def __init__(self, initial_text: str, alpha: float = 0.5, beta: float = 1.0):
        self.alpha = alpha  # Weight for initial preferences
        self.beta = beta    # Weight for learned preferences
        self.initial_text = initial_text
        
        # Initialize with embedding (will be set asynchronously)
        self.u0 = None  # Initial preference vector
        
        # Accumulators for learning
        self.S = np.zeros(1536)  # Weighted sum of video vectors
        self.N = 0.0  # Sum of absolute weights
        self.seen_ids: Set[str] = set()
        self.unlocked_ids: Set[str] = set()
        self.saved_ids: Set[str] = set()
        self.last_interaction: Optional[Dict] = None  # For undo
    
    async def initialize(self, vector_engine: VectorEngine):
        """Initialize the preference vector with OpenAI embedding"""
        embedding = await vector_engine.get_embedding(self.initial_text)
        self.u0 = self._normalize(embedding)
    
    def _normalize(self, v: np.ndarray) -> np.ndarray:
        """Normalize vector to unit length"""
        norm = np.linalg.norm(v)
        if norm < 1e-10:
            return v
        return v / norm
    
    def _calculate_weight(self, swipe_type: str, watch_ratio: float) -> float:
        """
        Calculate interaction weight based on swipe type and attention
        
        From CLAUDE.md algorithm:
        - Right swipe: positive weight (0.5 to 1.0 based on watch time)
        - Left swipe: negative weight (-0.5 to -1.0)
        - Down swipe (save): soft negative for ranking
        """
        r = np.clip(watch_ratio, 0.0, 1.0)
        
        if swipe_type == 'right':
            # Positive: more weight if watched longer
            return 0.5 + 0.5 * r
        elif swipe_type == 'left':
            # Negative: penalize more for quick rejects
            return -(0.5 + 0.5 * (1 - r))
        elif swipe_type == 'down':
            # Soft negative for feed ranking (saved for later)
            return -0.3 * (1 - r)
        else:
            return 0.0
    
    def record_interaction(
        self, 
        video_id: str,
        video_embedding: np.ndarray,
        swipe_type: str,
        watch_time: float,
        video_length: float = 60.0  # Default 60 seconds
    ) -> None:
        """Record a swipe interaction and update vector state"""
        
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
        
        # Calculate weight using the algorithm
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
        """Undo the last swipe interaction"""
        if self.last_interaction is None:
            return False
        
        video_id = self.last_interaction['video_id']
        
        # Restore vector state
        self.S = self.last_interaction['prev_S']
        self.N = self.last_interaction['prev_N']
        
        # Remove from tracking sets
        self.seen_ids.discard(video_id)
        self.unlocked_ids.discard(video_id)
        self.saved_ids.discard(video_id)
        
        # Clear undo state
        self.last_interaction = None
        
        return True
    
    def get_scoring_vector(self) -> np.ndarray:
        """
        Compute final scoring vector for ranking
        
        From CLAUDE.md:
        u = normalize(α * u₀ + β * u_interaction)
        """
        if self.u0 is None:
            # Not initialized yet, return random
            return np.random.randn(1536)
        
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
        Rank unseen videos by cosine similarity to scoring vector
        
        Returns sorted list with highest scores first
        """
        u = self.get_scoring_vector()
        
        scored = []
        for video in videos:
            if video['id'] in self.seen_ids:
                continue
            
            # Get embedding (should be numpy array)
            if isinstance(video.get('embedding'), list):
                v = np.array(video['embedding'])
            else:
                v = video.get('embedding', np.random.randn(1536))
            
            # Normalize video vector
            v = self._normalize(v)
            
            # Calculate cosine similarity (dot product of normalized vectors)
            score = np.dot(u, v)
            scored.append({**video, 'score': float(score)})
        
        # Sort by score descending
        return sorted(scored, key=lambda x: x['score'], reverse=True)
    
    def get_stats(self) -> Dict:
        """Get current state statistics"""
        return {
            'seen_count': len(self.seen_ids),
            'unlocked_count': len(self.unlocked_ids),
            'saved_count': len(self.saved_ids),
            'learning_weight': self.N,
            'has_learned': self.N > 0
        }


# Example usage with Saudi companies
async def generate_company_embedding(company: Dict, vector_engine: VectorEngine) -> Dict:
    """Generate embedding for a company based on its description"""
    
    # Create rich text description for embedding
    text = f"""
    Company: {company.get('name', '')}
    Tagline: {company.get('tagline', '')}
    Industry: {company.get('industry', '')}
    Stage: {company.get('stage', '')}
    Description: {company.get('description', '')}
    Raising: SAR {company.get('raise_amount', 0):,.0f}
    Location: Saudi Arabia
    """
    
    embedding = await vector_engine.get_embedding(text)
    company['embedding'] = embedding.tolist()  # Store as list for JSON serialization
    
    return company


# Example Saudi investor preferences
SAUDI_INVESTOR_PREFERENCES = {
    "tech_focused": "I'm interested in technology startups in Saudi Arabia, especially fintech, e-commerce, and SaaS companies. Looking for Seed to Series A stage with strong local market understanding.",
    
    "vision_2030": "Seeking startups aligned with Saudi Vision 2030, particularly in tourism, entertainment, renewable energy, and digital transformation sectors.",
    
    "female_founders": "Supporting female-led startups in Saudi Arabia across all sectors, especially those addressing unique market gaps in the Kingdom.",
    
    "local_impact": "Focused on startups solving real problems for Saudi consumers and businesses, with potential for GCC expansion."
}