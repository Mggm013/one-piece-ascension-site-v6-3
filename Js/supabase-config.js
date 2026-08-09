/**
 * ONE PIECE ASCENSION — conexão Supabase
 *
 * GitHub Pages não possui variáveis de ambiente no navegador. Por isso a URL e a
 * chave pública ficam neste arquivo. A publishable/anon key PODE ficar pública;
 * a segurança real está nas políticas RLS do banco.
 *
 * NUNCA coloque service_role aqui.
 */
window.OPA_SUPABASE_CONFIG = {
  url: 'COLE_AQUI_SUA_PROJECT_URL',
  anonKey: 'COLE_AQUI_SUA_PUBLISHABLE_OU_ANON_KEY'
};
