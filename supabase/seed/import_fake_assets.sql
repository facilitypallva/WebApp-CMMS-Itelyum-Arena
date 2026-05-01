-- Import helper for supabase/seed/fake_assets_200.csv.
-- 1. Run the create-table block in Supabase SQL Editor.
-- 2. Import fake_assets_200.csv into public.asset_import_staging from the Table Editor.
-- 3. Run the validation query.
-- 4. Run the final DO block to insert only rows with a matching location.

create table if not exists public.asset_import_staging (
  name text not null,
  category text not null,
  brand text,
  model text,
  serial_number text not null,
  location_code text not null,
  installation_date date,
  last_verification date,
  verification_frequency_code text,
  verification_frequency_days integer not null,
  verification_frequency_months integer not null
);

-- Optional, before importing the CSV again:
-- truncate table public.asset_import_staging;

-- Validation after CSV import: this must return zero rows.
select s.location_code, count(*) as missing_rows
from public.asset_import_staging s
left join public.locations l
  on upper(replace(l.name, '00_', '')) = upper(s.location_code)
where l.id is null
group by s.location_code
order by s.location_code;

-- Insert into assets. Existing serial numbers are skipped, so the script is safe to rerun.
do $$
declare
  documents_type text;
  documents_udt text;
  insert_sql text;
begin
  select data_type, udt_name
  into documents_type, documents_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'assets'
    and column_name = 'documents';

  insert_sql := $sql$
    insert into public.assets (
      location_id,
      name,
      category,
      brand,
      model,
      serial_number,
      installation_date,
      last_verification,
      verification_frequency_code,
      verification_frequency_days,
      verification_frequency_months
      %DOCUMENTS_COLUMN%
    )
    select
      l.id,
      s.name,
      s.category,
      nullif(s.brand, ''),
      nullif(s.model, ''),
      s.serial_number,
      s.installation_date,
      s.last_verification,
      nullif(s.verification_frequency_code, ''),
      s.verification_frequency_days,
      s.verification_frequency_months
      %DOCUMENTS_VALUE%
    from public.asset_import_staging s
    join public.locations l
      on upper(replace(l.name, '00_', '')) = upper(s.location_code)
    where not exists (
      select 1
      from public.assets a
      where a.serial_number = s.serial_number
    );
  $sql$;

  if documents_type is null then
    insert_sql := replace(insert_sql, '%DOCUMENTS_COLUMN%', '');
    insert_sql := replace(insert_sql, '%DOCUMENTS_VALUE%', '');
  elsif documents_type = 'ARRAY' then
    insert_sql := replace(insert_sql, '%DOCUMENTS_COLUMN%', ', documents');
    insert_sql := replace(insert_sql, '%DOCUMENTS_VALUE%', ', array[]::text[]');
  elsif documents_type = 'json' then
    insert_sql := replace(insert_sql, '%DOCUMENTS_COLUMN%', ', documents');
    insert_sql := replace(insert_sql, '%DOCUMENTS_VALUE%', ', ''[]''::json');
  else
    insert_sql := replace(insert_sql, '%DOCUMENTS_COLUMN%', ', documents');
    insert_sql := replace(insert_sql, '%DOCUMENTS_VALUE%', ', ''[]''::jsonb');
  end if;

  execute insert_sql;
end $$;

-- Quick check.
select count(*) as fake_assets_loaded
from public.assets
where serial_number ~ '^[A-Z]{3,4}-[A-Z0-9]+-[0-9]{3}$';
