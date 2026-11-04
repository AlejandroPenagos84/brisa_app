--
-- PostgreSQL database dump
--

\restrict DBlKFfGEwgcc9xHjiDerzASTYICfXoqtIk0xbRxBjRPwawFV0HmdktZdN0YdjEH

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

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

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: banks; Type: TABLE; Schema: public; Owner: brisa_user
--

CREATE TABLE public.banks (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    country_id character varying(36) NOT NULL
);


ALTER TABLE public.banks OWNER TO brisa_user;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: brisa_user
--

CREATE TABLE public.cities (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    country_id character varying(36) NOT NULL
);


ALTER TABLE public.cities OWNER TO brisa_user;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: brisa_user
--

CREATE TABLE public.clients (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(150) NOT NULL,
    city_id character varying(36) NOT NULL,
    bank_id character varying(36) NOT NULL,
    account_number character varying(30) NOT NULL,
    account_type character varying(50) NOT NULL,
    balance numeric(12,2) DEFAULT 0 NOT NULL,
    CONSTRAINT chk_clients_balance CHECK ((balance >= (0)::numeric))
);


ALTER TABLE public.clients OWNER TO brisa_user;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: brisa_user
--

CREATE TABLE public.countries (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.countries OWNER TO brisa_user;

--
-- Name: owners; Type: TABLE; Schema: public; Owner: brisa_user
--

CREATE TABLE public.owners (
    id character varying(36) NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(150) NOT NULL,
    bank_id character varying(36) NOT NULL
);


ALTER TABLE public.owners OWNER TO brisa_user;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: brisa_user
--

CREATE TABLE public.properties (
    id character varying(36) NOT NULL,
    address character varying(200) NOT NULL,
    area numeric(10,2) NOT NULL,
    number_of_rooms integer NOT NULL,
    capacity integer NOT NULL,
    price_per_night numeric(12,2) NOT NULL,
    owner_id character varying(36) NOT NULL,
    city_id character varying(36) NOT NULL,
    manually_inactive boolean DEFAULT false NOT NULL
);


ALTER TABLE public.properties OWNER TO brisa_user;

--
-- Name: rentals; Type: TABLE; Schema: public; Owner: brisa_user
--

CREATE TABLE public.rentals (
    property_id character varying(36) NOT NULL,
    client_id character varying(36) NOT NULL,
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    charged_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'UPCOMING'::character varying NOT NULL,
    CONSTRAINT chk_rentals_dates CHECK ((check_out_date > check_in_date)),
    CONSTRAINT chk_rentals_status CHECK (((status)::text = ANY ((ARRAY['UPCOMING'::character varying, 'ACTIVE'::character varying, 'FINISHED'::character varying])::text[])))
);


ALTER TABLE public.rentals OWNER TO brisa_user;

--
-- Data for Name: banks; Type: TABLE DATA; Schema: public; Owner: brisa_user
--

COPY public.banks (id, name, country_id) FROM stdin;
b0000000-0000-4000-8000-000000000001	Bancolombia	11111111-1111-4111-8111-111111111111
b0000000-0000-4000-8000-000000000002	Davivienda	11111111-1111-4111-8111-111111111111
b0000000-0000-4000-8000-000000000003	BBVA México	22222222-2222-4222-8222-222222222222
b0000000-0000-4000-8000-000000000004	Santander	33333333-3333-4333-8333-333333333333
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: brisa_user
--

COPY public.cities (id, name, country_id) FROM stdin;
c0000000-0000-4000-8000-000000000001	Bogotá	11111111-1111-4111-8111-111111111111
c0000000-0000-4000-8000-000000000002	Medellín	11111111-1111-4111-8111-111111111111
c0000000-0000-4000-8000-000000000003	Ciudad de México	22222222-2222-4222-8222-222222222222
c0000000-0000-4000-8000-000000000004	Madrid	33333333-3333-4333-8333-333333333333
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: brisa_user
--

COPY public.clients (id, name, phone, email, city_id, bank_id, account_number, account_type, balance) FROM stdin;
d0000000-0000-4000-8000-000000000002	Diego Torres	3114445566	diego.torres@example.com	c0000000-0000-4000-8000-000000000002	b0000000-0000-4000-8000-000000000002	2003004002	Corriente	1200.50
d0000000-0000-4000-8000-000000000003	Valentina Ruiz	5522334455	valentina.ruiz@example.com	c0000000-0000-4000-8000-000000000003	b0000000-0000-4000-8000-000000000003	3004005003	Ahorros	250.00
d0000000-0000-4000-8000-000000000004	Andrés Herrera	34611222333	andres.herrera@example.com	c0000000-0000-4000-8000-000000000004	b0000000-0000-4000-8000-000000000004	4005006004	Corriente	0.00
c639aa12-c36e-4542-be44-60335db7b918	Alejandro Penagos	3183201277	alejo@example.com	c0000000-0000-4000-8000-000000000001	b0000000-0000-4000-8000-000000000002	1234567890	Ahorros	330.25
d0000000-0000-4000-8000-000000000001	Sofía Ramírez	3201112233	sofia.ramirez@example.com	c0000000-0000-4000-8000-000000000001	b0000000-0000-4000-8000-000000000001	1002003001	Ahorros	320.00
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: brisa_user
--

COPY public.countries (id, name) FROM stdin;
11111111-1111-4111-8111-111111111111	Colombia
22222222-2222-4222-8222-222222222222	México
33333333-3333-4333-8333-333333333333	España
\.


--
-- Data for Name: owners; Type: TABLE DATA; Schema: public; Owner: brisa_user
--

COPY public.owners (id, name, phone, email, bank_id) FROM stdin;
a0000000-0000-4000-8000-000000000001	Ana Gómez	3001234567	ana.gomez@example.com	b0000000-0000-4000-8000-000000000001
a0000000-0000-4000-8000-000000000002	Carlos Pérez	3109876543	carlos.perez@example.com	b0000000-0000-4000-8000-000000000002
a0000000-0000-4000-8000-000000000003	Laura Martínez	5512345678	laura.martinez@example.com	b0000000-0000-4000-8000-000000000003
a0000000-0000-4000-8000-000000000004	Javier López	34600111222	javier.lopez@example.com	b0000000-0000-4000-8000-000000000004
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: brisa_user
--

COPY public.properties (id, address, area, number_of_rooms, capacity, price_per_night, owner_id, city_id, manually_inactive) FROM stdin;
e0000000-0000-4000-8000-000000000001	Calle 45 #12-30, Chapinero	65.00	2	4	180.00	a0000000-0000-4000-8000-000000000001	c0000000-0000-4000-8000-000000000001	f
e0000000-0000-4000-8000-000000000002	Carrera 80 #34-12, Laureles	180.50	4	8	350.00	a0000000-0000-4000-8000-000000000002	c0000000-0000-4000-8000-000000000002	f
e0000000-0000-4000-8000-000000000003	Calle Colima 210, Roma Norte	45.00	1	2	220.00	a0000000-0000-4000-8000-000000000003	c0000000-0000-4000-8000-000000000003	f
e0000000-0000-4000-8000-000000000004	Calle del Pez 18, Malasaña	80.00	3	5	300.00	a0000000-0000-4000-8000-000000000004	c0000000-0000-4000-8000-000000000004	f
e0000000-0000-4000-8000-000000000005	Carrera 43A #7-50, El Poblado	40.00	1	2	160.00	a0000000-0000-4000-8000-000000000001	c0000000-0000-4000-8000-000000000002	f
\.


--
-- Data for Name: rentals; Type: TABLE DATA; Schema: public; Owner: brisa_user
--

COPY public.rentals (property_id, client_id, check_in_date, check_out_date, charged_amount, status) FROM stdin;
e0000000-0000-4000-8000-000000000001	d0000000-0000-4000-8000-000000000001	2026-11-10	2026-11-15	900.00	UPCOMING
e0000000-0000-4000-8000-000000000002	d0000000-0000-4000-8000-000000000002	2026-11-20	2026-11-25	1750.00	UPCOMING
e0000000-0000-4000-8000-000000000003	d0000000-0000-4000-8000-000000000003	2026-12-01	2026-12-07	1320.00	UPCOMING
e0000000-0000-4000-8000-000000000004	d0000000-0000-4000-8000-000000000004	2026-12-10	2026-12-15	1500.00	UPCOMING
e0000000-0000-4000-8000-000000000001	d0000000-0000-4000-8000-000000000002	2026-12-20	2026-12-27	1260.00	UPCOMING
e0000000-0000-4000-8000-000000000005	d0000000-0000-4000-8000-000000000001	2026-12-05	2026-12-09	640.00	UPCOMING
e0000000-0000-4000-8000-000000000002	d0000000-0000-4000-8000-000000000001	2027-01-05	2027-01-12	2450.00	UPCOMING
e0000000-0000-4000-8000-000000000001	c639aa12-c36e-4542-be44-60335db7b918	2026-11-16	2026-11-20	720.00	UPCOMING
e0000000-0000-4000-8000-000000000001	d0000000-0000-4000-8000-000000000001	2026-12-01	2026-12-02	180.00	UPCOMING
\.


--
-- Name: banks banks_pkey; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: rentals excl_rentals_client_period; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT excl_rentals_client_period EXCLUDE USING gist (client_id WITH =, daterange(check_in_date, check_out_date, '[]'::text) WITH &&);


--
-- Name: rentals excl_rentals_property_period; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT excl_rentals_property_period EXCLUDE USING gist (property_id WITH =, daterange(check_in_date, check_out_date, '[]'::text) WITH &&);


--
-- Name: owners owners_pkey; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: rentals rentals_pkey; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_pkey PRIMARY KEY (property_id, client_id, check_in_date);


--
-- Name: clients uq_clients_bank_account; Type: CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT uq_clients_bank_account UNIQUE (bank_id, account_number);


--
-- Name: uq_clients_email_lower; Type: INDEX; Schema: public; Owner: brisa_user
--

CREATE UNIQUE INDEX uq_clients_email_lower ON public.clients USING btree (lower((email)::text));


--
-- Name: uq_owners_email_lower; Type: INDEX; Schema: public; Owner: brisa_user
--

CREATE UNIQUE INDEX uq_owners_email_lower ON public.owners USING btree (lower((email)::text));


--
-- Name: banks banks_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: cities cities_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: clients clients_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.banks(id);


--
-- Name: clients clients_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: owners owners_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.banks(id);


--
-- Name: properties properties_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: properties properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id);


--
-- Name: rentals rentals_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: rentals rentals_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: brisa_user
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- PostgreSQL database dump complete
--

\unrestrict DBlKFfGEwgcc9xHjiDerzASTYICfXoqtIk0xbRxBjRPwawFV0HmdktZdN0YdjEH

