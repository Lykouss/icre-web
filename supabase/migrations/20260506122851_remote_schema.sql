create extension if not exists "pg_cron" with schema "pg_catalog";

drop extension if exists "pg_net";

create type "public"."app_role" as enum ('MEMBER', 'LEADER', 'FINANCE_ADMIN', 'CHURCH_ADMIN', 'SYSADMIN');

create type "public"."event_status" as enum ('rascunho', 'publicado', 'encerrado', 'cancelado');

create type "public"."event_type" as enum ('culto', 'especial');

create type "public"."payment_method" as enum ('pix', 'cartao', 'dinheiro', 'cortesia', 'asaas_pix', 'asaas_boleto');

create type "public"."payment_status" as enum ('gratuito', 'pendente', 'pago', 'reembolsado', 'expirado');

create type "public"."registration_status" as enum ('confirmado', 'cancelado', 'pendente_pagamento');

create type "public"."schedule_role" as enum ('louvor', 'pregador', 'recepcao', 'tecnica');

create type "public"."site_block_type" as enum ('hero', 'about', 'mission', 'events', 'contact', 'custom_text', 'banner', 'youtube', 'pastors', 'cells', 'events_preview');

create type "public"."transaction_status" as enum ('pendente', 'pago', 'cancelado');

create type "public"."transaction_type" as enum ('entrada', 'saida');

create type "public"."user_role" as enum ('admin', 'tesoureiro', 'lider', 'membro');


  create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "entity_name" text not null,
    "entity_id" uuid,
    "action" text not null,
    "actor_id" uuid not null,
    "actor_name" text not null,
    "old_data" jsonb,
    "new_data" jsonb,
    "created_at" timestamp with time zone default now(),
    "actor_email" text,
    "actor_role" text
      );


alter table "public"."audit_logs" enable row level security;


  create table "public"."auth_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "action" text not null,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."auth_logs" enable row level security;


  create table "public"."auth_rate_limits" (
    "id" uuid not null default gen_random_uuid(),
    "identifier" text not null,
    "action" text not null,
    "attempted_at" timestamp with time zone not null default now()
      );


alter table "public"."auth_rate_limits" enable row level security;


  create table "public"."cells" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "meeting_days" text,
    "meeting_time" text,
    "meeting_type" text not null default 'presencial'::text,
    "neighborhood" text,
    "is_public" boolean not null default true,
    "is_active" boolean not null default true,
    "sort_order" integer not null default 0,
    "address" text,
    "contact_phone" text,
    "contact_whatsapp" text,
    "contact_email" text,
    "image_url" text,
    "leader_photo_url" text,
    "leader1_id" uuid,
    "leader2_id" uuid,
    "instagram_url" text
      );


alter table "public"."cells" enable row level security;


  create table "public"."contact_messages" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "phone" text,
    "email" text,
    "message" text not null,
    "read" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."contact_messages" enable row level security;


  create table "public"."event_attendance" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "member_id" uuid,
    "name" text not null,
    "checked_in_at" timestamp with time zone not null default now()
      );


alter table "public"."event_attendance" enable row level security;


  create table "public"."event_registrations" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "member_id" uuid,
    "name" text not null,
    "phone" text,
    "status" public.registration_status not null default 'confirmado'::public.registration_status,
    "created_at" timestamp with time zone not null default now(),
    "payment_status" public.payment_status not null default 'gratuito'::public.payment_status,
    "payment_method" public.payment_method,
    "payment_amount" numeric(10,2),
    "payment_ref" text,
    "paid_at" timestamp with time zone,
    "email" text,
    "asaas_payment_id" text,
    "asaas_invoice_url" text,
    "receipt_url" text
      );


alter table "public"."event_registrations" enable row level security;


  create table "public"."event_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "event_id" uuid not null,
    "role" public.schedule_role not null,
    "member_id" uuid,
    "notes" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."event_schedules" enable row level security;


  create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "date" date,
    "location" text default 'Templo Sede'::text,
    "banner_url" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "type" public.event_type not null default 'especial'::public.event_type,
    "time" time without time zone,
    "is_recurring" boolean not null default false,
    "recurrence_day" smallint,
    "capacity" integer,
    "is_public" boolean not null default false,
    "created_by" uuid,
    "status" public.event_status not null default 'rascunho'::public.event_status,
    "publish_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "ticket_price" numeric(10,2) default 0.00,
    "requires_registration" boolean not null default false,
    "requires_payment" boolean not null default false,
    "recurrence_rules" jsonb,
    "cancelled_dates" jsonb default '[]'::jsonb
      );


alter table "public"."events" enable row level security;


  create table "public"."feature_flags" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "slug" character varying(50) not null,
    "name" character varying(100) not null,
    "is_active" boolean default false,
    "description" text,
    "updated_at" timestamp with time zone default now(),
    "allowed_roles" text[] default '{}'::text[],
    "allowed_users" uuid[] default '{}'::uuid[],
    "status" text default 'normal'::text,
    "maintenance_scheduled_at" timestamp with time zone
      );


alter table "public"."feature_flags" enable row level security;


  create table "public"."finance_logs" (
    "id" uuid not null default gen_random_uuid(),
    "action" text not null,
    "actor_id" uuid,
    "actor_name" text not null,
    "actor_role" text not null,
    "entity_name" text not null,
    "entity_id" uuid,
    "old_data" jsonb,
    "new_data" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."finance_logs" enable row level security;


  create table "public"."financial_closings" (
    "id" uuid not null default gen_random_uuid(),
    "month" integer not null,
    "year" integer not null,
    "closed_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "closed_by" uuid,
    "balance_at_closing" numeric(12,2) default 0
      );


alter table "public"."financial_closings" enable row level security;


  create table "public"."financial_recurring" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "amount" numeric(10,2) not null,
    "category" text not null,
    "type" public.transaction_type not null,
    "day_of_month" integer not null,
    "active" boolean default true,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid
      );


alter table "public"."financial_recurring" enable row level security;


  create table "public"."financial_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "amount" numeric(10,2) not null,
    "type" public.transaction_type not null,
    "category" text not null,
    "description" text,
    "status" public.transaction_status default 'pendente'::public.transaction_status,
    "payment_id" text,
    "created_by" uuid,
    "date" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "receipt_url" text,
    "tags" text[] default '{}'::text[],
    "member_id" uuid
      );


alter table "public"."financial_transactions" enable row level security;


  create table "public"."leaders" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "phone" text,
    "photo_url" text,
    "bio" text,
    "is_active" boolean not null default true,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "instagram_url" text
      );


alter table "public"."leaders" enable row level security;


  create table "public"."media_assets" (
    "id" uuid not null default gen_random_uuid(),
    "file_name" text not null,
    "category" text not null,
    "url" text not null,
    "storage_path" text not null,
    "size_bytes" bigint not null,
    "mime_type" text not null,
    "uploaded_by" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."media_assets" enable row level security;


  create table "public"."members" (
    "id" uuid not null default gen_random_uuid(),
    "full_name" text not null,
    "email" text,
    "phone" text,
    "birth_date" date,
    "gender" text,
    "marital_status" text,
    "status" text default 'Visitante'::text,
    "baptism_date" date,
    "address" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "cell_id" uuid,
    "encounter_completed" boolean default false,
    "discipleship_completed" boolean default false,
    "ministries" text[] default '{}'::text[],
    "user_id" uuid,
    "system_role" text default 'Membro'::text
      );


alter table "public"."members" enable row level security;


  create table "public"."pastors" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "role" text not null default 'Pastor'::text,
    "bio" text,
    "photo_url" text,
    "sort_order" integer not null default 0,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "instagram_url" text
      );


alter table "public"."pastors" enable row level security;


  create table "public"."pin_attempts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "attempted_at" timestamp with time zone not null default now(),
    "success" boolean not null default false
      );


