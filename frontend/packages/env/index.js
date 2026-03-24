export const ENV_DEFAULTS = {
  SUPABASE_URL: "https://tyqhiomtpdsxlxtloscz.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cWhpb210cGRzeGx4dGxvc2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTE5OTYsImV4cCI6MjA4OTA2Nzk5Nn0.hmXWGbVL6JItg-hhNE_qG3GwVrfgz3GwjT8dqoYdiMU",
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cWhpb210cGRzeGx4dGxvc2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ5MTk5NiwiZXhwIjoyMDg5MDY3OTk2fQ.dHb1XVY9GilT__upowrztJeeJfug3W4g59soc6XoNUU",
  SUPABASE_DB_URL: "postgresql://postgres:Htnameh509%40h@db.tyqhiomtpdsxlxtloscz.supabase.co:5432/postgres?sslmode=require"
};

export const getEnv = (key) => process.env[key] || ENV_DEFAULTS[key];
