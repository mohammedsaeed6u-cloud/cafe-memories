/* Regenerate with `pnpm db:types` after changing migrations.
 * Uses an isolated PGlite PostgreSQL engine: no production credentials needed. */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const db = new PGlite();
const bootstrap = `
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, email_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT null::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT null::text $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid, bucket_id text);
`;

const mapped = (type, enumNames) => {
  if (enumNames.has(type)) return `Database['public']['Enums']['${type}']`;
  if (['bool', 'boolean'].includes(type)) return 'boolean';
  if (['int2', 'int4', 'int8', 'integer', 'bigint', 'smallint', 'numeric', 'float4', 'float8', 'double precision'].includes(type)) return 'number';
  if (['json', 'jsonb'].includes(type)) return 'Json';
  if (type.startsWith('_')) return `${mapped(type.slice(1), enumNames)}[]`;
  return 'string'; // UUIDs, dates and text are serialized strings over PostgREST.
};

try {
  await db.exec(bootstrap);
  const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
  for (const filename of readdirSync(migrationsDir).filter((name) => /^\d{5}_.+\.sql$/.test(name)).sort()) {
    await db.exec(readFileSync(new URL(filename, migrationsDir), 'utf8'));
  }
  const columns = (await db.query(`SELECT table_name, column_name, udt_name, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema='public' AND table_name NOT LIKE 'pg_%'
    ORDER BY table_name, ordinal_position`)).rows;
  const enums = (await db.query(`SELECT t.typname name, array_agg(e.enumlabel ORDER BY e.enumsortorder) vals
    FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public' GROUP BY t.typname ORDER BY t.typname`)).rows;
  const relationships = (await db.query(`SELECT c.conname name, cl.relname table_name, ref.relname referenced_table,
    ARRAY(SELECT attname FROM pg_attribute WHERE attrelid=c.conrelid AND attnum=ANY(c.conkey)
      ORDER BY array_position(c.conkey,attnum)) columns,
    ARRAY(SELECT attname FROM pg_attribute WHERE attrelid=c.confrelid AND attnum=ANY(c.confkey)
      ORDER BY array_position(c.confkey,attnum)) referenced_columns,
    EXISTS(SELECT 1 FROM pg_constraint u WHERE u.conrelid=c.conrelid AND u.contype IN ('p','u')
      AND u.conkey=c.conkey) one_to_one
    FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid
      JOIN pg_namespace ns ON ns.oid=cl.relnamespace JOIN pg_class ref ON ref.oid=c.confrelid
    WHERE c.contype='f' AND ns.nspname='public' ORDER BY cl.relname,c.conname`)).rows;
  const functions = (await db.query(`SELECT p.proname name, pg_get_function_identity_arguments(p.oid) args,
      pg_get_function_result(p.oid) result
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prorettype <> 'pg_catalog.trigger'::regtype
    ORDER BY p.proname`)).rows;
  const enumNames = new Set(enums.map(({ name }) => name));
  const tables = Map.groupBy(columns, ({ table_name }) => table_name);
  const lines = [
    '// AUTO-GENERATED from supabase/migrations/*.sql by `pnpm db:types`.',
    '// Regenerate after changing a migration; do not hand-edit this file.',
    'export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];',
    'export type Database = {', '  public: {', '    Tables: {',
  ];
  for (const [table, fields] of tables) {
    lines.push(`      ${table}: {`, '        Row: {');
    for (const field of fields) lines.push(`          ${field.column_name}: ${mapped(field.udt_name, enumNames)}${field.is_nullable === 'YES' ? ' | null' : ''};`);
    lines.push('        };', '        Insert: {');
    for (const field of fields) {
      const optional = field.is_nullable === 'YES' || field.column_default != null;
      lines.push(`          ${field.column_name}${optional ? '?' : ''}: ${mapped(field.udt_name, enumNames)}${field.is_nullable === 'YES' ? ' | null' : ''};`);
    }
    lines.push('        };', '        Update: {');
    for (const field of fields) lines.push(`          ${field.column_name}?: ${mapped(field.udt_name, enumNames)}${field.is_nullable === 'YES' ? ' | null' : ''};`);
    lines.push('        };', '        Relationships: [');
    for (const rel of relationships.filter((item) => item.table_name === table)) {
      const array = (value) => `[${value.map((name) => `'${name}'`).join(', ')}]`;
      lines.push(`          { foreignKeyName: '${rel.name}'; columns: ${array(rel.columns)}; isOneToOne: ${rel.one_to_one}; referencedRelation: '${rel.referenced_table}'; referencedColumns: ${array(rel.referenced_columns)} },`);
    }
    lines.push('        ];', '      };');
  }
  lines.push('    };', '    Views: { [_ in never]: never };', '    Functions: {');
  for (const fn of functions) {
    const args = fn.args ? fn.args.split(', ').map((arg) => arg.split(' ')) : [];
    let result;
    if (fn.result.startsWith('TABLE(')) {
      const resultFields = fn.result.slice(6, -1).split(', ').map((field) => field.split(' '));
      result = `{ ${resultFields.map(([name, type]) => `${name}: ${mapped(type, enumNames)}`).join('; ')} }[]`;
    } else if (fn.result === 'jsonb') result = 'Json';
    else if (fn.result === 'void') result = 'undefined';
    else result = mapped(fn.result.replace(/\[\]$/, ''), enumNames) + (fn.result.endsWith('[]') ? '[]' : '');
    // PL/pgSQL arguments may legally receive NULL; the function itself enforces its domain rules.
    const argsType = args.length
      ? `{ ${args.map(([name, type]) => `${name}: ${mapped(type, enumNames)} | null`).join('; ')} }`
      : 'Record<string, never>';
    lines.push(`      ${fn.name}: { Args: ${argsType}; Returns: ${result} };`);
  }
  lines.push('    };', '    Enums: {');
  for (const { name, vals } of enums) lines.push(`      ${name}: ${vals.map((value) => `'${value}'`).join(' | ')};`);
  lines.push('    };', '    CompositeTypes: { [_ in never]: never };', '  };', '};', '');
  writeFileSync(new URL('../src/types/database.ts', import.meta.url), lines.join('\n'));
  console.log(`Generated ${tables.size} public tables, ${functions.length} RPCs and ${enums.length} enums`);
} finally { await db.close(); }
