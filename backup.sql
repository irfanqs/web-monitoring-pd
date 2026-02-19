--
-- PostgreSQL database dump
--

\restrict LbNnfscuwynDpQ7l9qpl28VewUEaQccNDfD7huSVVDAmtka8uUgnWEurnG7BWfY

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

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

--
-- Name: EmployeeRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EmployeeRole" AS ENUM (
    'VER',
    'PPRBPD',
    'OK',
    'BP',
    'OP',
    'PPK',
    'PPD',
    'ADK',
    'KSBU',
    'PABPD',
    'OSPM',
    'OSPBy'
);


ALTER TYPE public."EmployeeRole" OWNER TO postgres;

--
-- Name: SystemRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SystemRole" AS ENUM (
    'admin',
    'supervisor',
    'employee'
);


ALTER TYPE public."SystemRole" OWNER TO postgres;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'pending',
    'in_progress',
    'completed'
);


ALTER TYPE public."TicketStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.app_settings OWNER TO postgres;

--
-- Name: app_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.app_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.app_settings_id_seq OWNER TO postgres;

--
-- Name: app_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.app_settings_id_seq OWNED BY public.app_settings.id;


--
-- Name: step_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.step_configurations (
    id integer NOT NULL,
    step_number integer NOT NULL,
    step_name text NOT NULL,
    required_employee_role public."EmployeeRole" NOT NULL,
    description text,
    is_ls_only boolean DEFAULT false NOT NULL,
    is_non_ls_only boolean DEFAULT false NOT NULL,
    is_parallel boolean DEFAULT false NOT NULL,
    parallel_group text
);


ALTER TABLE public.step_configurations OWNER TO postgres;

--
-- Name: step_configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.step_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.step_configurations_id_seq OWNER TO postgres;

--
-- Name: step_configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.step_configurations_id_seq OWNED BY public.step_configurations.id;