alter table "public"."pin_attempts" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "full_name" character varying(255) not null,
    "username" character varying(50),
    "phone" character varying(20),
    "address" text,
    "cell_group" character varying(100),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "security_pin_hash" text,
    "terms_accepted_at" timestamp with time zone,
    "admin_terms_accepted_at" timestamp with time zone,
    "onboarding_step" text not null default 'done'::text,
    "photo_url" text,
    "birth_date" date,
    "cpf" text,
    "church_role" text,
    "admin_profile_completed_at" timestamp with time zone,
    "is_suspended" boolean default false,
    "suspended_until" timestamp with time zone,
    "suspension_reason" text,
    "suspended_by_name" text
      );


alter table "public"."profiles" enable row level security;


  create table "public"."rate_limits" (
    "key" text not null,
    "count" integer default 1,
    "last_request" timestamp with time zone default timezone('utc'::text, now())
      );


alter table "public"."rate_limits" enable row level security;


  create table "public"."site_blocks" (
    "id" uuid not null default gen_random_uuid(),
    "type" public.site_block_type not null,
    "order_idx" integer not null default 0,
    "is_active" boolean not null default true,
    "content" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "published_content" jsonb,
    "updated_by" uuid
      );


alter table "public"."site_blocks" enable row level security;


  create table "public"."site_media" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "url" text not null,
    "size_bytes" bigint not null,
    "mime_type" text not null,
    "uploaded_by" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."site_media" enable row level security;


  create table "public"."transaction_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "type" public.transaction_type not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."transaction_categories" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "type" public.transaction_type not null,
    "category_id" uuid not null,
    "description" text,
    "amount" numeric(10,2) not null,
    "member_id" uuid,
    "date" date not null default CURRENT_DATE,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."transactions" enable row level security;


  create table "public"."upload_settings" (
    "id" text not null,
    "global_enabled" boolean not null default true,
    "avatars_enabled" boolean not null default true,
    "avatars_max_size_kb" integer not null default 3072,
    "pastors_enabled" boolean not null default true,
    "pastors_max_size_kb" integer not null default 5120,
    "cells_enabled" boolean not null default true,
    "cells_max_size_kb" integer not null default 5120,
    "banners_enabled" boolean not null default true,
    "banners_max_size_kb" integer not null default 10240,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."upload_settings" enable row level security;


  create table "public"."user_feature_access" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "flag_slug" text not null,
    "viewed_at" timestamp with time zone default timezone('utc'::text, now())
      );


alter table "public"."user_feature_access" enable row level security;


  create table "public"."user_roles" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "role" public.app_role not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."user_roles" enable row level security;

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX auth_logs_pkey ON public.auth_logs USING btree (id);

CREATE UNIQUE INDEX auth_rate_limits_pkey ON public.auth_rate_limits USING btree (id);

CREATE UNIQUE INDEX cells_pkey ON public.cells USING btree (id);

CREATE UNIQUE INDEX contact_messages_pkey ON public.contact_messages USING btree (id);

CREATE UNIQUE INDEX event_attendance_pkey ON public.event_attendance USING btree (id);

CREATE UNIQUE INDEX event_registrations_pkey ON public.event_registrations USING btree (id);

CREATE UNIQUE INDEX event_schedules_pkey ON public.event_schedules USING btree (id);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE UNIQUE INDEX feature_flags_pkey ON public.feature_flags USING btree (id);

CREATE UNIQUE INDEX feature_flags_slug_key ON public.feature_flags USING btree (slug);

CREATE UNIQUE INDEX finance_logs_pkey ON public.finance_logs USING btree (id);

CREATE UNIQUE INDEX financial_closings_month_year_key ON public.financial_closings USING btree (month, year);

CREATE UNIQUE INDEX financial_closings_month_year_unique ON public.financial_closings USING btree (month, year);

CREATE UNIQUE INDEX financial_closings_pkey ON public.financial_closings USING btree (id);

CREATE UNIQUE INDEX financial_recurring_pkey ON public.financial_recurring USING btree (id);

CREATE UNIQUE INDEX financial_transactions_pkey ON public.financial_transactions USING btree (id);

CREATE INDEX idx_auth_rate_limits_identifier ON public.auth_rate_limits USING btree (identifier, action, attempted_at);

CREATE INDEX idx_event_registrations_asaas_payment_id ON public.event_registrations USING btree (asaas_payment_id) WHERE (asaas_payment_id IS NOT NULL);

CREATE INDEX idx_event_registrations_email ON public.event_registrations USING btree (email) WHERE (email IS NOT NULL);

CREATE INDEX idx_events_public_published ON public.events USING btree (date) WHERE ((is_public = true) AND (status = 'publicado'::public.event_status));

CREATE INDEX idx_site_media_size ON public.site_media USING btree (size_bytes);

CREATE UNIQUE INDEX leaders_pkey ON public.leaders USING btree (id);

CREATE UNIQUE INDEX media_assets_pkey ON public.media_assets USING btree (id);

CREATE UNIQUE INDEX members_pkey ON public.members USING btree (id);

CREATE UNIQUE INDEX members_user_id_key ON public.members USING btree (user_id);

CREATE UNIQUE INDEX pastors_pkey ON public.pastors USING btree (id);

CREATE UNIQUE INDEX pin_attempts_pkey ON public.pin_attempts USING btree (id);

CREATE INDEX pin_attempts_user_time ON public.pin_attempts USING btree (user_id, attempted_at DESC);

CREATE UNIQUE INDEX profiles_cpf_key ON public.profiles USING btree (cpf);

CREATE UNIQUE INDEX profiles_cpf_unique ON public.profiles USING btree (cpf) WHERE (cpf IS NOT NULL);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX rate_limits_pkey ON public.rate_limits USING btree (key);

CREATE UNIQUE INDEX site_blocks_pkey ON public.site_blocks USING btree (id);

CREATE UNIQUE INDEX site_media_pkey ON public.site_media USING btree (id);

CREATE UNIQUE INDEX transaction_categories_pkey ON public.transaction_categories USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

CREATE UNIQUE INDEX upload_settings_pkey ON public.upload_settings USING btree (id);

CREATE UNIQUE INDEX user_feature_access_pkey ON public.user_feature_access USING btree (id);

CREATE UNIQUE INDEX user_feature_access_user_id_flag_slug_key ON public.user_feature_access USING btree (user_id, flag_slug);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."auth_logs" add constraint "auth_logs_pkey" PRIMARY KEY using index "auth_logs_pkey";

alter table "public"."auth_rate_limits" add constraint "auth_rate_limits_pkey" PRIMARY KEY using index "auth_rate_limits_pkey";

alter table "public"."cells" add constraint "cells_pkey" PRIMARY KEY using index "cells_pkey";

alter table "public"."contact_messages" add constraint "contact_messages_pkey" PRIMARY KEY using index "contact_messages_pkey";

alter table "public"."event_attendance" add constraint "event_attendance_pkey" PRIMARY KEY using index "event_attendance_pkey";

alter table "public"."event_registrations" add constraint "event_registrations_pkey" PRIMARY KEY using index "event_registrations_pkey";

alter table "public"."event_schedules" add constraint "event_schedules_pkey" PRIMARY KEY using index "event_schedules_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."feature_flags" add constraint "feature_flags_pkey" PRIMARY KEY using index "feature_flags_pkey";

alter table "public"."finance_logs" add constraint "finance_logs_pkey" PRIMARY KEY using index "finance_logs_pkey";

alter table "public"."financial_closings" add constraint "financial_closings_pkey" PRIMARY KEY using index "financial_closings_pkey";

alter table "public"."financial_recurring" add constraint "financial_recurring_pkey" PRIMARY KEY using index "financial_recurring_pkey";

alter table "public"."financial_transactions" add constraint "financial_transactions_pkey" PRIMARY KEY using index "financial_transactions_pkey";

