import { describe, it, expect } from 'vitest';
import { GoogleGenerativeAI } from '@google/generative-ai';

describe('Google Gemini API Integration', () => {
  it('should validate Gemini API key is configured', () => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    expect(apiKey).toHaveLength(39); // Google API keys are typically 39 characters
  });

  it('should initialize Gemini client successfully', () => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Skipping Gemini client test - API key not configured');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    expect(genAI).toBeDefined();
  });

  it('should be able to get Gemini model', () => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Skipping Gemini model test - API key not configured');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    expect(model).toBeDefined();
  });
});