--
-- Name: ticket_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_histories (
    id text NOT NULL,
    ticket_id text NOT NULL,
    step_number integer NOT NULL,
    processed_by_id text NOT NULL,
    processor_name text NOT NULL,
    file_url text,
    file_name text,
    notes text,
    processed_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ticket_histories OWNER TO postgres;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id text NOT NULL,
    ticket_number text NOT NULL,
    activity_name text NOT NULL,
    assignment_letter_number text NOT NULL,
    uraian text,
    start_date timestamp(3) without time zone NOT NULL,
    is_ls boolean DEFAULT false NOT NULL,
    current_step integer DEFAULT 1 NOT NULL,
    status public."TicketStatus" DEFAULT 'pending'::public."TicketStatus" NOT NULL,
    created_by_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    assigned_ppd_user_id_1 text,
    assigned_ppd_user_id_2 text
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    system_role public."SystemRole" NOT NULL,
    employee_role public."EmployeeRole",
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: app_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_settings ALTER COLUMN id SET DEFAULT nextval('public.app_settings_id_seq'::regclass);


--
-- Name: step_configurations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.step_configurations ALTER COLUMN id SET DEFAULT nextval('public.step_configurations_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
48878fe0-4917-4a1a-9439-ecacf8ffc79f	6b707f9a5af184ad1c9615a7735acab1dd1fceb822be8319c1852ed76bf0c749	2026-02-03 11:38:43.21401+07	20260203043843_add_assigned_ppd_user	\N	\N	2026-02-03 11:38:43.190492+07	1
17012f05-d7fe-4d19-9d52-cab51358ba27	fc7a5037a5f266f1df3e8d8ccb88a65b3d75fb37ca1530180ad5b73f985dd5a5	2026-02-03 11:41:11.04223+07	20260203044111_rename_ptpd_to_ppd_and_add_assigned_ppd	\N	\N	2026-02-03 11:41:11.025114+07	1
44884d39-364b-45e3-b131-f7340feee911	0bd59e996ab84f65d5f5a170c4b42a24bcc1a61ee435c6dbbc5bae751635dd9b	2026-02-03 15:06:07.468777+07	20260203080607_add_dual_ppd_assignment	\N	\N	2026-02-03 15:06:07.460322+07	1
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_settings (id, key, value, updated_at) FROM stdin;
1	letterNumberTemplate	{1}/Balmon.33/KP.01.06/{2}/{3}	2026-02-03 04:46:19.872
\.


--
-- Data for Name: step_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.step_configurations (id, step_number, step_name, required_employee_role, description, is_ls_only, is_non_ls_only, is_parallel, parallel_group) FROM stdin;
1	1	Verifikator	VER	Membuat rekapitulasi biaya perjalanan dinas berdasarkan Surat Tugas dan Nota Dinas Anggaran	t	f	t	A
2	2	Petugas Pembuat Rincian Biaya PD	PPRBPD	Membuat daftar nominatif biaya perjalanan dinas	t	f	t	A
3	3	Operator Komitmen	OK	Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI	t	f	t	A
4	4	Operator SPM	OSPM	Mengecek ketersediaan anggaran	t	f	f	\N
5	5	Operator Pembayaran	OP	Memasukkan nilai permohonan anggaran biaya ke aplikasi SAKTI	t	f	f	\N
6	6	Verifikator	VER	Memeriksa kelengkapan berkas perjalanan dinas dari pelaksana perjalanan dinas. Pilih status selisih: Nihil/Kurang/Lebih	f	f	f	\N
7	7	Petugas Pembuat Rincian Biaya PD	PPRBPD	Membuat rincian biaya perjalanan dinas	f	f	f	\N
8	8	Verifikator	VER	Memeriksa rincian biaya perjalanan dinas	f	f	f	\N
9	9	Operator SPBy	OSPBy	Memeriksa rincian biaya perjalanan dinas dibandingkan dengan permohonan anggaran biaya awal apakah ada selisih lebih untuk pengembalian atau tidak	f	f	f	\N
10	10	Bendahara Pengeluaran	BP	Menandatangani kuitansi dll berkas perjalanan dinas	f	f	f	\N
11	11	Pejabat Pembuat Komitmen	PPK	Menandatangani kuitansi dll berkas perjalanan dinas	f	f	f	\N
12	12	Pelaksana Perjalanan Dinas	PPD	Menandatangani kuitansi dll berkas perjalanan dinas	f	f	f	\N
13	13	Admin Digit Kemenkeu	ADK	Melakukan pengembalian selisih kelebihan anggaran ke MPN G3 Modul Penerimaan Negara versi G3 (Khusus LS)	t	f	f	\N
14	14	Kepala Sub Bagian Umum	KSBU	Menandatangani kuitansi dll berkas perjalanan dinas	f	f	f	\N
15	15	Petugas Arsip Berkas PD	PABPD	Mengarsipkan kuitansi dll berkas perjalanan dinas	f	f	f	\N
\.


--
-- Data for Name: ticket_histories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_histories (id, ticket_id, step_number, processed_by_id, processor_name, file_url, file_name, notes, processed_at, created_at) FROM stdin;
cml64hh380004msmye6xi6jy2	cml64hc0g0002msmyfite7wat	6	cml646xp30000s8g0axunonnv	[DEBUG] Admin User	\N	\N	[Admin Skip]	2026-02-03 04:52:49.988	2026-02-03 04:52:49.989
cml64hhdg0006msmyp7q4b11r	cml64hc0g0002msmyfite7wat	7	cml646xp30000s8g0axunonnv	[DEBUG] Admin User	\N	\N	[Admin Skip]	2026-02-03 04:52:50.356	2026-02-03 04:52:50.356
cml64hhz00008msmyppa6it1z	cml64hc0g0002msmyfite7wat	8	cml646xp30000s8g0axunonnv	[DEBUG] Admin User	\N	\N	[Admin Skip]	2026-02-03 04:52:51.131	2026-02-03 04:52:51.132
cml64hiqu000amsmygvf9ju9d	cml64hc0g0002msmyfite7wat	9	cml646xp30000s8g0axunonnv	[DEBUG] Admin User	\N	\N	[Admin Skip]	2026-02-03 04:52:52.134	2026-02-03 04:52:52.135
cml64hjf2000cmsmyy81eaij8	cml64hc0g0002msmyfite7wat	10	cml646xp30000s8g0axunonnv	[DEBUG] Admin User	\N	\N	[Admin Skip]	2026-02-03 04:52:53.005	2026-02-03 04:52:53.006
cml64hjyh000emsmyjap19qtb	cml64hc0g0002msmyfite7wat	11	cml646xp30000s8g0axunonnv	[DEBUG] Admin User	\N	\N	[Admin Skip]	2026-02-03 04:52:53.704	2026-02-03 04:52:53.705
cml69gh430003zt2ep3mathn7	cml69d1ee0001zt2euqpl2lor	6	cml646xpf0002s8g0o06vu4xt	Kusmono	\N	\N	tes\r\ncontoh\r\n3	2026-02-03 07:12:01.443	2026-02-03 07:12:01.444
cml6aga290003hzg66bp67koo	cml69d1ee0001zt2euqpl2lor	8	cml646xpf0002s8g0o06vu4xt	Kusmono	\N	\N	[DIKEMBALIKAN] perbaiki nilai hotel	2026-02-03 07:39:51.921	2026-02-03 07:39:51.922
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, ticket_number, activity_name, assignment_letter_number, uraian, start_date, is_ls, current_step, status, created_by_id, created_at, updated_at, assigned_ppd_user_id_1, assigned_ppd_user_id_2) FROM stdin;
cml646xq5000gs8g02w76lhjx	PD-202501	Perjalanan Dinas Monitoring Frekuensi 2025	ST/001/2025	\N	2025-03-15 00:00:00	t	16	completed	cml646xp30000s8g0axunonnv	2025-03-15 00:00:00	2026-02-03 04:44:38.333	\N	\N
cml646xq9000is8g0713xc3nr	PD-202502	Survei Infrastruktur Telekomunikasi 2025	ST/002/2025	\N	2025-05-20 00:00:00	f	16	completed	cml646xp30000s8g0axunonnv	2025-05-20 00:00:00	2026-02-03 04:44:38.338	\N	\N
cml646xqb000ks8g0spdykfh3	PD-202503	Koordinasi Penertiban Spektrum 2025	ST/003/2025	\N	2025-08-10 00:00:00	t	16	completed	cml646xp30000s8g0axunonnv	2025-08-10 00:00:00	2026-02-03 04:44:38.339	\N	\N
cml64hc0g0002msmyfite7wat	PD-202601	Pemantauan, Pengukuran Frekuensi Radio dan Standar Perangkat Pos Dan Informatika dan Pengukuran Kualitas Layanan Infrastruktur Digital Dalam Kota di Kota Semarang tanggal 1 Januari 2026.	001/Balmon.33/KP.01.06/01/2026	\N	2026-01-07 00:00:00	f	12	in_progress	cml646xp30000s8g0axunonnv	2026-02-03 04:52:43.408	2026-02-03 04:52:53.71	\N	\N
cml69d1ee0001zt2euqpl2lor	PD-202602	Pemantauan, Pengukuran Frekuensi Radio dan Standar Perangkat Pos Dan Informatika dan Pengukuran Kualitas Layanan Infrastruktur Digital Dalam Kota di Kota Semarang tanggal 2 Januari 2026. 	002/Balmon.33/KP.01.06/01/2026	\N	2026-01-07 00:00:00	f	7	in_progress	cml646xp30000s8g0axunonnv	2026-02-03 07:09:21.111	2026-02-03 07:39:51.924	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, name, system_role, employee_role, created_at, updated_at) FROM stdin;
cml646xp30000s8g0axunonnv	admin	$2a$10$QTCadCQ0EUsbVtrTUsplwuMob02yxNqmI4uhKeBnTeVYGiF4DJLrG	Admin User	admin	\N	2026-02-03 04:44:38.295	2026-02-03 04:44:38.295
cml646xpe0001s8g03zry4tr8	supervisor	$2a$10$OcuCLjkx2KH9yaggTUzYretzTyvVChgOId4NjNrA6KmPLggOeWUhu	Supervisor User	supervisor	\N	2026-02-03 04:44:38.307	2026-02-03 04:44:38.307
cml646xpk0006s8g0hkdmnw6z	ospm	$2a$10$romxWxvUmyrkV6pIBEAi8emlsSDGQQ47NUPOqZcDxLYyBzCutERha	Operator SPM User	employee	OSPM	2026-02-03 04:44:38.313	2026-02-03 04:44:38.313
cml646xpl0007s8g0hx2k11x6	op	$2a$10$r1PbMruDLCfORHSyv6r87.cj7LFVh51L99eCXcHo.sfcyEtrv/YIW	-	employee	OP	2026-02-03 04:44:38.314	2026-02-03 04:44:38.314
cml646xpn0008s8g0netma7n7	ospby	$2a$10$JNccphP6ib2PKe4YFZqXsOBZNNwYCbbiLh2RBYqZsv3TzVcYW0akO	Operator SPBy User	employee	OSPBy	2026-02-03 04:44:38.315	2026-02-03 04:44:38.315
cml646xpq000bs8g0llpr1pyw	ppd	$2a$10$l4GvzfDhEoBzNtKx4GZloeqecKMZrBisFsyPRGeSsUAXMv3TSHLuG	user1	employee	PPD	2026-02-03 04:44:38.318	2026-02-03 04:46:40.605
cml64fnd00000msmys02ihcba	ppd2	$2a$10$LFpwbZYavr.ZtD.IDpvu6exZXOsx3ANq447VAb0cCWJi2.9xS38a2	user2	employee	PPD	2026-02-03 04:51:24.805	2026-02-03 04:51:24.805
cml646xpt000es8g03kkma0cf	ilhamarsip	$2a$10$.MPQn5r/n595MU8BcbXu.eFcCFvgV8LYkT5vPt4tqMXJJ5EfvFxdy	Ilham	employee	PABPD	2026-02-03 04:44:38.321	2026-02-03 07:15:13.168
cml646xph0003s8g01rxmrffi	ilhampd	$2a$10$3gCP6AJOmMe5a.te4Lx6B.mx/pJrh62sHe7DqMUKl/bpqZcoWf.Km	Ilham	employee	PPRBPD	2026-02-03 04:44:38.309	2026-02-03 07:15:46.425
cml646xpi0004s8g067nahykc	ratih	$2a$10$lW6zU7P1/0gXs4b7IjOKFOvCGqALafxOAs/cn3BrsFKT8yDQM.veq	Ratih	employee	PPRBPD	2026-02-03 04:44:38.31	2026-02-03 07:15:55.823
cml646xpj0005s8g030verj7y	mami	$2a$10$md90.keObZqyrZkMhAQPuOopdV9eMPaB83w8GRpsU6yQPRzS1cUWe	Mami	employee	OK	2026-02-03 04:44:38.312	2026-02-03 07:17:13.002
cml646xpf0002s8g0o06vu4xt	verifikator	$2a$10$4Bk7qGZXiz8IlOGco3yqB.QVlY3A5/EWP/YWhd9/7WrYcnt7fe6Vq	Kusmono	employee	VER	2026-02-03 04:44:38.308	2026-02-03 07:37:28.742
cml646xpo0009s8g0c82koays	salma	$2a$10$vNieDnjycMoYp8YvJs/zVuE/1swdR6iD0BAubtY6oFxD2FwOGwqMu	Salma	employee	BP	2026-02-03 04:44:38.316	2026-02-03 07:37:51.785
cml646xpp000as8g0hr6f15h1	asbari	$2a$10$tKReQu8qel48iG.mJcxt4e.zwgXdkyHqN02xkfJqaNxaLvys1/1m.	Asbari	employee	PPK	2026-02-03 04:44:38.317	2026-02-03 07:38:00.852
cml646xpr000cs8g0yjrxo1ox	putri	$2a$10$DMlfjXQgkGYFNdxEFgvn4.wXaRi9vGid.txM7rGoGsm8Mrn3pGCSG	Putri	employee	ADK	2026-02-03 04:44:38.319	2026-02-03 07:38:13.808
cml646xps000ds8g0vxixt742	sutrisno	$2a$10$PYhV4gWany0MKjeWNoe1MerDsNhV5sri.33j8bz2jxcTfD8wN2pEy	Sutrisno	employee	KSBU	2026-02-03 04:44:38.32	2026-02-03 07:38:56.685
\.