alter table "public"."leaders" add constraint "leaders_pkey" PRIMARY KEY using index "leaders_pkey";

alter table "public"."media_assets" add constraint "media_assets_pkey" PRIMARY KEY using index "media_assets_pkey";

alter table "public"."members" add constraint "members_pkey" PRIMARY KEY using index "members_pkey";

alter table "public"."pastors" add constraint "pastors_pkey" PRIMARY KEY using index "pastors_pkey";

alter table "public"."pin_attempts" add constraint "pin_attempts_pkey" PRIMARY KEY using index "pin_attempts_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."rate_limits" add constraint "rate_limits_pkey" PRIMARY KEY using index "rate_limits_pkey";

alter table "public"."site_blocks" add constraint "site_blocks_pkey" PRIMARY KEY using index "site_blocks_pkey";

alter table "public"."site_media" add constraint "site_media_pkey" PRIMARY KEY using index "site_media_pkey";

alter table "public"."transaction_categories" add constraint "transaction_categories_pkey" PRIMARY KEY using index "transaction_categories_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."upload_settings" add constraint "upload_settings_pkey" PRIMARY KEY using index "upload_settings_pkey";

alter table "public"."user_feature_access" add constraint "user_feature_access_pkey" PRIMARY KEY using index "user_feature_access_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."auth_logs" add constraint "auth_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."auth_logs" validate constraint "auth_logs_user_id_fkey";

alter table "public"."cells" add constraint "cells_leader1_id_fkey" FOREIGN KEY (leader1_id) REFERENCES public.leaders(id) ON DELETE SET NULL not valid;

alter table "public"."cells" validate constraint "cells_leader1_id_fkey";

alter table "public"."cells" add constraint "cells_leader2_id_fkey" FOREIGN KEY (leader2_id) REFERENCES public.leaders(id) ON DELETE SET NULL not valid;

alter table "public"."cells" validate constraint "cells_leader2_id_fkey";

alter table "public"."cells" add constraint "cells_meeting_type_check" CHECK ((meeting_type = ANY (ARRAY['presencial'::text, 'online'::text, 'hibrido'::text]))) not valid;

alter table "public"."cells" validate constraint "cells_meeting_type_check";

alter table "public"."event_attendance" add constraint "event_attendance_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."event_attendance" validate constraint "event_attendance_event_id_fkey";

alter table "public"."event_attendance" add constraint "event_attendance_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL not valid;

alter table "public"."event_attendance" validate constraint "event_attendance_member_id_fkey";

alter table "public"."event_registrations" add constraint "event_registrations_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."event_registrations" validate constraint "event_registrations_event_id_fkey";

alter table "public"."event_registrations" add constraint "event_registrations_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL not valid;

alter table "public"."event_registrations" validate constraint "event_registrations_member_id_fkey";

alter table "public"."event_schedules" add constraint "event_schedules_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE not valid;

alter table "public"."event_schedules" validate constraint "event_schedules_event_id_fkey";

alter table "public"."event_schedules" add constraint "event_schedules_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL not valid;

alter table "public"."event_schedules" validate constraint "event_schedules_member_id_fkey";

alter table "public"."events" add constraint "events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."events" validate constraint "events_created_by_fkey";

alter table "public"."events" add constraint "events_recurrence_day_check" CHECK (((recurrence_day >= 0) AND (recurrence_day <= 6))) not valid;

alter table "public"."events" validate constraint "events_recurrence_day_check";

alter table "public"."feature_flags" add constraint "feature_flags_slug_key" UNIQUE using index "feature_flags_slug_key";

alter table "public"."feature_flags" add constraint "feature_flags_status_check" CHECK ((status = ANY (ARRAY['novo'::text, 'desenvolvimento'::text, 'manutencao'::text, 'inativo'::text, 'antecipado'::text, 'indisponivel'::text, 'movido'::text, 'normal'::text]))) not valid;

alter table "public"."feature_flags" validate constraint "feature_flags_status_check";

alter table "public"."finance_logs" add constraint "finance_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."finance_logs" validate constraint "finance_logs_actor_id_fkey";

alter table "public"."financial_closings" add constraint "financial_closings_closed_by_fkey" FOREIGN KEY (closed_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."financial_closings" validate constraint "financial_closings_closed_by_fkey";

alter table "public"."financial_closings" add constraint "financial_closings_month_check" CHECK (((month >= 1) AND (month <= 12))) not valid;

alter table "public"."financial_closings" validate constraint "financial_closings_month_check";

alter table "public"."financial_closings" add constraint "financial_closings_month_year_key" UNIQUE using index "financial_closings_month_year_key";

alter table "public"."financial_closings" add constraint "financial_closings_month_year_unique" UNIQUE using index "financial_closings_month_year_unique";

alter table "public"."financial_recurring" add constraint "financial_recurring_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."financial_recurring" validate constraint "financial_recurring_created_by_fkey";

alter table "public"."financial_transactions" add constraint "financial_transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."financial_transactions" validate constraint "financial_transactions_created_by_fkey";

alter table "public"."financial_transactions" add constraint "financial_transactions_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL not valid;

alter table "public"."financial_transactions" validate constraint "financial_transactions_member_id_fkey";

alter table "public"."media_assets" add constraint "media_assets_category_check" CHECK ((category = ANY (ARRAY['avatar'::text, 'pastor'::text, 'cell'::text, 'banner'::text, 'event'::text, 'other'::text]))) not valid;

alter table "public"."media_assets" validate constraint "media_assets_category_check";

alter table "public"."media_assets" add constraint "media_assets_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."media_assets" validate constraint "media_assets_uploaded_by_fkey";

alter table "public"."members" add constraint "members_cell_id_fkey" FOREIGN KEY (cell_id) REFERENCES public.cells(id) not valid;

alter table "public"."members" validate constraint "members_cell_id_fkey";

alter table "public"."members" add constraint "members_gender_check" CHECK ((gender = ANY (ARRAY['Masculino'::text, 'Feminino'::text]))) not valid;

alter table "public"."members" validate constraint "members_gender_check";

alter table "public"."members" add constraint "members_marital_status_check" CHECK ((marital_status = ANY (ARRAY['Solteiro(a)'::text, 'Casado(a)'::text, 'Divorciado(a)'::text, 'Viúvo(a)'::text]))) not valid;

alter table "public"."members" validate constraint "members_marital_status_check";

alter table "public"."members" add constraint "members_status_check" CHECK ((status = ANY (ARRAY['Membro'::text, 'Visitante'::text, 'Congregante'::text, 'Afastado'::text]))) not valid;

alter table "public"."members" validate constraint "members_status_check";

alter table "public"."members" add constraint "members_user_id_key" UNIQUE using index "members_user_id_key";

alter table "public"."pastors" add constraint "pastors_bio_check" CHECK ((char_length(bio) <= 600)) not valid;

alter table "public"."pastors" validate constraint "pastors_bio_check";

alter table "public"."pastors" add constraint "pastors_name_check" CHECK (((char_length(name) >= 2) AND (char_length(name) <= 120))) not valid;

alter table "public"."pastors" validate constraint "pastors_name_check";

alter table "public"."pastors" add constraint "pastors_role_check" CHECK (((char_length(role) >= 1) AND (char_length(role) <= 80))) not valid;

alter table "public"."pastors" validate constraint "pastors_role_check";

alter table "public"."pin_attempts" add constraint "pin_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."pin_attempts" validate constraint "pin_attempts_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_cpf_key" UNIQUE using index "profiles_cpf_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."site_blocks" add constraint "site_blocks_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."site_blocks" validate constraint "site_blocks_updated_by_fkey";

alter table "public"."site_media" add constraint "site_media_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."site_media" validate constraint "site_media_uploaded_by_fkey";

alter table "public"."transactions" add constraint "transactions_amount_check" CHECK ((amount > (0)::numeric)) not valid;

alter table "public"."transactions" validate constraint "transactions_amount_check";

alter table "public"."transactions" add constraint "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.transaction_categories(id) not valid;

alter table "public"."transactions" validate constraint "transactions_category_id_fkey";

alter table "public"."transactions" add constraint "transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."transactions" validate constraint "transactions_created_by_fkey";

alter table "public"."transactions" add constraint "transactions_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_member_id_fkey";

alter table "public"."upload_settings" add constraint "upload_settings_id_check" CHECK ((id = 'singleton'::text)) not valid;

alter table "public"."upload_settings" validate constraint "upload_settings_id_check";

alter table "public"."user_feature_access" add constraint "user_feature_access_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_feature_access" validate constraint "user_feature_access_user_id_fkey";

alter table "public"."user_feature_access" add constraint "user_feature_access_user_id_flag_slug_key" UNIQUE using index "user_feature_access_user_id_flag_slug_key";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.clean_old_auth_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.clean_old_rate_limits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM public.rate_limits WHERE last_request < now() - INTERVAL '1 hour';
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_pin_attempts()
 RETURNS void
 LANGUAGE sql
AS $function$
  DELETE FROM pin_attempts WHERE attempted_at < NOW() - INTERVAL '1 day';
$function$
;

CREATE OR REPLACE FUNCTION public.create_member_on_profile_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.terms_accepted_at IS NOT NULL
     AND (OLD.terms_accepted_at IS NULL OR OLD.terms_accepted_at != NEW.terms_accepted_at)
     AND NOT EXISTS (SELECT 1 FROM public.members WHERE user_id = NEW.id)
  THEN
    INSERT INTO public.members (
      user_id,
      full_name,
      phone,
      address,
      birth_date,
      status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.full_name, ''),
      NEW.phone,
      NEW.address,
      NEW.birth_date,
      'Visitante'
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$function$
;

create or replace view "public"."members_with_admins" as  SELECT m.id,
    m.full_name,
    m.phone,
    m.status,
    m.address,
    c.name AS cell_name,
    NULL::text AS system_role,
    false AS is_admin_only
   FROM (public.members m
     LEFT JOIN public.cells c ON ((c.id = m.cell_id)))
UNION ALL
 SELECT p.id,
    p.full_name,
    p.phone,
    'Admin'::text AS status,
    p.address,
    NULL::text AS cell_name,
    (ur.role)::text AS system_role,
    true AS is_admin_only
   FROM (public.profiles p
     JOIN public.user_roles ur ON ((ur.user_id = p.id)))
  WHERE ((ur.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'FINANCE_ADMIN'::public.app_role, 'LEADER'::public.app_role])) AND (NOT (EXISTS ( SELECT 1
           FROM public.members m
          WHERE (m.user_id = p.id)))));


