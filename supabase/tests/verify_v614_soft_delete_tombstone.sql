-- SoulFrame V6.1.4 - READ-ONLY manual tombstone confirmation.
-- Use only against the disposable test database after verify-cloud-soft-delete-v614 --live.
-- No record mutation or privileged client credentials are required in the SQL Editor.
select project_name, revision, (deleted_at is not null) as soft_deleted,
       (deleted_at is not null and revision = 3) as expected_tombstone
from public.soulframe_projects
where project_name like 'SF-V614-DELETE-%'
order by created_at desc
limit 10;