--
-- Name: app_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.app_settings_id_seq', 1, true);


--
-- Name: step_configurations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.step_configurations_id_seq', 45, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: step_configurations step_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.step_configurations
    ADD CONSTRAINT step_configurations_pkey PRIMARY KEY (id);


--
-- Name: ticket_histories ticket_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_histories
    ADD CONSTRAINT ticket_histories_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: app_settings_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX app_settings_key_key ON public.app_settings USING btree (key);


--
-- Name: step_configurations_step_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX step_configurations_step_number_key ON public.step_configurations USING btree (step_number);


--
-- Name: tickets_ticket_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tickets_ticket_number_key ON public.tickets USING btree (ticket_number);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: ticket_histories ticket_histories_processed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_histories
    ADD CONSTRAINT ticket_histories_processed_by_id_fkey FOREIGN KEY (processed_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ticket_histories ticket_histories_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_histories
    ADD CONSTRAINT ticket_histories_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tickets tickets_assigned_ppd_user_id_1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_ppd_user_id_1_fkey FOREIGN KEY (assigned_ppd_user_id_1) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tickets tickets_assigned_ppd_user_id_2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_ppd_user_id_2_fkey FOREIGN KEY (assigned_ppd_user_id_2) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tickets tickets_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict LbNnfscuwynDpQ7l9qpl28VewUEaQccNDfD7huSVVDAmtka8uUgnWEurnG7BWfY

