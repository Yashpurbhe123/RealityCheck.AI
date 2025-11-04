import api from './api'

export interface VerificationResult {
  verdict: string
  confidence: number
  reason: string
  awareness_factor?: string
}

export async function verifyTweetContent(tweetId: string | number | undefined, content: string, username: string, socialMediaType: string = 'twitter', imageUrl?: string): Promise<VerificationResult | null> {
  try {
    console.log('[VerifyTweet][client] Sending to server:', { tweetId, content, username, socialMediaType, imageUrl })
    const response = await api.verifyTweet({ tweetId: String(tweetId || ''), content, username, socialMediaType, imageUrl })
    console.log('[VerifyTweet][server->client] Full response:', response)
    
    // Extract the verification result from the response
    // The backend route wraps the result in { response: actualResult }
    if (response?.response) {
      return response.response as VerificationResult
    }
    
    // Fallback: if response is the result directly
    if (response && typeof response === 'object' && 'verdict' in response) {
      console.log('[VerifyTweet][client] Using direct response:', response)
      return response as VerificationResult
    }
    
    console.log('[VerifyTweet][client] No valid result found in response')
    return null
  } catch (err) {
    console.error('[VerifyTweet][client] Error during verification:', err)
    // Provide a more user-friendly error message
    const errorMessage = err instanceof Error ? err.message : 'Failed to verify tweet content'
    throw new Error(errorMessage)
  }
}