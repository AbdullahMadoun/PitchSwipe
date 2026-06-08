"""
Advanced Vector Engine with Whisper Integration and Dynamic Learning
Implements sophisticated recommendation algorithm with running averages and adaptive weights
"""

import numpy as np
from typing import Optional, List, Dict, Set, Tuple
import os
import httpx
import json
import asyncio
import tempfile
import subprocess
import csv
from datetime import datetime

class WhisperTranscriber:
    """Handles video transcription using OpenAI Whisper API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
    async def transcribe_video(self, video_path: str) -> Dict:
        """
        Transcribe video using Whisper API
        Returns transcription with categorization
        """
        if not self.api_key:
            print("Warning: No OpenAI API key. Using placeholder transcription.")
            return {
                "transcription": "[Placeholder transcription - add OpenAI key for real transcription]",
                "categories": ["general"],
                "keywords": ["startup", "innovation"],
                "sentiment": "positive",
                "duration": 60
            }
        
        try:
            # Extract audio from video using ffmpeg
            audio_path = await self._extract_audio(video_path)
            
            # Call Whisper API
            async with httpx.AsyncClient(timeout=120.0) as client:
                with open(audio_path, 'rb') as audio_file:
                    files = {'file': ('audio.mp3', audio_file, 'audio/mpeg')}
                    data = {'model': 'whisper-1'}
                    headers = {'Authorization': f'Bearer {self.api_key}'}
                    
                    response = await client.post(
                        'https://api.openai.com/v1/audio/transcriptions',
                        headers=headers,
                        data=data,
                        files=files
                    )
                    
                    if response.status_code == 200:
                        transcription = response.json()['text']
                        
                        # Categorize the transcription
                        categories = await self._categorize_transcription(transcription)
                        
                        return {
                            "transcription": transcription,
                            "categories": categories['categories'],
                            "keywords": categories['keywords'],
                            "sentiment": categories['sentiment'],
                            "business_stage": categories.get('stage', 'unknown'),
                            "market_focus": categories.get('market', 'general')
                        }
            
            # Cleanup
            os.remove(audio_path)
            
        except Exception as e:
            print(f"Transcription error: {e}")
            return {
                "transcription": f"[Error in transcription: {e}]",
                "categories": ["general"],
                "keywords": [],
                "sentiment": "neutral"
            }
    
    async def _extract_audio(self, video_path: str) -> str:
        """Extract audio from video file using ffmpeg"""
        audio_path = tempfile.mktemp(suffix='.mp3')
        
        # Use ffmpeg to extract audio (requires ffmpeg installed)
        cmd = [
            'ffmpeg', '-i', video_path,
            '-vn', '-acodec', 'mp3',
            '-ar', '16000', '-ac', '1',
            audio_path, '-y'
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        await process.communicate()
        
        return audio_path
    
    async def _categorize_transcription(self, text: str) -> Dict:
        """
        Use GPT to categorize the transcription
        Extract industry, stage, keywords, sentiment
        """
        if not self.api_key:
            return {
                "categories": ["general"],
                "keywords": ["startup"],
                "sentiment": "positive",
                "stage": "seed"
            }
        
        async with httpx.AsyncClient() as client:
            prompt = f"""
            Analyze this startup pitch and extract:
            1. Industry categories (fintech, ai, healthcare, etc.)
            2. Business stage (pre-seed, seed, series-a, etc.)
            3. Key keywords (max 10)
            4. Market focus (B2B, B2C, Saudi market, global)
            5. Overall sentiment (positive, neutral, negative)
            
            Pitch: {text[:1500]}  # Limit to first 1500 chars
            
            Return as JSON with keys: categories, stage, keywords, market, sentiment
            """
            
            response = await client.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': 'gpt-3.5-turbo',
                    'messages': [
                        {'role': 'system', 'content': 'You are a startup analyst. Return only valid JSON.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    'temperature': 0.3,
                    'max_tokens': 200
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis = json.loads(result['choices'][0]['message']['content'])
                return analysis
            
            return {
                "categories": ["general"],
                "keywords": ["startup"],
                "sentiment": "positive",
                "stage": "seed"
            }


class AdvancedVectorEngine:
    """Enhanced vector engine with Whisper integration"""
    
    def __init__(self, openai_api_key: Optional[str] = None):
        self.api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.transcriber = WhisperTranscriber(self.api_key)
    
    async def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding from OpenAI API"""
        if not self.api_key:
            return np.random.randn(1536)
        
        async with httpx.AsyncClient() as client:
            try:
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
            except Exception as e:
                print(f"Error getting embedding: {e}")
        
        return np.random.randn(1536)
        
    async def get_embedding_with_transcription(self, text: str, transcription: str = "") -> np.ndarray:
        """
        Get embedding combining base text with transcription
        Gives more weight to transcription for better understanding
        """
        if not self.api_key:
            return np.random.randn(1536)
        
        # Combine description with transcription (transcription weighted higher)
        combined_text = f"{text}\n\nPitch Transcript:\n{transcription[:2000]}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "input": combined_text,
                    "model": "text-embedding-3-small"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return np.array(data["data"][0]["embedding"])
            
            return np.random.randn(1536)


