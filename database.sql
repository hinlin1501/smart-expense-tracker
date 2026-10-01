--
-- PostgreSQL database dump
--

\restrict mXLp3cUD5TCVbvtGeXhIiIwWmgFsfclrd3ea3FZOvDq7qCDm9aecfD2ZD6NgccD

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
1	Nguyen Van A	an@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
2	Banh Thi Kieu	diemlehoanhtrang@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
3	Huynh Tram Anh	ilovedurian@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
4	Le Ngoc Huyen	tonhoasen@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
5	Bui Ngoc	chuanghira@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
6	Nguyen Nhu Quynh	kieuuuuu@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
7	Bui Quoc Minh	minh@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
8	Duong Bao Tran	mithieutien@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
9	Nguyen Thi Thu Thao	tkutkao@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	user	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
10	Admin System	admin@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	admin	t	2026-09-20 23:22:36.909298	2026-09-20 23:22:36.909298
11	Nguyen Van Test	test@example.com	$2b$10$g40npERdFXXtzRaQ8pQYy./47wBeR6.hF9N8PulY24KNBoIopCr2K	user	t	2026-09-20 16:54:24.818	2026-09-20 16:54:24.818
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict mXLp3cUD5TCVbvtGeXhIiIwWmgFsfclrd3ea3FZOvDq7qCDm9aecfD2ZD6NgccD

