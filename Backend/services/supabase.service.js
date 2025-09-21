import supabaseClient from '../config/supabase.config.js';

class SupabaseService {

    async fetchSimilarDocuments(embeddings, matchCount = 5, threshold = 0.3) {

        const { data, error } = await supabaseClient.rpc('match_documents', {
            query_embedding: embeddings,
            match_threshold: threshold,
            match_count: matchCount
        });

        console.log('Supabase RPC result:', { data, error });

        if (error) {
            console.error('Error fetching similar documents:', error);
            throw error;
        }
        
        return data;
    }
}

export default new SupabaseService();