class VectorStateLogger:
    """CSV logger for investor vector state visibility"""
    
    def __init__(self, storage_path: str = "storage"):
        self.storage_path = storage_path
        self.csv_path = os.path.join(storage_path, "investor_vectors.csv")
        self._ensure_csv_exists()
    
    def _ensure_csv_exists(self):
        """Create CSV file with headers if it doesn't exist"""
        os.makedirs(self.storage_path, exist_ok=True)
        
        if not os.path.exists(self.csv_path):
            with open(self.csv_path, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'timestamp', 'user_id', 'interaction_num', 'video_id', 'video_name',
                    'swipe_type', 'watch_time', 'video_length', 'watch_ratio',
                    'weight_applied', 'category', 'category_score',
                    'alpha', 'beta', 'N_accumulator', 'engagement_trend',
                    'recent_positive_rate', 'recent_negative_rate',
                    'u0_sample', 'u_interaction_sample', 'final_u_sample',
                    'cosine_similarity', 'rank_score', 'learning_progress'
                ])
    
    def log_interaction(
        self,
        user_id: str,
        interaction_data: Dict,
        vector_state: 'EnhancedUserVectorState',
        video_info: Optional[Dict] = None
    ):
        """Log a single interaction to CSV"""
        with open(self.csv_path, 'a', newline='') as f:
            writer = csv.writer(f)
            
            # Calculate recent rates
            recent_positive = sum(1 for _, t in vector_state.recent_interactions[-5:] if t == 'right')
            recent_negative = sum(1 for _, t in vector_state.recent_interactions[-5:] if t == 'left')
            
            # Get sample vector components (first 5 dimensions for visibility)
            u = vector_state.get_scoring_vector()
            u0_sample = ','.join([f'{v:.4f}' for v in vector_state.u0[:5]]) if vector_state.u0 is not None else 'N/A'
            
            # Calculate interaction vector
            if vector_state.N > 0:
                u_interaction = vector_state.S / vector_state.N
                u_interaction_sample = ','.join([f'{v:.4f}' for v in u_interaction[:5]])
            else:
                u_interaction_sample = 'N/A'
            
            u_sample = ','.join([f'{v:.4f}' for v in u[:5]])
            
            writer.writerow([
                datetime.now().isoformat(),
                user_id,
                vector_state.interaction_count,
                interaction_data.get('video_id', 'N/A'),
                video_info.get('name', 'N/A') if video_info else 'N/A',
                interaction_data.get('swipe_type', 'N/A'),
                interaction_data.get('watch_time', 0),
                interaction_data.get('video_length', 60),
                interaction_data.get('watch_ratio', 0),
                interaction_data.get('weight_applied', 0),
                interaction_data.get('category', 'N/A'),
                interaction_data.get('category_score', 0),
                vector_state.alpha,
                vector_state.beta,
                vector_state.N,
                interaction_data.get('engagement_trend', 0),
                recent_positive / 5.0 if vector_state.recent_interactions else 0,
                recent_negative / 5.0 if vector_state.recent_interactions else 0,
                u0_sample,
                u_interaction_sample,
                u_sample,
                interaction_data.get('cosine_similarity', 0),
                interaction_data.get('rank_score', 0),
                interaction_data.get('learning_progress', 0)
            ])
    
    def export_state_summary(self, user_id: str, vector_state: 'EnhancedUserVectorState') -> Dict:
        """Export current state summary as dictionary"""
        u = vector_state.get_scoring_vector()
        
        # Category analysis
        top_categories = sorted(
            vector_state.category_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return {
            'user_id': user_id,
            'timestamp': datetime.now().isoformat(),
            'total_interactions': vector_state.interaction_count,
            'videos_seen': len(vector_state.seen_ids),
            'videos_unlocked': len(vector_state.unlocked_ids),
            'videos_saved': len(vector_state.saved_ids),
            'avg_watch_time': vector_state.avg_watch_time,
            'engagement_trend': np.mean(vector_state.engagement_history) if vector_state.engagement_history else 0.5,
            'top_categories': top_categories,
            'alpha': vector_state.alpha,
            'beta': vector_state.beta,
            'N_accumulator': vector_state.N,
            'vector_norm': np.linalg.norm(u),
            'initial_preference_text': vector_state.initial_text
        }


class EnhancedUserVectorState:
    """
    Advanced user preference state with:
    - Running averages for recent behavior
    - Dynamic learning rates
    - Category diversity tracking
    - Engagement-based weight adjustments
    - CSV logging for visibility
    """
    
    def __init__(self, initial_text: str, alpha: float = 0.5, beta: float = 1.0, user_id: Optional[str] = None):
        self.alpha = alpha  # Initial preference weight
        self.beta = beta    # Learned preference weight
        self.initial_text = initial_text
        self.user_id = user_id
        
        # Initialize logger
        self.logger = VectorStateLogger() if user_id else None
        
        # Initialize with embedding (set asynchronously)
        self.u0 = None  # Initial preference vector
        
        # Core accumulators
        self.S = np.zeros(1536)  # Weighted sum of video vectors
        self.N = 0.0  # Sum of absolute weights
        self.seen_ids: Set[str] = set()
        self.unlocked_ids: Set[str] = set()
        self.saved_ids: Set[str] = set()
        
        # Advanced learning parameters
        self.interaction_count = 0
        self.running_avg_window = 10
        self.recent_interactions: List[Tuple[float, str]] = []  # (weight, swipe_type)
        self.learning_rate = 0.1
        self.exploration_bonus = 0.2
        
        # Category tracking for diversity
        self.category_interactions: Dict[str, List] = {}
        self.category_scores: Dict[str, float] = {}
        self.category_embeddings: Dict[str, np.ndarray] = {}
        
        # Engagement metrics
        self.avg_watch_time = 30.0  # Running average watch time
        self.engagement_history: List[float] = []
        
        # Adaptive parameters
        self.momentum = 0.9  # For exponential moving average
        self.temperature = 1.0  # For softmax scoring
        
    async def initialize(self, vector_engine):
        """Initialize preference vector with embedding"""
        embedding = await vector_engine.get_embedding(self.initial_text)
        self.u0 = self._normalize(embedding)
    
    def _normalize(self, v: np.ndarray) -> np.ndarray:
        """Normalize vector to unit length"""
        norm = np.linalg.norm(v)
        if norm < 1e-10:
            return v
        return v / norm
    
    def _calculate_adaptive_weight(
        self, 
        swipe_type: str, 
        watch_ratio: float,
        category: Optional[str] = None
    ) -> float:
        """
        Advanced weight calculation with multiple factors:
        - Watch ratio (engagement)
        - Interaction count (learning decay)
        - Category history (diversity)
        - Recent behavior (momentum)
        """
        r = np.clip(watch_ratio, 0.0, 1.0)
        
        # Time decay: early interactions matter more
        time_factor = 1.0 / (1.0 + 0.01 * self.interaction_count)
        
        # Category factor: boost/reduce based on category exploration
        category_factor = 1.0
        if category and category in self.category_interactions:
            cat_count = len(self.category_interactions[category])
            if cat_count > 5:
                category_factor = 0.8  # Reduce weight for over-explored
            elif cat_count < 2:
                category_factor = 1.2  # Boost underexplored
        
        # Recent behavior momentum
        momentum_factor = 1.0
        if self.recent_interactions:
            recent_positive = sum(1 for w, t in self.recent_interactions[-5:] if t == 'right')
            recent_negative = sum(1 for w, t in self.recent_interactions[-5:] if t == 'left')
            
            if recent_positive > 3:  # User is in "interested" mode
                momentum_factor = 1.1 if swipe_type == 'right' else 0.9
            elif recent_negative > 3:  # User is in "picky" mode
                momentum_factor = 0.9 if swipe_type == 'right' else 1.1
        
        # Calculate base weights with all factors
        if swipe_type == 'right':
            # Strong positive signal
            base = 0.5 + 0.5 * r
            # Watch time bonuses (watching >50% is positive)
            if r > 0.9:
                base *= 1.5  # Watched 90%+ - strong interest
            elif r > 0.75:
                base *= 1.2  # Watched 75%+ - high interest
            elif r > 0.5:
                base *= 1.1  # Watched 50%+ - moderate interest (EXPLICITLY POSITIVE)
            weight = base * time_factor * category_factor * momentum_factor
            
        elif swipe_type == 'left':
            # Negative signal
            base = -(0.5 + 0.5 * (1 - r))
            # Strong negative for instant skip (<5%)
            if r < 0.05:
                base *= 2.0
            elif r < 0.2:
                base *= 1.5
            weight = base * time_factor * category_factor
            
        elif swipe_type == 'save':
            # Save for later - positive signal (interested but not ready to unlock)
            weight = 0.4 * (0.5 + 0.5 * r) * time_factor
            
        elif swipe_type == 'down' or swipe_type == 'skip' or swipe_type == 'timeout':
            # Down swipe (skip) or timeout - depends on watch time
            # Down = intentional skip (neutral)
            # Timeout/Skip = check watch time
            if swipe_type == 'down':
                weight = 0.0  # Neutral - no preference signal
            else:
                # For timeout/skip: if watched >50%, it's mild positive (engaged but undecided)
                if r > 0.5:
                    weight = 0.2 * r * time_factor  # Mild positive for watching >50%
                else:
                    weight = -0.1 * time_factor  # Mild negative for quick skip
            
        else:
            weight = 0.0
        
        return weight
    
    def record_interaction(
        self,
        video_id: str,
        video_embedding: np.ndarray,
        swipe_type: str,
        watch_time: float,
        video_length: float = 60.0,
        category: Optional[str] = None,
        transcription_keywords: Optional[List[str]] = None,
        video_info: Optional[Dict] = None
    ) -> Dict:
        """
        Record interaction with enhanced tracking and CSV logging
        Returns analytics about the interaction
        """
        # Store for undo
        prev_state = {
            'S': self.S.copy(),
            'N': self.N,
            'seen_ids': self.seen_ids.copy(),
            'interaction_count': self.interaction_count
        }
        
        # Calculate metrics
        watch_ratio = watch_time / max(video_length, 1e-6)
        self.interaction_count += 1
        
        # Update engagement history
        self.engagement_history.append(watch_ratio)
        if len(self.engagement_history) > 20:
            self.engagement_history.pop(0)
        
        # Update average watch time (exponential moving average)
        self.avg_watch_time = self.momentum * self.avg_watch_time + (1 - self.momentum) * watch_time
        
        # Calculate adaptive weight
        weight = self._calculate_adaptive_weight(swipe_type, watch_ratio, category)
        
        # Update recent interactions
        self.recent_interactions.append((weight, swipe_type))
        if len(self.recent_interactions) > self.running_avg_window:
            self.recent_interactions.pop(0)
        
        # Update vector accumulators
        self.S = self.S + (weight * video_embedding)
        self.N = self.N + abs(weight)
        
        # Track seen and actions
        self.seen_ids.add(video_id)
        if swipe_type == 'right':
            self.unlocked_ids.add(video_id)
        elif swipe_type == 'save':
            self.saved_ids.add(video_id)
        # down/skip doesn't add to any special list
        
        # Category tracking
        if category:
            if category not in self.category_interactions:
                self.category_interactions[category] = []
                self.category_scores[category] = 0.0
                self.category_embeddings[category] = np.zeros(1536)
            
            self.category_interactions[category].append({
                'type': swipe_type,
                'ratio': watch_ratio,
                'weight': weight
            })
            
            # Update category embedding centroid
            self.category_embeddings[category] += weight * video_embedding
            
            # Update category score
            if swipe_type == 'right':
                self.category_scores[category] += 1.0 + watch_ratio
            elif swipe_type == 'left':
                self.category_scores[category] -= 0.5 * (1 - watch_ratio)
            elif swipe_type == 'save':
                self.category_scores[category] += 0.3
            elif swipe_type == 'down':
                # Neutral - no category score change
                pass
        
        # Prepare analytics
        analytics = {
            'video_id': video_id,
            'swipe_type': swipe_type,
            'watch_time': watch_time,
            'video_length': video_length,
            'weight_applied': weight,
            'watch_ratio': watch_ratio,
            'engagement_trend': np.mean(self.engagement_history) if self.engagement_history else 0.5,
            'category': category,
            'category_score': self.category_scores.get(category, 0) if category else None,
            'learning_progress': min(1.0, self.interaction_count / 50),  # Plateaus at 50 interactions
            'prev_state': prev_state
        }
        
        # Log to CSV if logger is available
        if self.logger and self.user_id:
            self.logger.log_interaction(
                user_id=self.user_id,
                interaction_data=analytics,
                vector_state=self,
                video_info=video_info
            )
        
        return analytics
    
    def get_adaptive_scoring_vector(self) -> np.ndarray:
        """
        Compute scoring vector with advanced adaptation:
        - Dynamic alpha/beta based on learning progress
        - Category preferences integration
        - Recent behavior emphasis
        - Exploration bonus for diversity
        """
        if self.u0 is None:
            return np.random.randn(1536)
        
        # Base interaction vector
        if self.N > 0:
            u_interaction = self.S / self.N
        else:
            u_interaction = np.zeros(1536)
        
        # Dynamic weights based on interaction count and engagement
        learning_progress = min(1.0, self.interaction_count / 30)
        avg_engagement = np.mean(self.engagement_history) if self.engagement_history else 0.5
        
        # Adjust weights: more interactions = trust learned preferences more
        dynamic_alpha = self.alpha * (1.0 - 0.5 * learning_progress)
        dynamic_beta = self.beta * (1.0 + learning_progress)
        
        # Boost beta if user is highly engaged
        if avg_engagement > 0.7:
            dynamic_beta *= 1.2
        elif avg_engagement < 0.3:
            # User is skipping a lot, rely more on initial preferences
            dynamic_alpha *= 1.3
            dynamic_beta *= 0.8
        
        # Add category preference vector
        category_vector = np.zeros(1536)
        if self.category_embeddings:
            # Weight categories by their scores
            total_score = sum(abs(s) for s in self.category_scores.values())
            if total_score > 0:
                for cat, embedding in self.category_embeddings.items():
                    if self.category_scores[cat] > 0:
                        weight = self.category_scores[cat] / total_score
                        category_vector += weight * embedding
        
        # Recent behavior vector (last N interactions)
        recent_vector = np.zeros(1536)
        if len(self.recent_interactions) >= 3:
            recent_weights = [w for w, _ in self.recent_interactions[-5:]]
            if sum(abs(w) for w in recent_weights) > 0:
                # Strong recent signal - add it
                recent_factor = 0.2 * np.sign(np.mean(recent_weights))
                recent_vector = recent_factor * u_interaction
        
        # Combine all vectors
        u_combined = (
            dynamic_alpha * self.u0 +
            dynamic_beta * u_interaction +
            0.15 * category_vector +
            0.1 * recent_vector
        )
        
        # Add exploration noise (decreases over time)
        exploration_factor = self.exploration_bonus * max(0, 1.0 - learning_progress)
        if exploration_factor > 0:
            noise = np.random.randn(1536) * exploration_factor
            u_combined += noise
        
        return self._normalize(u_combined)
    
    def rank_videos_advanced(
        self, 
        videos: List[Dict],
        use_diversity_boost: bool = True,
        temperature: Optional[float] = None
    ) -> List[Dict]:
        """
        Advanced ranking with multiple strategies:
        - Base similarity scoring
        - Category diversity boosting
        - Recency and novelty factors
        - Temperature-based softmax reranking
        """
        u = self.get_adaptive_scoring_vector()
        temp = temperature or self.temperature
        
        scored_videos = []
        
        # Get category distribution of seen videos
        seen_categories = {}
        for cat, interactions in self.category_interactions.items():
            seen_categories[cat] = len(interactions)
        total_seen = sum(seen_categories.values())
        
        for video in videos:
            if video['id'] in self.seen_ids:
                continue
            
            # Get embedding
            v = video.get('embedding', np.random.randn(1536))
            if isinstance(v, list):
                v = np.array(v)
            v_norm = self._normalize(v)
            
            # Base cosine similarity
            base_score = np.dot(u, v_norm)
            
            # Category diversity boost
            diversity_boost = 0.0
            category = video.get('industry', 'unknown')
            
            if use_diversity_boost and total_seen > 0:
                cat_count = seen_categories.get(category, 0)
                expected_ratio = 1.0 / max(len(seen_categories), 1)
                actual_ratio = cat_count / total_seen if total_seen > 0 else 0
                
                # Boost underrepresented categories
                if actual_ratio < expected_ratio * 0.5:
                    diversity_boost = 0.2
                elif actual_ratio < expected_ratio:
                    diversity_boost = 0.1
                # Penalize overrepresented
                elif actual_ratio > expected_ratio * 2:
                    diversity_boost = -0.1
            
            # Freshness boost (for new content)
            freshness_boost = 0.05 if self.interaction_count < 10 else 0.02
            
            # Stage preference (if user shows pattern)
            stage_boost = 0.0
            stage = video.get('stage', '')
            if stage and self.category_interactions:
                # Check if user prefers certain stages
                stage_interactions = []
                for interactions in self.category_interactions.values():
                    stage_interactions.extend([i for i in interactions if i.get('stage') == stage])
                
                if stage_interactions:
                    avg_weight = np.mean([i['weight'] for i in stage_interactions])
                    if avg_weight > 0.3:
                        stage_boost = 0.1
                    elif avg_weight < -0.3:
                        stage_boost = -0.1
            
            # Combine all factors
            final_score = base_score + diversity_boost + freshness_boost + stage_boost
            
            # Apply temperature softmax
            final_score = final_score / temp
            
            scored_videos.append({
                **video,
                'score': float(final_score),
                'base_score': float(base_score),
                'diversity_boost': diversity_boost,
                'factors': {
                    'similarity': float(base_score),
                    'diversity': diversity_boost,
                    'freshness': freshness_boost,
                    'stage_preference': stage_boost
                }
            })
        
        # Sort by score
        ranked = sorted(scored_videos, key=lambda x: x['score'], reverse=True)
        
        # Optional: Apply softmax reranking for more randomness
        if temperature and temperature != 1.0 and len(ranked) > 1:
            scores = np.array([v['score'] for v in ranked])
            # Softmax probabilities
            exp_scores = np.exp(scores - np.max(scores))
            probs = exp_scores / exp_scores.sum()
            
            # Sample based on probabilities (adds randomness)
            if np.random.random() < 0.2:  # 20% chance to reshuffle top items
                indices = np.random.choice(len(ranked), size=min(5, len(ranked)), 
                                         replace=False, p=probs)
                top_videos = [ranked[i] for i in indices]
                remaining = [v for i, v in enumerate(ranked) if i not in indices]
                ranked = top_videos + remaining
        
        return ranked
    
    def get_insights(self) -> Dict:
        """
        Get detailed insights about user behavior and preferences
        """
        insights = {
            'interaction_count': self.interaction_count,
            'seen_count': len(self.seen_ids),
            'unlocked_count': len(self.unlocked_ids),
            'saved_count': len(self.saved_ids),
            'avg_watch_time': self.avg_watch_time,
            'avg_engagement': np.mean(self.engagement_history) if self.engagement_history else 0.5,
            'learning_progress': min(1.0, self.interaction_count / 50),
            'exploration_level': self.exploration_bonus * max(0, 1.0 - self.interaction_count / 50)
        }
        
        # Category preferences
        if self.category_scores:
            sorted_cats = sorted(self.category_scores.items(), key=lambda x: x[1], reverse=True)
            insights['top_categories'] = sorted_cats[:3]
            insights['avoided_categories'] = [c for c, s in sorted_cats if s < -0.5]
        
        # Recent trend
        if len(self.recent_interactions) >= 3:
            recent_weights = [w for w, _ in self.recent_interactions[-5:]]
            recent_trend = np.mean(recent_weights)
            if recent_trend > 0.3:
                insights['recent_mood'] = 'highly_interested'
            elif recent_trend > 0:
                insights['recent_mood'] = 'exploring'
            elif recent_trend > -0.3:
                insights['recent_mood'] = 'selective'
            else:
                insights['recent_mood'] = 'not_engaged'
        
        return insights


# Example usage for Saudi startups with transcription
async def process_saudi_startup_video(
    video_path: str,
    company_data: Dict,
    vector_engine: AdvancedVectorEngine
) -> Dict:
    """
    Process a Saudi startup video with transcription and categorization
    """
    
    # Transcribe the video
    transcription_data = await vector_engine.transcriber.transcribe_video(video_path)
    
    # Create rich description combining all data
    rich_text = f"""
    Company: {company_data.get('name', '')}
    Tagline: {company_data.get('tagline', '')}
    Industry: {company_data.get('industry', '')}
    Stage: {company_data.get('stage', '')}
    Location: Saudi Arabia
    Raising: SAR {company_data.get('raise_amount', 0):,.0f}
    
    Pitch Transcript:
    {transcription_data['transcription'][:1500]}
    
    Keywords: {', '.join(transcription_data['keywords'])}
    Market Focus: {transcription_data.get('market_focus', 'Saudi market')}
    """
    
    # Generate embedding with transcription
    embedding = await vector_engine.get_embedding_with_transcription(
        company_data.get('description', ''),
        transcription_data['transcription']
    )
    
    return {
        **company_data,
        'embedding': embedding.tolist(),
        'transcription': transcription_data['transcription'],
        'categories': transcription_data['categories'],
        'keywords': transcription_data['keywords'],
        'sentiment': transcription_data['sentiment'],
        'market_focus': transcription_data.get('market_focus', 'general')
    }