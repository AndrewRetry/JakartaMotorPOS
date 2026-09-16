-- Staging area for CSV imports.
--
-- Rows are written here in batches, which can fail part-way without touching
-- live data. commit_import() then merges staging into the real table inside a
-- single transaction, so an import either lands completely or not at all.

create table if not exists public.import_staging (
  import_id  uuid  not null,
  table_name text  not null,
  row_data   jsonb not null
);

create index if not exists import_staging_lookup
  on public.import_staging (import_id, table_name);

alter table public.import_staging enable row level security;
-- No policies: only the backend's service_role key reaches this table.


create or replace function public.commit_import(
  p_import_id  uuid,
  p_table_name text,
  p_replace    boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_column_list  text;
  v_update_list  text;
  v_staged_rows  jsonb;
  v_rows_written integer;
begin
  -- Only these four tables may be imported. format(%I) quotes the identifier,
  -- but this whitelist is what actually limits which tables are reachable.
  if p_table_name not in ('barang', 'kategori', 'supplier', 'customer') then
    raise exception 'Table % cannot be imported', p_table_name;
  end if;

  -- Build the column list from the live table, so adding a column to the
  -- schema later needs no change here. created_at keeps its original value and
  -- updated_at is maintained by the existing trigger.
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into v_column_list
    from information_schema.columns
   where table_schema = 'public'
     and table_name = p_table_name
     and column_name not in ('created_at', 'updated_at');

  -- The SET clause for an id that already exists. id itself is excluded: it is
  -- what we matched on, so re-assigning it would be a no-op.
  select string_agg(format('%I = excluded.%I', column_name, column_name), ', '
                    order by ordinal_position)
    into v_update_list
    from information_schema.columns
   where table_schema = 'public'
     and table_name = p_table_name
     and column_name not in ('created_at', 'updated_at', 'id');

  select coalesce(jsonb_agg(row_data), '[]'::jsonb)
    into v_staged_rows
    from public.import_staging
   where import_id = p_import_id
     and table_name = p_table_name;

  if p_replace then
    execute format('delete from public.%I', p_table_name);
  end if;

  -- jsonb_populate_recordset casts the staged JSON into real typed rows using
  -- the table's own definition, so no column needs naming twice.
  execute format(
    'insert into public.%I (%s)
       select %s from jsonb_populate_recordset(null::public.%I, $1)
     on conflict (id) do update set %s',
    p_table_name, v_column_list, v_column_list, p_table_name, v_update_list
  ) using v_staged_rows;

  get diagnostics v_rows_written = row_count;

  -- Inserting explicit ids leaves the identity sequence behind, so the next
  -- insert from the UI would collide. Same fix as db/02_fix_sequences.sql,
  -- folded in here so it cannot be forgotten.
  execute format(
    'select setval(pg_get_serial_sequence(''public.%I'', ''id''), '
    '              coalesce(max(id), 1), true) from public.%I',
    p_table_name, p_table_name
  );

  delete from public.import_staging
   where import_id = p_import_id
     and table_name = p_table_name;

  return v_rows_written;
end;
$$;