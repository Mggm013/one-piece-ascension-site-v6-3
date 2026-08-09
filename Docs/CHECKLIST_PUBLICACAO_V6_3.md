# Checklist de publicação v6.3

1. Execute `Supabase/schema.sql` no projeto Supabase.
2. Preencha `Js/supabase-config.js` apenas com Project URL + publishable/anon key.
3. Cadastre sua própria conta e confirme o e-mail.
4. No SQL Editor, promova somente essa primeira conta:
   ```sql
   update public.profiles set role='owner' where username='SEU_USUARIO';
   ```
5. Saia e entre novamente.
6. Abra `Auditoria ADM → Acesso da Equipe` e crie o Código da Equipe.
7. Faça um teste com uma conta comum: deve ter 2 slots, sem aba ADM.
8. Faça um teste com outra conta + Código da Equipe: deve continuar com 2 slots e ganhar a aba ADM.
9. Teste 5 códigos errados: a conta deve ser temporariamente bloqueada de novas tentativas.
10. Troque o código no Owner: ADM já existente deve continuar ADM e código antigo deve parar de ativar novas contas.
11. Remova um ADM pelo Owner: a conta deve voltar a Player sem perder personagens/histórico.
12. Só depois publique no GitHub Pages.

Nunca publique `service_role`, senha do banco ou o Código da Equipe.
