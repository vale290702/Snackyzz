begin;
do $$
declare theme text; blocked boolean:=false;
begin
 if (select seasonal_theme from public.store_settings where id=1)<>'original' then raise exception 'Original theme not default'; end if;
 foreach theme in array array['original','valentines','easter','halloween','thanksgiving','christmas','new-year'] loop
  update public.store_settings set seasonal_theme=theme where id=1;
  if (select seasonal_theme from public.store_settings where id=1)<>theme then raise exception 'Theme not persisted'; end if;
 end loop;
 begin
  update public.store_settings set seasonal_theme='unknown' where id=1;
 exception when check_violation then blocked:=true; end;
 if not blocked then raise exception 'Invalid theme accepted'; end if;
 if has_table_privilege('anon','public.store_settings','update') or has_table_privilege('authenticated','public.store_settings','update') then raise exception 'Untrusted callers can publish themes'; end if;
end $$;
rollback;