CREATE OR REPLACE FUNCTION public.publish_site_blocks()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(ARRAY['SYSADMIN','CHURCH_ADMIN']::app_role[])
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE site_blocks
  SET published_content = content,
      updated_at = now();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_pin(p_user_id uuid, p_pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE profiles
  SET security_pin_hash = crypt(p_pin, gen_salt('bf'))
  WHERE id = p_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_member_from_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.members
  SET
    full_name  = COALESCE(NEW.full_name,  full_name),
    phone      = COALESCE(NEW.phone,      phone),
    address    = COALESCE(NEW.address,    address),
    birth_date = COALESCE(NEW.birth_date, birth_date),
    updated_at = NOW()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_pin(user_id uuid, pin_input text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
      AND security_pin_hash = crypt(pin_input, security_pin_hash)
  );
$function$
;

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."auth_logs" to "anon";

grant insert on table "public"."auth_logs" to "anon";

grant references on table "public"."auth_logs" to "anon";

grant select on table "public"."auth_logs" to "anon";

grant trigger on table "public"."auth_logs" to "anon";

grant truncate on table "public"."auth_logs" to "anon";

grant update on table "public"."auth_logs" to "anon";

grant delete on table "public"."auth_logs" to "authenticated";

grant insert on table "public"."auth_logs" to "authenticated";

grant references on table "public"."auth_logs" to "authenticated";

grant select on table "public"."auth_logs" to "authenticated";

grant trigger on table "public"."auth_logs" to "authenticated";

grant truncate on table "public"."auth_logs" to "authenticated";

grant update on table "public"."auth_logs" to "authenticated";

grant delete on table "public"."auth_logs" to "service_role";

grant insert on table "public"."auth_logs" to "service_role";

grant references on table "public"."auth_logs" to "service_role";

grant select on table "public"."auth_logs" to "service_role";

grant trigger on table "public"."auth_logs" to "service_role";

grant truncate on table "public"."auth_logs" to "service_role";

grant update on table "public"."auth_logs" to "service_role";

grant delete on table "public"."auth_rate_limits" to "anon";

grant insert on table "public"."auth_rate_limits" to "anon";

grant references on table "public"."auth_rate_limits" to "anon";

grant select on table "public"."auth_rate_limits" to "anon";

grant trigger on table "public"."auth_rate_limits" to "anon";

grant truncate on table "public"."auth_rate_limits" to "anon";

grant update on table "public"."auth_rate_limits" to "anon";

grant delete on table "public"."auth_rate_limits" to "authenticated";

grant insert on table "public"."auth_rate_limits" to "authenticated";

grant references on table "public"."auth_rate_limits" to "authenticated";

grant select on table "public"."auth_rate_limits" to "authenticated";

grant trigger on table "public"."auth_rate_limits" to "authenticated";

grant truncate on table "public"."auth_rate_limits" to "authenticated";

grant update on table "public"."auth_rate_limits" to "authenticated";

grant delete on table "public"."auth_rate_limits" to "service_role";

grant insert on table "public"."auth_rate_limits" to "service_role";

grant references on table "public"."auth_rate_limits" to "service_role";

grant select on table "public"."auth_rate_limits" to "service_role";

grant trigger on table "public"."auth_rate_limits" to "service_role";

grant truncate on table "public"."auth_rate_limits" to "service_role";

grant update on table "public"."auth_rate_limits" to "service_role";

grant delete on table "public"."cells" to "anon";

grant insert on table "public"."cells" to "anon";

grant references on table "public"."cells" to "anon";

grant select on table "public"."cells" to "anon";

grant trigger on table "public"."cells" to "anon";

grant truncate on table "public"."cells" to "anon";

grant update on table "public"."cells" to "anon";

grant delete on table "public"."cells" to "authenticated";

grant insert on table "public"."cells" to "authenticated";

grant references on table "public"."cells" to "authenticated";

grant select on table "public"."cells" to "authenticated";

grant trigger on table "public"."cells" to "authenticated";

grant truncate on table "public"."cells" to "authenticated";

grant update on table "public"."cells" to "authenticated";

grant delete on table "public"."cells" to "service_role";

grant insert on table "public"."cells" to "service_role";

grant references on table "public"."cells" to "service_role";

grant select on table "public"."cells" to "service_role";

grant trigger on table "public"."cells" to "service_role";

grant truncate on table "public"."cells" to "service_role";

grant update on table "public"."cells" to "service_role";

grant delete on table "public"."contact_messages" to "anon";

grant insert on table "public"."contact_messages" to "anon";

grant references on table "public"."contact_messages" to "anon";

grant select on table "public"."contact_messages" to "anon";

grant trigger on table "public"."contact_messages" to "anon";

grant truncate on table "public"."contact_messages" to "anon";

grant update on table "public"."contact_messages" to "anon";

grant delete on table "public"."contact_messages" to "authenticated";

grant insert on table "public"."contact_messages" to "authenticated";

grant references on table "public"."contact_messages" to "authenticated";

grant select on table "public"."contact_messages" to "authenticated";

grant trigger on table "public"."contact_messages" to "authenticated";

grant truncate on table "public"."contact_messages" to "authenticated";

grant update on table "public"."contact_messages" to "authenticated";

grant delete on table "public"."contact_messages" to "service_role";

grant insert on table "public"."contact_messages" to "service_role";

grant references on table "public"."contact_messages" to "service_role";

grant select on table "public"."contact_messages" to "service_role";

grant trigger on table "public"."contact_messages" to "service_role";

grant truncate on table "public"."contact_messages" to "service_role";

grant update on table "public"."contact_messages" to "service_role";

grant delete on table "public"."event_attendance" to "anon";

grant insert on table "public"."event_attendance" to "anon";

grant references on table "public"."event_attendance" to "anon";

grant select on table "public"."event_attendance" to "anon";

grant trigger on table "public"."event_attendance" to "anon";

grant truncate on table "public"."event_attendance" to "anon";

grant update on table "public"."event_attendance" to "anon";

grant delete on table "public"."event_attendance" to "authenticated";

grant insert on table "public"."event_attendance" to "authenticated";

grant references on table "public"."event_attendance" to "authenticated";

grant select on table "public"."event_attendance" to "authenticated";

grant trigger on table "public"."event_attendance" to "authenticated";

grant truncate on table "public"."event_attendance" to "authenticated";

grant update on table "public"."event_attendance" to "authenticated";

grant delete on table "public"."event_attendance" to "service_role";

grant insert on table "public"."event_attendance" to "service_role";

grant references on table "public"."event_attendance" to "service_role";

grant select on table "public"."event_attendance" to "service_role";

grant trigger on table "public"."event_attendance" to "service_role";

grant truncate on table "public"."event_attendance" to "service_role";

grant update on table "public"."event_attendance" to "service_role";

grant delete on table "public"."event_registrations" to "anon";

grant insert on table "public"."event_registrations" to "anon";

grant references on table "public"."event_registrations" to "anon";

grant select on table "public"."event_registrations" to "anon";

grant trigger on table "public"."event_registrations" to "anon";

grant truncate on table "public"."event_registrations" to "anon";

grant update on table "public"."event_registrations" to "anon";

grant delete on table "public"."event_registrations" to "authenticated";

grant insert on table "public"."event_registrations" to "authenticated";

grant references on table "public"."event_registrations" to "authenticated";

grant select on table "public"."event_registrations" to "authenticated";

grant trigger on table "public"."event_registrations" to "authenticated";

grant truncate on table "public"."event_registrations" to "authenticated";

grant update on table "public"."event_registrations" to "authenticated";

grant delete on table "public"."event_registrations" to "service_role";

grant insert on table "public"."event_registrations" to "service_role";

grant references on table "public"."event_registrations" to "service_role";

grant select on table "public"."event_registrations" to "service_role";

grant trigger on table "public"."event_registrations" to "service_role";

grant truncate on table "public"."event_registrations" to "service_role";

grant update on table "public"."event_registrations" to "service_role";

grant delete on table "public"."event_schedules" to "anon";

grant insert on table "public"."event_schedules" to "anon";

grant references on table "public"."event_schedules" to "anon";

grant select on table "public"."event_schedules" to "anon";

grant trigger on table "public"."event_schedules" to "anon";

grant truncate on table "public"."event_schedules" to "anon";

grant update on table "public"."event_schedules" to "anon";

grant delete on table "public"."event_schedules" to "authenticated";

grant insert on table "public"."event_schedules" to "authenticated";

grant references on table "public"."event_schedules" to "authenticated";

grant select on table "public"."event_schedules" to "authenticated";

grant trigger on table "public"."event_schedules" to "authenticated";

grant truncate on table "public"."event_schedules" to "authenticated";

grant update on table "public"."event_schedules" to "authenticated";

grant delete on table "public"."event_schedules" to "service_role";

grant insert on table "public"."event_schedules" to "service_role";

grant references on table "public"."event_schedules" to "service_role";

grant select on table "public"."event_schedules" to "service_role";

grant trigger on table "public"."event_schedules" to "service_role";

grant truncate on table "public"."event_schedules" to "service_role";

grant update on table "public"."event_schedules" to "service_role";

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."feature_flags" to "anon";

grant insert on table "public"."feature_flags" to "anon";

grant references on table "public"."feature_flags" to "anon";

grant select on table "public"."feature_flags" to "anon";

grant trigger on table "public"."feature_flags" to "anon";

grant truncate on table "public"."feature_flags" to "anon";

grant update on table "public"."feature_flags" to "anon";

grant delete on table "public"."feature_flags" to "authenticated";

grant insert on table "public"."feature_flags" to "authenticated";

grant references on table "public"."feature_flags" to "authenticated";

grant select on table "public"."feature_flags" to "authenticated";

grant trigger on table "public"."feature_flags" to "authenticated";

grant truncate on table "public"."feature_flags" to "authenticated";

grant update on table "public"."feature_flags" to "authenticated";

grant delete on table "public"."feature_flags" to "service_role";

grant insert on table "public"."feature_flags" to "service_role";

grant references on table "public"."feature_flags" to "service_role";

grant select on table "public"."feature_flags" to "service_role";

grant trigger on table "public"."feature_flags" to "service_role";

grant truncate on table "public"."feature_flags" to "service_role";

grant update on table "public"."feature_flags" to "service_role";

grant insert on table "public"."finance_logs" to "anon";

grant references on table "public"."finance_logs" to "anon";

grant select on table "public"."finance_logs" to "anon";

grant trigger on table "public"."finance_logs" to "anon";

grant truncate on table "public"."finance_logs" to "anon";

grant update on table "public"."finance_logs" to "anon";

grant insert on table "public"."finance_logs" to "authenticated";

grant references on table "public"."finance_logs" to "authenticated";

grant select on table "public"."finance_logs" to "authenticated";

grant trigger on table "public"."finance_logs" to "authenticated";

grant truncate on table "public"."finance_logs" to "authenticated";

grant update on table "public"."finance_logs" to "authenticated";

grant delete on table "public"."finance_logs" to "service_role";

grant insert on table "public"."finance_logs" to "service_role";

grant references on table "public"."finance_logs" to "service_role";

grant select on table "public"."finance_logs" to "service_role";

grant trigger on table "public"."finance_logs" to "service_role";

grant truncate on table "public"."finance_logs" to "service_role";

grant update on table "public"."finance_logs" to "service_role";

grant delete on table "public"."financial_closings" to "anon";

grant insert on table "public"."financial_closings" to "anon";

grant references on table "public"."financial_closings" to "anon";

grant select on table "public"."financial_closings" to "anon";

grant trigger on table "public"."financial_closings" to "anon";

grant truncate on table "public"."financial_closings" to "anon";

grant update on table "public"."financial_closings" to "anon";

grant delete on table "public"."financial_closings" to "authenticated";

grant insert on table "public"."financial_closings" to "authenticated";

grant references on table "public"."financial_closings" to "authenticated";

grant select on table "public"."financial_closings" to "authenticated";

grant trigger on table "public"."financial_closings" to "authenticated";

grant truncate on table "public"."financial_closings" to "authenticated";

grant update on table "public"."financial_closings" to "authenticated";

grant delete on table "public"."financial_closings" to "service_role";

grant insert on table "public"."financial_closings" to "service_role";

grant references on table "public"."financial_closings" to "service_role";

grant select on table "public"."financial_closings" to "service_role";

grant trigger on table "public"."financial_closings" to "service_role";

grant truncate on table "public"."financial_closings" to "service_role";

grant update on table "public"."financial_closings" to "service_role";

grant delete on table "public"."financial_recurring" to "anon";

grant insert on table "public"."financial_recurring" to "anon";

grant references on table "public"."financial_recurring" to "anon";

grant select on table "public"."financial_recurring" to "anon";

grant trigger on table "public"."financial_recurring" to "anon";

grant truncate on table "public"."financial_recurring" to "anon";

grant update on table "public"."financial_recurring" to "anon";

grant delete on table "public"."financial_recurring" to "authenticated";

grant insert on table "public"."financial_recurring" to "authenticated";

grant references on table "public"."financial_recurring" to "authenticated";

grant select on table "public"."financial_recurring" to "authenticated";

grant trigger on table "public"."financial_recurring" to "authenticated";

grant truncate on table "public"."financial_recurring" to "authenticated";

grant update on table "public"."financial_recurring" to "authenticated";

grant delete on table "public"."financial_recurring" to "service_role";

grant insert on table "public"."financial_recurring" to "service_role";

grant references on table "public"."financial_recurring" to "service_role";

grant select on table "public"."financial_recurring" to "service_role";

grant trigger on table "public"."financial_recurring" to "service_role";

grant truncate on table "public"."financial_recurring" to "service_role";

grant update on table "public"."financial_recurring" to "service_role";

grant delete on table "public"."financial_transactions" to "anon";

grant insert on table "public"."financial_transactions" to "anon";

grant references on table "public"."financial_transactions" to "anon";

grant select on table "public"."financial_transactions" to "anon";

grant trigger on table "public"."financial_transactions" to "anon";

grant truncate on table "public"."financial_transactions" to "anon";

grant update on table "public"."financial_transactions" to "anon";

grant delete on table "public"."financial_transactions" to "authenticated";

grant insert on table "public"."financial_transactions" to "authenticated";

grant references on table "public"."financial_transactions" to "authenticated";

grant select on table "public"."financial_transactions" to "authenticated";

grant trigger on table "public"."financial_transactions" to "authenticated";

grant truncate on table "public"."financial_transactions" to "authenticated";

grant update on table "public"."financial_transactions" to "authenticated";

grant delete on table "public"."financial_transactions" to "service_role";

grant insert on table "public"."financial_transactions" to "service_role";

grant references on table "public"."financial_transactions" to "service_role";

grant select on table "public"."financial_transactions" to "service_role";

grant trigger on table "public"."financial_transactions" to "service_role";

grant truncate on table "public"."financial_transactions" to "service_role";

grant update on table "public"."financial_transactions" to "service_role";

grant delete on table "public"."leaders" to "anon";

grant insert on table "public"."leaders" to "anon";

grant references on table "public"."leaders" to "anon";

grant select on table "public"."leaders" to "anon";

grant trigger on table "public"."leaders" to "anon";

grant truncate on table "public"."leaders" to "anon";

grant update on table "public"."leaders" to "anon";

grant delete on table "public"."leaders" to "authenticated";

grant insert on table "public"."leaders" to "authenticated";

grant references on table "public"."leaders" to "authenticated";

grant select on table "public"."leaders" to "authenticated";

grant trigger on table "public"."leaders" to "authenticated";

grant truncate on table "public"."leaders" to "authenticated";

grant update on table "public"."leaders" to "authenticated";

grant delete on table "public"."leaders" to "service_role";

grant insert on table "public"."leaders" to "service_role";

grant references on table "public"."leaders" to "service_role";

grant select on table "public"."leaders" to "service_role";

grant trigger on table "public"."leaders" to "service_role";

grant truncate on table "public"."leaders" to "service_role";

grant update on table "public"."leaders" to "service_role";

grant delete on table "public"."media_assets" to "anon";

grant insert on table "public"."media_assets" to "anon";

grant references on table "public"."media_assets" to "anon";

grant select on table "public"."media_assets" to "anon";

grant trigger on table "public"."media_assets" to "anon";

grant truncate on table "public"."media_assets" to "anon";

grant update on table "public"."media_assets" to "anon";

grant delete on table "public"."media_assets" to "authenticated";

grant insert on table "public"."media_assets" to "authenticated";

grant references on table "public"."media_assets" to "authenticated";

grant select on table "public"."media_assets" to "authenticated";

grant trigger on table "public"."media_assets" to "authenticated";

grant truncate on table "public"."media_assets" to "authenticated";

grant update on table "public"."media_assets" to "authenticated";

grant delete on table "public"."media_assets" to "service_role";

grant insert on table "public"."media_assets" to "service_role";

grant references on table "public"."media_assets" to "service_role";

grant select on table "public"."media_assets" to "service_role";

grant trigger on table "public"."media_assets" to "service_role";

grant truncate on table "public"."media_assets" to "service_role";

grant update on table "public"."media_assets" to "service_role";

grant delete on table "public"."members" to "anon";

grant insert on table "public"."members" to "anon";

grant references on table "public"."members" to "anon";

grant select on table "public"."members" to "anon";

grant trigger on table "public"."members" to "anon";

grant truncate on table "public"."members" to "anon";

grant update on table "public"."members" to "anon";

grant delete on table "public"."members" to "authenticated";

grant insert on table "public"."members" to "authenticated";

grant references on table "public"."members" to "authenticated";

grant select on table "public"."members" to "authenticated";

grant trigger on table "public"."members" to "authenticated";

grant truncate on table "public"."members" to "authenticated";

grant update on table "public"."members" to "authenticated";

grant delete on table "public"."members" to "service_role";

grant insert on table "public"."members" to "service_role";

grant references on table "public"."members" to "service_role";

grant select on table "public"."members" to "service_role";

grant trigger on table "public"."members" to "service_role";

grant truncate on table "public"."members" to "service_role";

grant update on table "public"."members" to "service_role";

grant delete on table "public"."pastors" to "anon";

grant insert on table "public"."pastors" to "anon";

grant references on table "public"."pastors" to "anon";

grant select on table "public"."pastors" to "anon";

grant trigger on table "public"."pastors" to "anon";

grant truncate on table "public"."pastors" to "anon";

grant update on table "public"."pastors" to "anon";

grant delete on table "public"."pastors" to "authenticated";

grant insert on table "public"."pastors" to "authenticated";

grant references on table "public"."pastors" to "authenticated";

grant select on table "public"."pastors" to "authenticated";

grant trigger on table "public"."pastors" to "authenticated";

grant truncate on table "public"."pastors" to "authenticated";

grant update on table "public"."pastors" to "authenticated";

grant delete on table "public"."pastors" to "service_role";

grant insert on table "public"."pastors" to "service_role";

grant references on table "public"."pastors" to "service_role";

grant select on table "public"."pastors" to "service_role";

grant trigger on table "public"."pastors" to "service_role";

grant truncate on table "public"."pastors" to "service_role";

grant update on table "public"."pastors" to "service_role";

grant delete on table "public"."pin_attempts" to "anon";

grant insert on table "public"."pin_attempts" to "anon";

grant references on table "public"."pin_attempts" to "anon";

grant select on table "public"."pin_attempts" to "anon";

grant trigger on table "public"."pin_attempts" to "anon";

grant truncate on table "public"."pin_attempts" to "anon";

grant update on table "public"."pin_attempts" to "anon";

grant delete on table "public"."pin_attempts" to "authenticated";

grant insert on table "public"."pin_attempts" to "authenticated";

grant references on table "public"."pin_attempts" to "authenticated";

grant select on table "public"."pin_attempts" to "authenticated";

grant trigger on table "public"."pin_attempts" to "authenticated";

grant truncate on table "public"."pin_attempts" to "authenticated";

grant update on table "public"."pin_attempts" to "authenticated";

grant delete on table "public"."pin_attempts" to "service_role";

grant insert on table "public"."pin_attempts" to "service_role";

grant references on table "public"."pin_attempts" to "service_role";

grant select on table "public"."pin_attempts" to "service_role";

grant trigger on table "public"."pin_attempts" to "service_role";

grant truncate on table "public"."pin_attempts" to "service_role";

grant update on table "public"."pin_attempts" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."rate_limits" to "anon";

grant insert on table "public"."rate_limits" to "anon";

grant references on table "public"."rate_limits" to "anon";

grant select on table "public"."rate_limits" to "anon";

grant trigger on table "public"."rate_limits" to "anon";

grant truncate on table "public"."rate_limits" to "anon";

grant update on table "public"."rate_limits" to "anon";

grant delete on table "public"."rate_limits" to "authenticated";

grant insert on table "public"."rate_limits" to "authenticated";

grant references on table "public"."rate_limits" to "authenticated";

grant select on table "public"."rate_limits" to "authenticated";

grant trigger on table "public"."rate_limits" to "authenticated";

grant truncate on table "public"."rate_limits" to "authenticated";

grant update on table "public"."rate_limits" to "authenticated";

grant delete on table "public"."rate_limits" to "service_role";

grant insert on table "public"."rate_limits" to "service_role";

grant references on table "public"."rate_limits" to "service_role";

grant select on table "public"."rate_limits" to "service_role";

grant trigger on table "public"."rate_limits" to "service_role";

grant truncate on table "public"."rate_limits" to "service_role";

grant update on table "public"."rate_limits" to "service_role";

grant delete on table "public"."site_blocks" to "anon";

grant insert on table "public"."site_blocks" to "anon";

grant references on table "public"."site_blocks" to "anon";

grant select on table "public"."site_blocks" to "anon";

grant trigger on table "public"."site_blocks" to "anon";

grant truncate on table "public"."site_blocks" to "anon";

grant update on table "public"."site_blocks" to "anon";

grant delete on table "public"."site_blocks" to "authenticated";

grant insert on table "public"."site_blocks" to "authenticated";

grant references on table "public"."site_blocks" to "authenticated";

grant select on table "public"."site_blocks" to "authenticated";

grant trigger on table "public"."site_blocks" to "authenticated";

grant truncate on table "public"."site_blocks" to "authenticated";

grant update on table "public"."site_blocks" to "authenticated";

grant delete on table "public"."site_blocks" to "service_role";

grant insert on table "public"."site_blocks" to "service_role";

grant references on table "public"."site_blocks" to "service_role";

grant select on table "public"."site_blocks" to "service_role";

grant trigger on table "public"."site_blocks" to "service_role";

grant truncate on table "public"."site_blocks" to "service_role";

grant update on table "public"."site_blocks" to "service_role";

grant delete on table "public"."site_media" to "anon";

grant insert on table "public"."site_media" to "anon";

grant references on table "public"."site_media" to "anon";

grant select on table "public"."site_media" to "anon";

grant trigger on table "public"."site_media" to "anon";

grant truncate on table "public"."site_media" to "anon";

grant update on table "public"."site_media" to "anon";

grant delete on table "public"."site_media" to "authenticated";

grant insert on table "public"."site_media" to "authenticated";

grant references on table "public"."site_media" to "authenticated";

grant select on table "public"."site_media" to "authenticated";

grant trigger on table "public"."site_media" to "authenticated";

grant truncate on table "public"."site_media" to "authenticated";

grant update on table "public"."site_media" to "authenticated";

grant delete on table "public"."site_media" to "service_role";

grant insert on table "public"."site_media" to "service_role";

grant references on table "public"."site_media" to "service_role";

grant select on table "public"."site_media" to "service_role";

grant trigger on table "public"."site_media" to "service_role";

grant truncate on table "public"."site_media" to "service_role";

grant update on table "public"."site_media" to "service_role";

grant delete on table "public"."transaction_categories" to "anon";

grant insert on table "public"."transaction_categories" to "anon";

grant references on table "public"."transaction_categories" to "anon";

grant select on table "public"."transaction_categories" to "anon";

grant trigger on table "public"."transaction_categories" to "anon";

grant truncate on table "public"."transaction_categories" to "anon";

grant update on table "public"."transaction_categories" to "anon";

grant delete on table "public"."transaction_categories" to "authenticated";

grant insert on table "public"."transaction_categories" to "authenticated";

grant references on table "public"."transaction_categories" to "authenticated";

grant select on table "public"."transaction_categories" to "authenticated";

grant trigger on table "public"."transaction_categories" to "authenticated";

grant truncate on table "public"."transaction_categories" to "authenticated";

grant update on table "public"."transaction_categories" to "authenticated";

grant delete on table "public"."transaction_categories" to "service_role";

grant insert on table "public"."transaction_categories" to "service_role";

grant references on table "public"."transaction_categories" to "service_role";

grant select on table "public"."transaction_categories" to "service_role";

grant trigger on table "public"."transaction_categories" to "service_role";

grant truncate on table "public"."transaction_categories" to "service_role";

grant update on table "public"."transaction_categories" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

grant delete on table "public"."upload_settings" to "anon";

grant insert on table "public"."upload_settings" to "anon";

grant references on table "public"."upload_settings" to "anon";

grant select on table "public"."upload_settings" to "anon";

grant trigger on table "public"."upload_settings" to "anon";

grant truncate on table "public"."upload_settings" to "anon";

grant update on table "public"."upload_settings" to "anon";

grant delete on table "public"."upload_settings" to "authenticated";

grant insert on table "public"."upload_settings" to "authenticated";

grant references on table "public"."upload_settings" to "authenticated";

grant select on table "public"."upload_settings" to "authenticated";

grant trigger on table "public"."upload_settings" to "authenticated";

grant truncate on table "public"."upload_settings" to "authenticated";

grant update on table "public"."upload_settings" to "authenticated";

grant delete on table "public"."upload_settings" to "service_role";

grant insert on table "public"."upload_settings" to "service_role";

grant references on table "public"."upload_settings" to "service_role";

grant select on table "public"."upload_settings" to "service_role";

grant trigger on table "public"."upload_settings" to "service_role";

grant truncate on table "public"."upload_settings" to "service_role";

grant update on table "public"."upload_settings" to "service_role";

grant delete on table "public"."user_feature_access" to "anon";

grant insert on table "public"."user_feature_access" to "anon";

grant references on table "public"."user_feature_access" to "anon";

grant select on table "public"."user_feature_access" to "anon";

grant trigger on table "public"."user_feature_access" to "anon";

grant truncate on table "public"."user_feature_access" to "anon";

grant update on table "public"."user_feature_access" to "anon";

grant delete on table "public"."user_feature_access" to "authenticated";

grant insert on table "public"."user_feature_access" to "authenticated";

grant references on table "public"."user_feature_access" to "authenticated";

grant select on table "public"."user_feature_access" to "authenticated";

grant trigger on table "public"."user_feature_access" to "authenticated";

grant truncate on table "public"."user_feature_access" to "authenticated";

grant update on table "public"."user_feature_access" to "authenticated";

grant delete on table "public"."user_feature_access" to "service_role";

grant insert on table "public"."user_feature_access" to "service_role";

grant references on table "public"."user_feature_access" to "service_role";

grant select on table "public"."user_feature_access" to "service_role";

grant trigger on table "public"."user_feature_access" to "service_role";

grant truncate on table "public"."user_feature_access" to "service_role";

grant update on table "public"."user_feature_access" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";


  create policy "Sistema pode inserir logs"
  on "public"."audit_logs"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "audit_logs_read_sysadmin"
  on "public"."audit_logs"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'SYSADMIN'::public.app_role)))));



  create policy "sysadmin_read_auth_logs"
  on "public"."auth_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'SYSADMIN'::public.app_role)))));



  create policy "service_role_only"
  on "public"."auth_rate_limits"
  as permissive
  for all
  to public
