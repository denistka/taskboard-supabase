create type "public"."task_status" as enum ('todo', 'in_progress', 'done');

create table "public"."boards" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."boards" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."profiles" enable row level security;

create table "public"."tasks" (
    "id" uuid not null default gen_random_uuid(),
    "board_id" uuid not null,
    "title" text not null,
    "description" text,
    "status" task_status not null default 'todo'::task_status,
    "assigned_to" uuid,
    "created_by" uuid not null,
    "position" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."tasks" enable row level security;

create table "public"."user_presence" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "board_id" uuid not null,
    "last_seen" timestamp with time zone default now()
);


alter table "public"."user_presence" enable row level security;

CREATE UNIQUE INDEX boards_pkey ON public.boards USING btree (id);

CREATE INDEX idx_boards_created_by ON public.boards USING btree (created_by);

CREATE INDEX idx_tasks_board_id ON public.tasks USING btree (board_id);

CREATE INDEX idx_tasks_position ON public.tasks USING btree ("position");

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);

CREATE INDEX idx_user_presence_board_id ON public.user_presence USING btree (board_id);

CREATE INDEX idx_user_presence_last_seen ON public.user_presence USING btree (last_seen);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

CREATE UNIQUE INDEX user_presence_pkey ON public.user_presence USING btree (id);

CREATE UNIQUE INDEX user_presence_user_id_board_id_key ON public.user_presence USING btree (user_id, board_id);

alter table "public"."boards" add constraint "boards_pkey" PRIMARY KEY using index "boards_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."user_presence" add constraint "user_presence_pkey" PRIMARY KEY using index "user_presence_pkey";

alter table "public"."boards" add constraint "boards_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."boards" validate constraint "boards_created_by_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."tasks" add constraint "tasks_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL not valid;

alter table "public"."tasks" validate constraint "tasks_assigned_to_fkey";

alter table "public"."tasks" add constraint "tasks_board_id_fkey" FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_board_id_fkey";

alter table "public"."tasks" add constraint "tasks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_created_by_fkey";

alter table "public"."user_presence" add constraint "user_presence_board_id_fkey" FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE not valid;

alter table "public"."user_presence" validate constraint "user_presence_board_id_fkey";

alter table "public"."user_presence" add constraint "user_presence_user_id_board_id_key" UNIQUE using index "user_presence_user_id_board_id_key";

alter table "public"."user_presence" add constraint "user_presence_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_presence" validate constraint "user_presence_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create policy "Authenticated users can create boards"
on "public"."boards"
as permissive
for insert
to authenticated
with check ((auth.uid() = created_by));


create policy "Authenticated users can view all boards"
on "public"."boards"
as permissive
for select
to authenticated
using (true);


create policy "Board creators can delete their boards"
on "public"."boards"
as permissive
for delete
to authenticated
using ((auth.uid() = created_by));


create policy "Board creators can update their boards"
on "public"."boards"
as permissive
for update
to authenticated
using ((auth.uid() = created_by));


create policy "Public profiles are viewable by authenticated users"
on "public"."profiles"
as permissive
for select
to authenticated
using (true);


create policy "Users can insert own profile"
on "public"."profiles"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));


create policy "Users can update own profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((auth.uid() = id));


create policy "Authenticated users can create tasks"
on "public"."tasks"
as permissive
for insert
to authenticated
with check ((auth.uid() = created_by));


create policy "Authenticated users can update tasks"
on "public"."tasks"
as permissive
for update
to authenticated
using (true);


create policy "Authenticated users can view all tasks"
on "public"."tasks"
as permissive
for select
to authenticated
using (true);


create policy "Task creators can delete their tasks"
on "public"."tasks"
as permissive
for delete
to authenticated
using ((auth.uid() = created_by));


create policy "Authenticated users can view presence"
on "public"."user_presence"
as permissive
for select
to authenticated
using (true);


create policy "Users can delete their own presence"
on "public"."user_presence"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own presence"
on "public"."user_presence"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own presence"
on "public"."user_presence"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


