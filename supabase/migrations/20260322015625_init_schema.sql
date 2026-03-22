alter table "public"."account_website" add column "account_id" bigint not null;

alter table "public"."account_website" add constraint "account_website_id_fkey" FOREIGN KEY (id) REFERENCES public.account(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."account_website" validate constraint "account_website_id_fkey";


