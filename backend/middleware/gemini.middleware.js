// Check that a valid Gemini API key is present in the request
export const checkGeminiKey = (req, res, next) => {
  const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(400).json({
      error: 'Gemini API Key is missing. Please provide it in your profile settings or set it in the server .env file.'
    });
  }

  req.geminiApiKey = apiKey; // Attach key to request for controllers to use
  next();
};