using (false);



  create policy "Admins gerenciam células"
  on "public"."cells"
  as permissive
  for all
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Admins leem todas as células"
  on "public"."cells"
  as permissive
  for select
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Permitir leitura de células públicas"
  on "public"."cells"
  as permissive
  for select
  to public
using (((is_public = true) AND (is_active = true)));



  create policy "admin_all_cells"
  on "public"."cells"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "cells_read"
  on "public"."cells"
  as permissive
  for select
  to authenticated
using (true);



  create policy "cells_write_admin"
  on "public"."cells"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))));



  create policy "public_read_cells"
  on "public"."cells"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "contact_messages_insert"
  on "public"."contact_messages"
  as permissive
  for insert
  to public
with check (true);



  create policy "contact_messages_read"
  on "public"."contact_messages"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "contact_messages_update_admin"
  on "public"."contact_messages"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "attendance_read"
  on "public"."event_attendance"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "attendance_write_admin"
  on "public"."event_attendance"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))));



  create policy "Admins podem gerenciar inscrições"
  on "public"."event_registrations"
  as permissive
  for all
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Admins veem todas as inscrições"
  on "public"."event_registrations"
  as permissive
  for select
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Comprovante acessível por ID"
  on "public"."event_registrations"
  as permissive
  for select
  to public
