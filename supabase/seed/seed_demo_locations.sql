-- Dev-only helper for fake asset imports.
-- Creates the demo locations used by fake_assets_200.csv if they do not already exist.

with created_facility as (
  insert into public.facilities (name, address)
  select 'Itelyum Arena', 'Varese'
  where not exists (
    select 1
    from public.facilities
    where name = 'Itelyum Arena'
  )
  returning id
),
target_facility as (
  select id from created_facility
  union all
  select id
  from public.facilities
  where name = 'Itelyum Arena'
  limit 1
),
demo_locations(code, label) as (
  values
    ('CR2', 'Corridoio 2'),
    ('CR3', 'Corridoio 3'),
    ('CR4', 'Corridoio 4'),
    ('CR5', 'Corridoio 5'),
    ('GD1', 'Guardiola'),
    ('IF1', 'Infermeria 1'),
    ('IF2', 'Infermeria 2'),
    ('PL1', 'Palestra 1'),
    ('SC1', 'Scala 1'),
    ('SLV1', 'Sala video 1'),
    ('SP1', 'Spogliatoio 1'),
    ('SP2', 'Spogliatoio 2'),
    ('SP3', 'Spogliatoio 3'),
    ('SP4', 'Spogliatoio 4'),
    ('SP5', 'Spogliatoio 5'),
    ('SP6', 'Spogliatoio 6'),
    ('UF1', 'Ufficio 1'),
    ('UF2', 'Ufficio 2'),
    ('UF3', 'Ufficio 3'),
    ('UF4', 'Ufficio 4'),
    ('UF5', 'Ufficio 5'),
    ('UF6', 'Ufficio 6'),
    ('WC1', 'Bagno 1'),
    ('WC2', 'Bagno 2'),
    ('WC3', 'Bagno 3'),
    ('WC4', 'Bagno 4'),
    ('WC5', 'Bagno 5'),
    ('WC6', 'Bagno 6'),
    ('WC7', 'Bagno 7')
)
insert into public.locations (
  facility_id,
  parent_id,
  name,
  description,
  qr_code_id
)
select
  (select id from target_facility),
  null,
  '00_' || d.code,
  d.label,
  'DEMO-' || d.code
from demo_locations d
where not exists (
  select 1
  from public.locations l
  where upper(replace(l.name, '00_', '')) = d.code
);

-- Check the demo locations now available.
select
  upper(replace(name, '00_', '')) as location_code,
  name,
  description
from public.locations
where upper(replace(name, '00_', '')) in (
  'CR2', 'CR3', 'CR4', 'CR5', 'GD1', 'IF1', 'IF2', 'PL1', 'SC1', 'SLV1',
  'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP6', 'UF1', 'UF2', 'UF3', 'UF4',
  'UF5', 'UF6', 'WC1', 'WC2', 'WC3', 'WC4', 'WC5', 'WC6', 'WC7'
)
order by location_code;
