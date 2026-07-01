-- =========================================================================
-- Row Level Security (RLS) - segunda barreira de isolamento por tenant
-- =========================================================================
-- Execute após `prisma migrate deploy`.
--
-- No runtime da app, antes de operar como um tenant, defina:
--   SELECT set_config('app.tenant_id', $1, true);
-- Para operações de plataforma (super admin), defina:
--   SELECT set_config('app.role_bypass_rls', 'on', true);
-- =========================================================================

-- 1. helpers
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_bypass_rls() RETURNS boolean AS $$
  SELECT current_setting('app.role_bypass_rls', true) = 'on'
$$ LANGUAGE sql STABLE;

-- 2. RLS na tabela `tenant` (usa `id`, não `tenantId`)
ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON tenant;
CREATE POLICY tenant_isolation ON tenant
  USING (app_bypass_rls() OR id = app_current_tenant())
  WITH CHECK (app_bypass_rls() OR id = app_current_tenant());

-- 3. RLS nas demais tabelas (usam `tenantId`)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'usuario','papel','fornecedor','cliente_final','veiculo',
    'oferta_veiculo','pacote_oferta','compra','venda','despesa','pagamento',
    'categoria_financeira','modelo_documento','documento','fluxo_assinatura',
    'integracao_config','email_log','mensagem_whatsapp','notificacao',
    'audit_log','assinatura_plataforma'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I;', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I '
      'USING (app_bypass_rls() OR "tenantId" = app_current_tenant()) '
      'WITH CHECK (app_bypass_rls() OR "tenantId" = app_current_tenant());',
      t
    );
  END LOOP;
END $$;