using (true);



  create policy "Membros podem atualizar próprias inscrições"
  on "public"."event_registrations"
  as permissive
  for update
  to public
using ((member_id = auth.uid()));



  create policy "Membros veem próprias inscrições"
  on "public"."event_registrations"
  as permissive
  for select
  to public
using (((member_id = auth.uid()) OR (email = (auth.jwt() ->> 'email'::text))));



  create policy "Permitir inserção de inscrições anônimas/públicas"
  on "public"."event_registrations"
  as permissive
  for insert
  to public
with check (true);



  create policy "registrations_read"
  on "public"."event_registrations"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "registrations_write_admin"
  on "public"."event_registrations"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))));



  create policy "schedules_read"
  on "public"."event_schedules"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "schedules_write_admin"
  on "public"."event_schedules"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))));



  create policy "Admins podem atualizar eventos"
  on "public"."events"
  as permissive
  for update
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Admins podem inserir eventos"
  on "public"."events"
  as permissive
  for insert
  to public
with check (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Admins podem ver todos os eventos"
  on "public"."events"
  as permissive
  for select
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Apenas SYSADMIN pode deletar eventos"
  on "public"."events"
  as permissive
  for delete
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = 'SYSADMIN'::public.app_role)))));



  create policy "Eventos são públicos"
  on "public"."events"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Permitir leitura de eventos públicos"
  on "public"."events"
  as permissive
  for select
  to public
