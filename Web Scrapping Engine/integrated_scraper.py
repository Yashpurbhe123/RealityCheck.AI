import feedparser
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timezone
import time
import logging
from urllib.parse import urljoin, urlparse
import os
import signal
import sys
import hashlib
import numpy as np
from dotenv import load_dotenv
from typing import List, Dict, Any, Set, Tuple
from huggingface_hub import InferenceClient
from supabase import create_client, Client
import argparse


load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('integrated_news_scraper.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class IntegratedNewsScraperEmbedder:
    def __init__(self, 
                 table_name: str = "documents",
                 chunks_table_name: str = "document_chunks",
                 model_name: str = "google/embeddinggemma-300m",
                 chunk_size: int = 500,
                 chunk_overlap: int = 50):
        
        # Initialize external clients
        self._init_clients()
        
        # Scraper configuration
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        })
        
        # Embedder configuration
        self.table_name = table_name
        self.chunks_table_name = chunks_table_name
        self.model_name = model_name
        self.embedding_dim = 768
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Track processed articles to avoid duplicates
        self.processed_urls: Set[str] = set()
        self.session_start_time = datetime.now(timezone.utc)
        
        # Load existing processed URLs from database
        self._load_existing_urls()
        
        # Statistics
        self.stats = {
            'total_articles_scraped': 0,
            'successful_embeddings': 0,
            'failed_embeddings': 0,
            'total_chunks_created': 0,
            'session_start': self.session_start_time.isoformat()
        }
        
        # News sources configuration
        self.news_sources = {
            'The Hindu': {
                'rss_url': 'https://www.thehindu.com/feeder/default.rss',
                'content_selectors': [
                    'div[data-component="text"] p',
                    '.content p',
                    'article p'
                ],
                'date_selectors': ['.publish-time', '.story-date', '.article-date'],
                'clean_patterns': []
            },
            'Indian Express': {
                'rss_url': 'https://indianexpress.com/feed/',
                'content_selectors': [
                    'div[itemprop="articleBody"] p',
                    '.full-details p',
                    'article p'
                ],
                'date_selectors': ['.story-date', '.publish-time', '.article-date'],
                'clean_patterns': []
            },
            'New York Times': {
                'rss_url': 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
                'content_selectors': [
                    'section[name="articleBody"] p',
                    '.StoryBodyCompanionColumn p',
                    'article p'
                ],
                'date_selectors': ['time[datetime]', '.dateline', '.story-meta time'],
                'clean_patterns': [r'Advertisement', r'Continue reading the main story']
            },
            'The Guardian': {
                'rss_url': 'https://www.theguardian.com/world/rss',
                'content_selectors': [
                    '.content__article-body p',
                    '[data-gu-name="body"] p',
                    'article p'
                ],
                'date_selectors': ['.content__dateline time', '.meta time', 'time[datetime]'],
                'clean_patterns': [r'Support The Guardian', r'Sign up.*?newsletter']
            },
            'Reuters': {
                'rss_url': 'https://feeds.reuters.com/reuters/worldNews',
                'content_selectors': ['[data-module="ArticleBody"] p', 'article p'],
                'date_selectors': ['time[datetime]'],
                'clean_patterns': [r'Reporting by.*?;', r'Editing by.*']
            }
        }
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def _init_clients(self):
        # Initialize external API clients
        try:
            self.hf_client = InferenceClient(
                provider="hf-inference",
                api_key=os.environ["HF_TOKEN"],
            )
            logger.info("Hugging Face client initialized")
        except Exception as e:
            logger.error(f"Error initializing HuggingFace client: {e}")
            self.hf_client = None

        try:
            supabase_url = os.environ["SUPA_URL"]
            supabase_key = os.environ["SUPA_TOKEN"]
            self.supabase = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized")
        except Exception as e:
            logger.error(f"Error initializing Supabase client: {e}")
            self.supabase = None

        if not self.hf_client or not self.supabase:
            raise RuntimeError("Failed to initialize required clients")

    def _load_existing_urls(self):
        # Load existing URLs from database to avoid duplicates
        try:
            response = self.supabase.table(self.table_name).select("metadata").execute()
            for item in response.data:
                metadata = item.get('metadata', {})
                if 'url' in metadata:
                    self.processed_urls.add(metadata['url'])
            logger.info(f"Loaded {len(self.processed_urls)} existing URLs from database")
        except Exception as e:
            logger.error(f"Error loading existing URLs: {e}")
            self.processed_urls = set()

    def generate_article_hash(self, headline: str, url: str) -> str:
        # Generate unique hash for article
        return hashlib.md5(f"{headline}_{url}".encode()).hexdigest()

    def normalize_datetime(self, date_string: str, published_parsed=None) -> Dict[str, Any]:
        # Convert various date formats to standardized format
        try:
            if published_parsed:
                dt = datetime(*published_parsed[:6], tzinfo=timezone.utc)
                return {
                    'iso_format': dt.isoformat(),
                    'readable': dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
                    'timestamp': dt.timestamp()
                }
            
            if date_string:
                patterns = [
                    '%a, %d %b %Y %H:%M:%S %z',
                    '%a, %d %b %Y %H:%M:%S %Z',
                    '%Y-%m-%d %H:%M:%S',
                    '%d %b %Y, %H:%M',
                    '%d-%m-%Y %H:%M:%S'
                ]
                
                for pattern in patterns:
                    try:
                        dt = datetime.strptime(date_string.strip(), pattern)
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        return {
                            'iso_format': dt.isoformat(),
                            'readable': dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
                            'timestamp': dt.timestamp()
                        }
                    except ValueError:
                        continue
            
            dt = datetime.now(timezone.utc)
            return {
                'iso_format': dt.isoformat(),
                'readable': dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
                'timestamp': dt.timestamp()
            }
            
        except Exception:
            dt = datetime.now(timezone.utc)
            return {
                'iso_format': dt.isoformat(),
                'readable': dt.strftime('%Y-%m-%d %H:%M:%S UTC'),
                'timestamp': dt.timestamp()
            }

    def clean_text(self, text: str, clean_patterns: List[str] = None) -> str:
        # Clean and normalize text content
        if not text:
            return ""
        
        text = ' '.join(text.split())
        
        if clean_patterns:
            for pattern in clean_patterns:
                import re
                text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        unwanted_phrases = [
            r'Also Read:.*?(?=\n|\Z)',
            r'Read More:.*?(?=\n|\Z)',
            r'Subscribe to.*?(?=\n|\Z)',
            r'Follow us on.*?(?=\n|\Z)',
            r'\(This story has not been edited.*?\)',
            r'For more news.*?(?=\n|\Z)',
            r'Terms & conditions.*',
            r'Comments have to be.*'
        ]
        
        import re
        for phrase in unwanted_phrases:
            text = re.sub(phrase, '', text, flags=re.IGNORECASE | re.DOTALL)
        
        return text.strip()

    def extract_detailed_content(self, url: str, source: str) -> Dict[str, Any]:
        # Extract detailed content from article URL
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 
                                'advertisement', 'ad', '.advertisement', '.ad']):
                element.decompose()
            
            source_config = self.news_sources[source]
            
            content = ""
            for selector in source_config['content_selectors']:
                paragraphs = soup.select(selector)
                if paragraphs:
                    content = ' '.join([p.get_text().strip() for p in paragraphs 
                                      if p.get_text().strip() and len(p.get_text().strip()) > 20])
                    if len(content) > 300:
                        break
            
            if not content or len(content) < 300:
                generic_selectors = ['article p', '.article-content p', '.story-content p', 'p']
                for selector in generic_selectors:
                    paragraphs = soup.select(selector)
                    if paragraphs:
                        content = ' '.join([p.get_text().strip() for p in paragraphs 
                                          if p.get_text().strip() and len(p.get_text().strip()) > 20])
                        if len(content) > 300:
                            break
            
            content = self.clean_text(content, source_config['clean_patterns'])
            
            return {
                'full_content': content,
                'content_length': len(content),
                'extraction_success': len(content) > 100
            }
            
        except Exception as e:
            return {
                'full_content': "",
                'content_length': 0,
                'extraction_success': False,
                'error': str(e)
            }

    def _get_embedding(self, text: str) -> np.ndarray:
        # Get embedding from Hugging Face API
        if not self.hf_client:
            raise RuntimeError("Hugging Face client is not initialized.")
        try:
            embedding_matrix = self.hf_client.feature_extraction(
                text,
                model=self.model_name
            )
            
            embedding_array = np.array(embedding_matrix, dtype=np.float32)
            
            if embedding_array.ndim == 1:
                normalized_embedding = self._normalize(embedding_array)
            elif embedding_array.ndim == 2:
                pooled_embedding = self._mean_pool(embedding_array)
                normalized_embedding = self._normalize(pooled_embedding)
            else:
                logger.error(f"Unexpected embedding shape {embedding_array.shape}")
                return None
            
            return normalized_embedding
            
        except Exception as e:
            logger.error(f"Error getting embedding from API: {e}")
            return None

    def _mean_pool(self, matrix: np.ndarray) -> np.ndarray:
        # Perform mean pooling on embedding matrix
        return np.mean(matrix, axis=0)
    
    def _normalize(self, vec: np.ndarray) -> np.ndarray:
        # L2 normalize the vector
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec

    def _chunk_text(self, text: str) -> List[str]:
        # Split text into overlapping chunks
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end < len(text):
                last_space = text.rfind(' ', start, end)
                if last_space > start:
                    end = last_space
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - self.chunk_overlap
            if start <= 0:
                start = end
                
            if start >= len(text):
                break
                
        return chunks

    def _store_main_document(self, content: str, metadata: Dict[str, Any], embedding: np.ndarray) -> str:
        # Store main document in Supabase
        try:
            embedding_list = embedding.tolist()
            
            data = {
                "content": content,
                "metadata": metadata,
                "embedding": embedding_list
            }
            
            response = self.supabase.table(self.table_name).insert(data).execute()
            
            if response.data and len(response.data) > 0:
                document_uuid = response.data[0]['id']
                return document_uuid
            else:
                return None
            
        except Exception as e:
            logger.error(f"Error storing main document: {e}")
            return None

    def _store_document_chunks(self, document_uuid: str, chunks: List[str]) -> int:
        # Store document chunks in Supabase
        successful_chunks = 0
        
        for chunk_index, chunk_text in enumerate(chunks):
            try:
                chunk_embedding = self._get_embedding(chunk_text)
                if chunk_embedding is None:
                    continue
                
                embedding_list = chunk_embedding.tolist()
                
                chunk_data = {
                    "document_id": document_uuid,
                    "chunk_index": chunk_index,
                    "chunk_text": chunk_text,
                    "embedding": embedding_list
                }
                
                response = self.supabase.table(self.chunks_table_name).insert(chunk_data).execute()
                successful_chunks += 1
                
            except Exception as e:
                logger.error(f"Error storing chunk {chunk_index}: {e}")
                continue
        
        return successful_chunks

    def process_and_embed_article(self, article_data: Dict[str, Any]) -> Tuple[bool, int]:

        try:
            # Create text for embedding
            text_parts = []
            if article_data.get('headline'):
                text_parts.append(f"Headline: {article_data['headline']}")
            if article_data.get('description'):
                text_parts.append(f"Description: {article_data['description']}")
            if article_data.get('full_content'):
                text_parts.append(f"Content: {article_data['full_content']}")
            
            full_text = " ".join(text_parts)
            
            if not full_text.strip():
                logger.warning("No text content found for article")
                return False, 0

            # Get main embedding
            main_embedding = self._get_embedding(full_text)
            if main_embedding is None:
                logger.error("Failed to get main embedding")
                return False, 0

            # Create metadata
            metadata = {
                'content_id': article_data['article_id'],
                'processing_timestamp': datetime.now().isoformat(),
                'headline': article_data.get('headline', ''),
                'source': article_data.get('source', ''),
                'url': article_data.get('url', ''),
                'published_date_iso': article_data.get('published_date', {}).get('iso_format', ''),
                'published_date_readable': article_data.get('published_date', {}).get('readable', ''),
                'published_timestamp': article_data.get('published_date', {}).get('timestamp', 0)
            }

            # Store main document
            document_uuid = self._store_main_document(full_text, metadata, main_embedding)
            if not document_uuid:
                return False, 0

            # Create and store chunks
            chunks = self._chunk_text(full_text)
            successful_chunks = self._store_document_chunks(document_uuid, chunks)
            
            logger.info(f"Successfully embedded article: {article_data.get('headline', 'No title')[:80]} with {successful_chunks} chunks")
            return True, successful_chunks

        except Exception as e:
            logger.error(f"Error processing article: {e}")
            return False, 0

    def scrape_and_embed_batch(self, max_articles_per_source: int = 15) -> Dict[str, int]:
        batch_start = datetime.now(timezone.utc)
        logger.info(f"Starting scrape and embed batch at {batch_start.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        
        batch_stats = {
            'articles_scraped': 0,
            'articles_embedded': 0,
            'total_chunks': 0,
            'failed_articles': 0
        }
        
        for source in self.news_sources.keys():
            try:
                source_config = self.news_sources[source]
                logger.info(f"Processing source: {source}")
                
                feed = feedparser.parse(source_config['rss_url'])
                
                if not feed.entries:
                    logger.warning(f"No articles found for {source}")
                    continue
                
                source_processed = 0
                for entry in feed.entries[:max_articles_per_source]:
                    headline = getattr(entry, 'title', 'No Title Available').strip()
                    article_url = getattr(entry, 'link', '').strip()
                    
                    if not article_url or article_url in self.processed_urls:
                        continue
                    
                    logger.info(f"Processing article: {headline[:80]}")
                    
                    # Extract content
                    content_data = self.extract_detailed_content(article_url, source)
                    
                    if not content_data['extraction_success']:
                        batch_stats['failed_articles'] += 1
                        logger.warning(f"Failed to extract content for: {headline[:50]}")
                        continue
                    
                    # Prepare article data
                    description = getattr(entry, 'description', '').strip()
                    published_date = getattr(entry, 'published', '')
                    published_parsed = getattr(entry, 'published_parsed', None)
                    datetime_info = self.normalize_datetime(published_date, published_parsed)
                    
                    article_data = {
                        'article_id': self.generate_article_hash(headline, article_url),
                        'headline': headline,
                        'source': source,
                        'url': article_url,
                        'description': self.clean_text(description),
                        'full_content': content_data['full_content'],
                        'published_date': datetime_info,
                        'scraped_at': datetime.now(timezone.utc).isoformat()
                    }
                    
                    # Immediately process and embed
                    success, chunk_count = self.process_and_embed_article(article_data)
                    
                    if success:
                        batch_stats['articles_embedded'] += 1
                        batch_stats['total_chunks'] += chunk_count
                        self.processed_urls.add(article_url)
                        source_processed += 1
                        logger.info(f"Successfully embedded article with {chunk_count} chunks")
                    else:
                        batch_stats['failed_articles'] += 1
                        logger.error(f"Failed to embed article: {headline[:50]}")
                    
                    batch_stats['articles_scraped'] += 1
                    
                    # Respectful delay
                    time.sleep(2)
                
                logger.info(f"Source {source} completed: {source_processed} articles processed and embedded")
                time.sleep(3)  # Delay between sources
                
            except Exception as e:
                logger.error(f"Error processing {source}: {str(e)}")
                continue
        
        # Update session statistics
        self.stats['total_articles_scraped'] += batch_stats['articles_scraped']
        self.stats['successful_embeddings'] += batch_stats['articles_embedded']
        self.stats['failed_embeddings'] += batch_stats['failed_articles']
        self.stats['total_chunks_created'] += batch_stats['total_chunks']
        
        batch_end = datetime.now(timezone.utc)
        duration = (batch_end - batch_start).total_seconds()
        
        logger.info(f"Batch completed in {duration:.1f} seconds")
        logger.info(f"Batch results: {batch_stats['articles_embedded']}/{batch_stats['articles_scraped']} articles embedded, {batch_stats['total_chunks']} total chunks created")
        
        return batch_stats

    def print_session_stats(self):
        uptime = datetime.now(timezone.utc) - self.session_start_time
        
        logger.info("=" * 60)
        logger.info("INTEGRATED NEWS SCRAPER & EMBEDDER SESSION STATISTICS")
        logger.info("=" * 60)
        logger.info(f"Session uptime: {str(uptime).split('.')[0]}")
        logger.info(f"Articles scraped: {self.stats['total_articles_scraped']}")
        logger.info(f"Successfully embedded: {self.stats['successful_embeddings']}")
        logger.info(f"Failed embeddings: {self.stats['failed_embeddings']}")
        logger.info(f"Total chunks created: {self.stats['total_chunks_created']}")
        logger.info(f"Unique URLs processed: {len(self.processed_urls)}")
        success_rate = (self.stats['successful_embeddings']/max(1, self.stats['total_articles_scraped'])*100)
        logger.info(f"Success rate: {success_rate:.1f}%")
        logger.info("=" * 60)

    def signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        logger.info("Shutdown signal received, cleaning up session")
        self.print_session_stats()
        logger.info("Session statistics logged successfully")
        sys.exit(0)

    def run_single_batch(self, max_articles_per_source: int = 15) -> Dict[str, int]:
        logger.info("Starting batch execution")
        
        if not self.hf_client or not self.supabase:
            logger.error("Required clients not initialized properly")
            return {'error': 1}
        
        try:
            results = self.scrape_and_embed_batch(max_articles_per_source)
            self.print_session_stats()
            logger.info("Single batch execution completed successfully")
            return results
            
        except Exception as e:
            logger.error(f"Error during batch execution: {e}")
            return {'error': 1}


def main():
    parser = argparse.ArgumentParser(description='Log')
    parser.add_argument('--max-articles', type=int, default=15,
                       help='Maximum articles per source (default: 15)')
    parser.add_argument('--chunk-size', type=int, default=500,
                       help='Chunk size for text splitting (default: 500)')
    parser.add_argument('--chunk-overlap', type=int, default=50,
                       help='Chunk overlap size (default: 50)')
    parser.add_argument('--model', type=str, default='google/embeddinggemma-300m',
                       help='Embedding model to use (default: google/embeddinggemma-300m)')
    
    args = parser.parse_args()
    
    try:
        # Initialize the integrated scraper
        scraper = IntegratedNewsScraperEmbedder(
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap,
            model_name=args.model
        )
        
        # Run single batch (perfect for cron jobs)
        results = scraper.run_single_batch(max_articles_per_source=args.max_articles)
        
        # Exit with appropriate code
        if 'error' in results:
            logger.error("Batch execution failed")
            sys.exit(1)
        else:
            logger.info(f"Batch completed successfully: {results['articles_embedded']} articles embedded with {results['total_chunks']} chunks")
            sys.exit(0)
            
    except KeyboardInterrupt:
        logger.info("Process interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error occurred: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()