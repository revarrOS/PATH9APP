type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  env: Environment;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
}

const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_API_ENV;

  if (env === 'staging' || env === 'production') {
    return env;
  }

  return 'development';
};

export const environment: EnvironmentConfig = {
  env: getEnvironment(),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  isDevelopment: getEnvironment() === 'development',
  isStaging: getEnvironment() === 'staging',
  isProduction: getEnvironment() === 'production',
};

export const validateEnvironment = () => {
  if (!environment.supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
  }

  if (!environment.supabaseAnonKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
};