using (((is_public = true) AND (status = 'publicado'::public.event_status)));



  create policy "events_read"
  on "public"."events"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "events_write_admin"
  on "public"."events"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))));



  create policy "Feature flags são públicas para leitura"
  on "public"."feature_flags"
  as permissive
  for select
  to public
using (true);



  create policy "Leitura permitida para todos"
  on "public"."feature_flags"
  as permissive
  for select
  to public
using (true);



  create policy "feature_flags_write_sysadmin"
  on "public"."feature_flags"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'SYSADMIN'::public.app_role)))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'SYSADMIN'::public.app_role)))));



  create policy "finance_logs_insert"
  on "public"."finance_logs"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "finance_logs_read"
  on "public"."finance_logs"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "closings_insert"
  on "public"."financial_closings"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "closings_read"
  on "public"."financial_closings"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "recurring_delete"
  on "public"."financial_recurring"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "recurring_insert"
  on "public"."financial_recurring"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "recurring_read"
  on "public"."financial_recurring"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "recurring_update"
  on "public"."financial_recurring"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "finance_delete"
  on "public"."financial_transactions"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'SYSADMIN'::public.app_role)))));



  create policy "finance_insert"
  on "public"."financial_transactions"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "finance_read"
  on "public"."financial_transactions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "Admins gerenciam líderes"
  on "public"."leaders"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Líderes ativos são públicos"
  on "public"."leaders"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "Deleção por dono ou admin"
  on "public"."media_assets"
  as permissive
  for delete
  to authenticated
