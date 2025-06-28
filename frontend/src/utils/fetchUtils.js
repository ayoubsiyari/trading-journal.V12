import { useState } from 'react';

// Helper function to fetch data with error handling and authentication
export const fetchWithAuth = async (url, options = {}) => {
  try {
    // Get token from localStorage
    let token = localStorage.getItem('token');
    
    // Debug: Log token retrieval
    console.log(`[fetch] Preparing ${options.method || 'GET'} request to ${url}`);
    console.log('[fetch] Retrieved token from localStorage:', token ? `Token found (${token.length} chars)` : 'No token found');
    
    if (!token) {
      console.error('[fetch] No authentication token found in localStorage');
      // Clear any partial token that might exist
      localStorage.removeItem('token');
      throw new Error('No authentication token found. Please log in again.');
    }

    // Clean up the token (remove quotes if present)
    token = token.replace(/^"|"$/g, '');
    
    // Verify token format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('[fetch] Invalid token format - expected 3 parts, got', tokenParts.length);
      localStorage.removeItem('token');
      throw new Error('Invalid authentication token format. Please log in again.');
    }

    // Prepare headers with the token
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options.headers,
    });
    
    // Add Authorization header
    headers.set('Authorization', `Bearer ${token}`);

    // Log request details (with token redacted in logs)
    console.log(`[fetch] Sending ${options.method || 'GET'} request to ${url}`, {
      hasToken: !!token,
      tokenLength: token.length,
      headers: Object.fromEntries(
        Array.from(headers.entries()).map(([key, value]) => [
          key,
          key.toLowerCase() === 'authorization' ? 'Bearer [REDACTED]' : value
        ])
      ),
      options: { 
        ...options, 
        body: options.body ? '[REDACTED]' : undefined,
        headers: Object.fromEntries(
          Object.entries(options.headers || {}).map(([key, value]) => [
            key, 
            key.toLowerCase() === 'authorization' ? 'Bearer [REDACTED]' : value
          ])
        )
      }
    });

    const startTime = Date.now();
    let response;
    let responseText;
    let data;
    
    try {
      response = await fetch(url, { 
        ...options, 
        headers,
        credentials: 'include',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      const responseClone = response.clone(); // Clone response for logging
      responseText = await response.text();
      
      // Try to parse JSON, but don't fail if it's not JSON
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.warn('[fetch] Response is not valid JSON, treating as text');
        data = responseText;
      }
      
      const duration = Date.now() - startTime;
      
      // Log successful response
      console.log(`[fetch] Received ${response.status} response in ${duration}ms from ${url}`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data && typeof data === 'object' ? 
          (data.error ? { error: data.error } : '...') : 
          (responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText)
      });
    
      if (!response.ok) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          url,
          response: data || responseText,
          headers: Object.fromEntries(response.headers.entries())
        };
        
        console.error(`[fetch] Request failed with status ${response.status}`, errorDetails);
        
        if (response.status === 401) {
          // Clear invalid token
          console.error('[fetch] Authentication failed - clearing token');
          localStorage.removeItem('token');
          
          // If we're not on the login page, redirect there
          if (!window.location.pathname.includes('login')) {
            console.log('[fetch] Redirecting to login page');
            window.location.href = '/login';
          }
          
          throw new Error('Your session has expired. Please log in again.');
        }
        
        // Create a more detailed error message
        const errorMessage = data?.message || 
                             (data?.error || `Request failed with status ${response.status}`);
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = data || responseText;
        throw error;
      }
      
      // Log successful response details
      console.log(`[fetch] Request successful: ${options.method || 'GET'} ${url}`, {
        status: response.status,
        data: url.includes('stats') ? 
          { tradesCount: data?.trades?.length, hasTrades: !!data?.trades?.length } : 
          (data ? 'Response data available' : 'No data')
      });
    
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log the error with as much context as possible
      console.error(`[fetch] Error after ${duration}ms for ${options.method || 'GET'} ${url}:`, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          status: error.status,
          response: error.response
        },
        request: {
          url,
          method: options.method || 'GET',
          headers: headers ? Object.fromEntries(headers.entries()) : undefined,
          body: options.body
        }
      });
      
      // If we have a response with an error message, use that
      if (error.response) {
        throw error; // Re-throw the error with the response attached
      }
      
      // Otherwise create a more helpful error
      const errorMessage = error.message.includes('Failed to fetch') ? 
        'Unable to connect to the server. Please check your internet connection and try again.' :
        `Network error: ${error.message}`;
      
      const networkError = new Error(errorMessage);
      networkError.originalError = error;
      throw networkError;
    }
  } catch (error) {
    console.error('[fetch] Unexpected error in fetchWithAuth:', error);
    throw error;
  }
};

// Helper function to handle API errors
export const handleApiError = (error, setError) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    setError(`API Error: ${error.response.data.message || error.response.statusText}`);
  } else if (error.request) {
    // The request was made but no response was received
    setError('No response received from the server');
  } else {
    // Something happened in setting up the request that triggered an Error
    setError(`Error: ${error.message}`);
  }
};

// Helper function to check authentication status
export const checkAuth = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  try {
    const response = await fetchWithAuth('http://localhost:5000/api/auth/check');
    return response?.authenticated || false;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
};

// Helper function to refresh auth token
export const refreshToken = async () => {
  try {
    const response = await fetchWithAuth('http://localhost:5000/api/auth/refresh');
    if (response?.token) {
      localStorage.setItem('token', response.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};
