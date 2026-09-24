-- Run once in the Supabase SQL editor. No public database access is granted.
begin;
create table if not exists public.reviews (
  id uuid primary key,
  outlet_id text not null check (length(outlet_id) between 1 and 80),
  brand text not null,
  outlet_name text not null,
  overall_rating smallint not null check (overall_rating between 1 and 5),
  feedback text not null default '' check (length(feedback) <= 3000),
  categories text[] not null default '{}' check (cardinality(categories) <= 6),
  customer_name text not null default '' check (length(customer_name) <= 100),
  customer_contact text not null default '' check (length(customer_contact) <= 180),
  created_at timestamptz not null default now(),
  client_hash text not null
);
create index if not exists reviews_outlet_date on public.reviews (outlet_id,created_at desc);
create index if not exists reviews_brand_date on public.reviews (brand,created_at desc);
create index if not exists reviews_date on public.reviews (created_at desc,id);
create index if not exists reviews_rating_date on public.reviews (overall_rating,created_at desc);
create index if not exists reviews_categories on public.reviews using gin (categories);
alter table public.reviews enable row level security;
revoke all on public.reviews from public,anon,authenticated;
grant select,insert on public.reviews to service_role;

create table if not exists public.request_limits (
  key text primary key, hits integer not null, resets_at timestamptz not null
);
alter table public.request_limits enable row level security;
revoke all on public.request_limits from public,anon,authenticated;
grant select,insert,update,delete on public.request_limits to service_role;

create or replace function public.take_rate_limit(p_key text,p_limit integer,p_window integer)
returns boolean language plpgsql security invoker set search_path = public,pg_temp as $$
declare count_now integer;
begin
  if p_limit < 1 or p_window < 1 then return false; end if;
  insert into public.request_limits as limits(key,hits,resets_at)
  values(p_key,1,now()+make_interval(secs=>p_window))
  on conflict(key) do update set
    hits=case when limits.resets_at <= now() then 1 else limits.hits+1 end,
    resets_at=case when limits.resets_at <= now() then now()+make_interval(secs=>p_window) else limits.resets_at end
  returning hits into count_now;
  return count_now <= p_limit;
end $$;
revoke all on function public.take_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.take_rate_limit(text,integer,integer) to service_role;

create or replace function public.submit_review(
  p_id uuid,p_outlet_id text,p_brand text,p_outlet_name text,p_rating integer,
  p_feedback text,p_categories text[],p_customer_name text,p_customer_contact text,p_client_hash text
) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare existing public.reviews%rowtype;
begin
  -- Serialize retries of the same submission, including concurrent requests.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into existing from public.reviews where id=p_id;
  if found then
    if existing.outlet_id=p_outlet_id and existing.overall_rating=p_rating
      and existing.feedback=p_feedback and existing.categories=p_categories
      and existing.customer_name=p_customer_name and existing.customer_contact=p_customer_contact
      and existing.client_hash=p_client_hash then return jsonb_build_object('status','exists'); end if;
    return jsonb_build_object('status','conflict');
  end if;
  if not public.take_rate_limit('reviews:'||p_client_hash,120,3600) then
    return jsonb_build_object('status','limited');
  end if;
  insert into public.reviews(id,outlet_id,brand,outlet_name,overall_rating,feedback,categories,customer_name,customer_contact,client_hash)
    values(p_id,p_outlet_id,p_brand,p_outlet_name,p_rating,p_feedback,p_categories,p_customer_name,p_customer_contact,p_client_hash);
  return jsonb_build_object('status','saved');
end $$;
revoke all on function public.submit_review(uuid,text,text,text,integer,text,text[],text,text,text) from public,anon,authenticated;
grant execute on function public.submit_review(uuid,text,text,text,integer,text,text[],text,text,text) to service_role;

create or replace function public.review_dashboard(
  p_brand text default null,p_outlet text default null,p_rating integer default null,p_category text default null,
  p_from timestamptz default null,p_to timestamptz default null,p_page integer default 1
) returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  with filtered as materialized (
    select * from public.reviews where
      (p_brand is null or brand=p_brand) and (p_outlet is null or outlet_id=p_outlet)
      and (p_rating is null or overall_rating=p_rating) and (p_category is null or p_category=any(categories))
      and (p_from is null or created_at>=p_from) and (p_to is null or created_at<p_to)
  ), summary as (
    select count(*) as total,round(avg(overall_rating),2) as average,
      count(*) filter(where overall_rating=5) as five_star,
      count(*) filter(where overall_rating>=4) as positive,
      count(*) filter(where overall_rating<=3) as needs_attention from filtered
  ), distribution as (
    select overall_rating as rating,count(*) as count from filtered group by overall_rating order by overall_rating desc
  ), outlet_summary as (
    select outlet_id as "outletId",max(outlet_name) as "outletName",max(brand) as brand,count(*) as total,
      round(avg(overall_rating),2) as average from filtered group by outlet_id order by outlet_id
  ), trend as (
    select to_char(date_trunc(case when p_from is null or coalesce(p_to,now())-p_from>interval '90 days' then 'month' else 'day' end,
      created_at at time zone 'Asia/Kuala_Lumpur'),'YYYY-MM-DD') as date,
      count(*) as count,round(avg(overall_rating),2) as average from filtered group by 1 order by 1
  ), page as (
    select id,outlet_id,brand,outlet_name,overall_rating,feedback,categories,customer_name,customer_contact,created_at
    from filtered order by created_at desc,id desc limit 25 offset ((greatest(1,least(p_page,100000))-1)*25)
  ) select jsonb_build_object(
    'total',summary.total,'average',summary.average,'fiveStar',summary.five_star,
    'positive',summary.positive,'needsAttention',summary.needs_attention,
    'distribution',coalesce((select jsonb_agg(distribution) from distribution),'[]'::jsonb),
    'outlets',coalesce((select jsonb_agg(outlet_summary) from outlet_summary),'[]'::jsonb),
    'trend',coalesce((select jsonb_agg(trend) from trend),'[]'::jsonb),
    'reviews',coalesce((select jsonb_agg(page) from page),'[]'::jsonb)
  ) from summary;
$$;
revoke all on function public.review_dashboard(text,text,integer,text,timestamptz,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.review_dashboard(text,text,integer,text,timestamptz,timestamptz,integer) to service_role;
commit;