using (((uploaded_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role])))))));



  create policy "Inserção para o próprio usuário"
  on "public"."media_assets"
  as permissive
  for insert
  to authenticated
with check ((uploaded_by = auth.uid()));



  create policy "Leitura autenticada para media_assets"
  on "public"."media_assets"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Admins escrevem membros"
  on "public"."members"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))));



  create policy "Admins leem membros"
  on "public"."members"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'FINANCE_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))));



  create policy "Membro lê própria ficha"
  on "public"."members"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Service role acesso total members"
  on "public"."members"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Admins gerenciam pastores"
  on "public"."pastors"
  as permissive
  for all
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Admins leem todos os pastores"
  on "public"."pastors"
  as permissive
  for select
  to public
using (((((auth.jwt() ->> 'is_sysadmin'::text))::boolean = true) OR (auth.uid() IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Permitir leitura de pastores ativos"
  on "public"."pastors"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "pastors_select_public"
  on "public"."pastors"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "pastors_write_admin"
  on "public"."pastors"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "pin_attempts_own"
  on "public"."pin_attempts"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "Admins leem profiles"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'FINANCE_ADMIN'::public.app_role, 'LEADER'::public.app_role]))))));



  create policy "Service role acesso total profiles"
  on "public"."profiles"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Usuário acessa próprio profile"
  on "public"."profiles"
  as permissive
  for all
  to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "site_blocks_public_read"
  on "public"."site_blocks"
  as permissive
  for select
  to public
using (true);



  create policy "site_blocks_select_public"
  on "public"."site_blocks"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "site_blocks_write_admin"
  on "public"."site_blocks"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Admins deletam site_media"
  on "public"."site_media"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Admins inserem site_media"
  on "public"."site_media"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Admins leem site_media"
  on "public"."site_media"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role]))))));



  create policy "Service role site_media"
  on "public"."site_media"
  as permissive
  for all
  to service_role
using (true)
with check (true);



  create policy "Leitura de categorias permitida"
  on "public"."transaction_categories"
  as permissive
  for select
  to authenticated
using (true);



  create policy "categories_read"
  on "public"."transaction_categories"
  as permissive
  for select
  to public
using ((auth.uid() IS NOT NULL));



  create policy "finance_delete"
  on "public"."transactions"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'SYSADMIN'::public.app_role)))));



  create policy "finance_insert"
  on "public"."transactions"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "finance_read"
  on "public"."transactions"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['FINANCE_ADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role, 'SYSADMIN'::public.app_role]))))));



  create policy "Apenas SysAdmins editam upload_settings"
  on "public"."upload_settings"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'SYSADMIN'::public.app_role)))));



  create policy "Leitura pública para upload_settings"
  on "public"."upload_settings"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Users can insert their own access"
  on "public"."user_feature_access"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own access"
  on "public"."user_feature_access"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Usuários veem os próprios cargos"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


CREATE TRIGGER on_profile_complete_create_member AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_member_on_profile_complete();

CREATE TRIGGER on_profile_update_sync_member AFTER UPDATE OF full_name, phone, address, birth_date ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_member_from_profile();

CREATE TRIGGER trigger_clean_rate_limits AFTER INSERT ON public.rate_limits FOR EACH STATEMENT EXECUTE FUNCTION public.clean_old_rate_limits();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Admins fazem upload em site-images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'site-images'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role])))))));



  create policy "Admins gerenciam site-images"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using (((bucket_id = 'site-images'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role])))))))
with check (((bucket_id = 'site-images'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role])))))));



  create policy "Avatares são públicos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Usuário atualiza o próprio avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Usuário faz upload do próprio avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Usuário remove o próprio avatar"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Usuários logados fazem upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "avatars_owner_delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "avatars_owner_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "avatars_owner_write"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "avatars_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "pastor_photos_admin_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'pastor-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role])))))));



  create policy "pastor_photos_admin_write"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'pastor-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role])))))));



  create policy "pastor_photos_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'pastor-photos'::text));



  create policy "site-images são públicas"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'site-images'::text));



  create policy "site_images_admin_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'site-images'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role])))))));



  create policy "site_images_admin_write"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'site-images'::text) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['SYSADMIN'::public.app_role, 'CHURCH_ADMIN'::public.app_role])))))));



  create policy "site_images_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'site-images'::text));



