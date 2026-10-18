alter table public.store_settings add column seasonal_theme text not null default 'original'
 check(seasonal_theme in ('original','valentines','easter','halloween','thanksgiving','christmas','new-year'));
