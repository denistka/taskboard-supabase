


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."task_status" AS ENUM (
    'todo',
    'in_progress',
    'done'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."board_members" (
    "board_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "board_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."board_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."boards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."boards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_id" "uuid",
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "entity_type" character varying(50) DEFAULT 'task'::character varying
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."join_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "board_id" "uuid",
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "join_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."join_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "board_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."task_status" DEFAULT 'todo'::"public"."task_status" NOT NULL,
    "assigned_to" "uuid",
    "created_by" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_presence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "is_editing" boolean DEFAULT false,
    "editing_task_id" "uuid",
    "editing_fields" "text"[]
);


ALTER TABLE "public"."user_presence" OWNER TO "postgres";


ALTER TABLE ONLY "public"."board_members"
    ADD CONSTRAINT "board_members_pkey" PRIMARY KEY ("board_id", "user_id");



ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."join_requests"
    ADD CONSTRAINT "join_requests_board_id_user_id_status_key" UNIQUE ("board_id", "user_id", "status");



ALTER TABLE ONLY "public"."join_requests"
    ADD CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_user_id_board_id_key" UNIQUE ("user_id", "board_id");



CREATE INDEX "idx_board_members_board" ON "public"."board_members" USING "btree" ("board_id");



CREATE INDEX "idx_board_members_user" ON "public"."board_members" USING "btree" ("user_id");



CREATE INDEX "idx_boards_created_by" ON "public"."boards" USING "btree" ("owner_id");



CREATE INDEX "idx_comments_created" ON "public"."comments" USING "btree" ("created_at");



CREATE INDEX "idx_comments_entity" ON "public"."comments" USING "btree" ("entity_id");



CREATE INDEX "idx_comments_entity_type" ON "public"."comments" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_comments_user" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_join_requests_board" ON "public"."join_requests" USING "btree" ("board_id");



CREATE INDEX "idx_join_requests_status" ON "public"."join_requests" USING "btree" ("status");



CREATE INDEX "idx_join_requests_user" ON "public"."join_requests" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_board_id" ON "public"."tasks" USING "btree" ("board_id");



CREATE INDEX "idx_tasks_position" ON "public"."tasks" USING "btree" ("position");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_user_presence_board_editing_task" ON "public"."user_presence" USING "btree" ("board_id", "editing_task_id");



CREATE INDEX "idx_user_presence_board_id" ON "public"."user_presence" USING "btree" ("board_id");



CREATE INDEX "idx_user_presence_editing_task_id" ON "public"."user_presence" USING "btree" ("editing_task_id");



CREATE INDEX "idx_user_presence_last_seen" ON "public"."user_presence" USING "btree" ("last_seen");



CREATE UNIQUE INDEX "tasks_id_version_unique" ON "public"."tasks" USING "btree" ("id", "version");



CREATE OR REPLACE TRIGGER "update_boards_updated_at" BEFORE UPDATE ON "public"."boards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."board_members"
    ADD CONSTRAINT "board_members_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."board_members"
    ADD CONSTRAINT "board_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_created_by_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."join_requests"
    ADD CONSTRAINT "join_requests_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."join_requests"
    ADD CONSTRAINT "join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_editing_task_id_fkey" FOREIGN KEY ("editing_task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can create boards" ON "public"."boards" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Authenticated users can create tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Authenticated users can delete tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can see all task changes for realtime" ON "public"."tasks" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all boards" ON "public"."boards" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view presence" ON "public"."user_presence" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Board creators can delete their boards" ON "public"."boards" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Board creators can update their boards" ON "public"."boards" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Board members can create comments" ON "public"."comments" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM ("public"."tasks"
     JOIN "public"."board_members" ON (("board_members"."board_id" = "tasks"."board_id")))
  WHERE (("tasks"."id" = "comments"."entity_id") AND ("board_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Board members can create tasks" ON "public"."tasks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."board_members"
  WHERE (("board_members"."board_id" = "tasks"."board_id") AND ("board_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Board members can delete tasks" ON "public"."tasks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."board_members"
  WHERE (("board_members"."board_id" = "tasks"."board_id") AND ("board_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Board members can update tasks" ON "public"."tasks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."board_members"
  WHERE (("board_members"."board_id" = "tasks"."board_id") AND ("board_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Board members can view comments" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."tasks"
     JOIN "public"."board_members" ON (("board_members"."board_id" = "tasks"."board_id")))
  WHERE (("tasks"."id" = "comments"."entity_id") AND ("board_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Board members can view tasks" ON "public"."tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."board_members"
  WHERE (("board_members"."board_id" = "tasks"."board_id") AND ("board_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Board owners can delete their boards" ON "public"."boards" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Board owners can manage members" ON "public"."board_members" USING ((EXISTS ( SELECT 1
   FROM "public"."boards"
  WHERE (("boards"."id" = "board_members"."board_id") AND ("boards"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Board owners can update their boards" ON "public"."boards" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Board owners can view and manage requests" ON "public"."join_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."boards"
  WHERE (("boards"."id" = "join_requests"."board_id") AND ("boards"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Public profiles are viewable by authenticated users" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can create join requests" ON "public"."join_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own presence" ON "public"."user_presence" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own presence" ON "public"."user_presence" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM ("public"."tasks"
     JOIN "public"."board_members" ON (("board_members"."board_id" = "tasks"."board_id")))
  WHERE (("tasks"."id" = "comments"."entity_id") AND ("board_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own presence" ON "public"."user_presence" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view boards they are members of" ON "public"."boards" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."board_members"
  WHERE (("board_members"."board_id" = "boards"."id") AND ("board_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own memberships" ON "public"."board_members" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own requests" ON "public"."join_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."board_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."boards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "boards_policy" ON "public"."boards" USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."board_members"
  WHERE (("board_members"."board_id" = "boards"."id") AND ("board_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."join_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_presence" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."board_members" TO "anon";
GRANT ALL ON TABLE "public"."board_members" TO "authenticated";
GRANT ALL ON TABLE "public"."board_members" TO "service_role";



GRANT ALL ON TABLE "public"."boards" TO "anon";
GRANT ALL ON TABLE "public"."boards" TO "authenticated";
GRANT ALL ON TABLE "public"."boards" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."join_requests" TO "anon";
GRANT ALL ON TABLE "public"."join_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."join_requests" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."user_presence" TO "anon";
GRANT ALL ON TABLE "public"."user_presence" TO "authenticated";
GRANT ALL ON TABLE "public"."user_presence" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
