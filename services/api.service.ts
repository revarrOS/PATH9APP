const getApiUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
  }
  return supabaseUrl;
};

export const apiService = {
  async health() {
    const apiUrl = `${getApiUrl()}/functions/v1/health`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  },

  async authenticatedRequest(
    endpoint: string,
    options: RequestInit & { token: string }
  ) {
    const { token, ...fetchOptions } = options;
    const apiUrl = `${getApiUrl()}/functions/v1/${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    const response = await fetch(apiUrl, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  },
};
