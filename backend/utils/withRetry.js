export const withRetry = async (fn, maxRetries = 5, baseDelayMs = 1000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = error.status === 503 || error.status === 429 || 
                          (error.message && (error.message.includes('503') || error.message.includes('429') || error.message.includes('quota')));
      
      if (isRetryable) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`[Gemini API] ${error.status || 'Error'} encountered. Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // If it's not a 503 error, don't retry, just throw
        throw error;
      }
    }
  }
};
