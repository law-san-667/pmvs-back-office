--
-- PostgreSQL database dump
--

\restrict ynQgVJHdc6Zz7ltNLWQkFnsAYSc56u8Tnes7mWcdojZsJVKrt4DK0VlskUb213Y

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6 (Homebrew)

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
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

--
-- Name: ad_placement; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ad_placement AS ENUM (
    'HOME_BANNER',
    'CATEGORY_SIDEBAR',
    'LISTING_DETAIL',
    'SEARCH_RESULTS'
);


ALTER TYPE public.ad_placement OWNER TO postgres;

--
-- Name: auth_device_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.auth_device_type AS ENUM (
    'WEB',
    'MOBILE'
);


ALTER TYPE public.auth_device_type OWNER TO postgres;

--
-- Name: bid_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.bid_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN',
    'EXPIRED'
);


ALTER TYPE public.bid_status OWNER TO postgres;

--
-- Name: business_member_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.business_member_role AS ENUM (
    'OWNER',
    'ADMIN',
    'MEMBER'
);


ALTER TYPE public.business_member_role OWNER TO postgres;

--
-- Name: business_member_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.business_member_status AS ENUM (
    'INVITED',
    'ACTIVE',
    'SUSPENDED',
    'REMOVED'
);


ALTER TYPE public.business_member_status OWNER TO postgres;

--
-- Name: business_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.business_category AS ENUM (
    'PHYSICAL_PERSON',
    'SME',
    'LARGE_ENTERPRISE'
);


ALTER TYPE public.business_category OWNER TO postgres;

--
-- Name: business_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.business_status AS ENUM (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'DELETED'
);


ALTER TYPE public.business_status OWNER TO postgres;

--
-- Name: cart_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cart_status AS ENUM (
    'ACTIVE',
    'FORGOTTEN'
);


ALTER TYPE public.cart_status OWNER TO postgres;

--
-- Name: conversation_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.conversation_type AS ENUM (
    'DIRECT',
    'TENDER',
    'ORDER',
    'SUPPORT'
);


ALTER TYPE public.conversation_type OWNER TO postgres;

--
-- Name: listing_condition; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.listing_condition AS ENUM (
    'NEW',
    'LIKE_NEW',
    'USED',
    'REFURBISHED'
);


ALTER TYPE public.listing_condition OWNER TO postgres;

--
-- Name: listing_availability_channel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.listing_availability_channel AS ENUM (
    'WEBSITE',
    'MARKETPLACE',
    'OFFLINE',
    'ALL'
);


ALTER TYPE public.listing_availability_channel OWNER TO postgres;

--
-- Name: listing_exposure; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.listing_exposure AS ENUM (
    'NATIONAL',
    'INTERNATIONAL',
    'BOTH'
);


ALTER TYPE public.listing_exposure OWNER TO postgres;

--
-- Name: listing_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.listing_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'PAUSED',
    'SOLD',
    'ARCHIVED'
);


ALTER TYPE public.listing_status OWNER TO postgres;

--
-- Name: listing_stock_policy; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.listing_stock_policy AS ENUM (
    'ACCEPT_ORDERS',
    'REFUSE_ORDERS'
);


ALTER TYPE public.listing_stock_policy OWNER TO postgres;

--
-- Name: market_price_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.market_price_type AS ENUM (
    'B2C',
    'B2B'
);


ALTER TYPE public.market_price_type OWNER TO postgres;

--
-- Name: message_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.message_type AS ENUM (
    'TEXT',
    'IMAGE',
    'FILE',
    'SYSTEM'
);


ALTER TYPE public.message_type OWNER TO postgres;

--
-- Name: notification_channel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_channel AS ENUM (
    'IN_APP',
    'EMAIL',
    'SMS',
    'PUSH'
);


ALTER TYPE public.notification_channel OWNER TO postgres;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'ORDER',
    'BID',
    'TENDER',
    'MESSAGE',
    'SYSTEM',
    'PROMOTION'
);


ALTER TYPE public.notification_type OWNER TO postgres;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: otp_destination_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.otp_destination_type AS ENUM (
    'PHONE',
    'EMAIL'
);


ALTER TYPE public.otp_destination_type OWNER TO postgres;

--
-- Name: otp_purpose; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.otp_purpose AS ENUM (
    'LOGIN',
    'REGISTER',
    'PASSWORD_RESET',
    'VERIFY_EMAIL',
    'VERIFY_PHONE'
);


ALTER TYPE public.otp_purpose OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'CASH',
    'WAVE',
    'ORANGE_MONEY'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'SUCCEEDED',
    'CANCELLED',
    'ERRORED'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: report_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.report_status AS ENUM (
    'PENDING',
    'REVIEWING',
    'RESOLVED',
    'DISMISSED'
);


ALTER TYPE public.report_status OWNER TO postgres;

--
-- Name: report_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.report_type AS ENUM (
    'LISTING',
    'USER',
    'BUSINESS',
    'REVIEW'
);


ALTER TYPE public.report_type OWNER TO postgres;

--
-- Name: session_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.session_status AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'LOGGED_OUT'
);


ALTER TYPE public.session_status OWNER TO postgres;

--
-- Name: tender_response_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tender_response_status AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'SHORTLISTED',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN'
);


ALTER TYPE public.tender_response_status OWNER TO postgres;

--
-- Name: tender_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tender_status AS ENUM (
    'DRAFT',
    'OPEN',
    'EVALUATION',
    'AWARDED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public.tender_status OWNER TO postgres;

--
-- Name: tender_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tender_type AS ENUM (
    'SUPPLY',
    'SERVICE',
    'WORKS',
    'INTELLECTUAL_SERVICE'
);


ALTER TYPE public.tender_type OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'CLIENT',
    'SELLER',
    'MODERATOR',
    'ADMIN',
    'OPERATOR'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'PENDING_VERIFICATION',
    'ACTIVE',
    'SUSPENDED',
    'DELETED'
);


ALTER TYPE public.user_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    business_id uuid,
    label text,
    street text,
    city text NOT NULL,
    state text,
    country_code text NOT NULL,
    postal_code text,
    latitude numeric,
    longitude numeric,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT addresses_owner_required_check CHECK (((user_id IS NOT NULL) OR (business_id IS NOT NULL)))
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- Name: advertisements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advertisements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    title text NOT NULL,
    image_url text NOT NULL,
    target_url text,
    placement public.ad_placement NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.advertisements OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: bids; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bids (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    bidder_id uuid NOT NULL,
    amount_minor integer NOT NULL,
    note text,
    status public.bid_status DEFAULT 'PENDING'::public.bid_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bids_amount_minor_positive_check CHECK ((amount_minor > 0))
);


ALTER TABLE public.bids OWNER TO postgres;

--
-- Name: business_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.business_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.business_member_role DEFAULT 'MEMBER'::public.business_member_role NOT NULL,
    status public.business_member_status DEFAULT 'INVITED'::public.business_member_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.business_members OWNER TO postgres;

--
-- Name: businesses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    country_code text NOT NULL,
    legal_documents jsonb DEFAULT '[]'::jsonb NOT NULL,
    status public.business_status DEFAULT 'PENDING_VERIFICATION'::public.business_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    image text,
    city_slug text NOT NULL,
    address text,
    delivery_zones text[] DEFAULT '{}'::text[] NOT NULL,
    whatsapp_phone text,
    contact_email text,
    facebook_link text,
    instagram_link text,
    orange_money_number text,
    wave_number text,
    business_category public.business_category DEFAULT 'PHYSICAL_PERSON'::public.business_category NOT NULL,
    legal_business_information jsonb,
    legal_business_questions jsonb,
    overall_rating double precision DEFAULT 0 NOT NULL,
    CONSTRAINT businesses_overall_rating_range_check CHECK (((overall_rating >= (0)::double precision) AND (overall_rating <= (5)::double precision)))
);


ALTER TABLE public.businesses OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cart_items_quantity_positive_check CHECK ((quantity > 0))
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status public.cart_status DEFAULT 'ACTIVE'::public.cart_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.carts OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_service boolean DEFAULT false NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cities (
    country_code text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cities OWNER TO postgres;

--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone
);


ALTER TABLE public.conversation_participants OWNER TO postgres;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type public.conversation_type DEFAULT 'DIRECT'::public.conversation_type NOT NULL,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    customer_id uuid,
    business_id uuid
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    code text NOT NULL,
    name text NOT NULL,
    currency_code text NOT NULL,
    phone_prefix text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_id uuid,
    listing_id uuid,
    tender_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT favorites_exactly_one_target_check CHECK ((((
CASE
    WHEN (business_id IS NULL) THEN 0
    ELSE 1
END +
CASE
    WHEN (listing_id IS NULL) THEN 0
    ELSE 1
END) +
CASE
    WHEN (tender_id IS NULL) THEN 0
    ELSE 1
END) = 1))
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: listing_market_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listing_market_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listing_id uuid NOT NULL,
    country_code text NOT NULL,
    price_type public.market_price_type NOT NULL,
    currency text DEFAULT 'XOF'::text NOT NULL,
    price_amount_minor integer NOT NULL,
    vat_rate_percent numeric(5,2),
    vmp_commission_percent numeric(5,2),
    ddp_price_amount_minor integer,
    agent_commission_percent numeric(5,2),
    min_order_quantity integer,
    cartons_per_pallet integer,
    container_type text,
    units_per_container integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT listing_market_prices_price_non_negative_check CHECK ((price_amount_minor >= 0))
);


ALTER TABLE public.listing_market_prices OWNER TO postgres;

--
-- Name: listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    created_by_user_id uuid,
    title text NOT NULL,
    description text,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    condition public.listing_condition DEFAULT 'USED'::public.listing_condition NOT NULL,
    status public.listing_status DEFAULT 'DRAFT'::public.listing_status NOT NULL,
    price_amount_minor integer NOT NULL,
    currency text DEFAULT 'XOF'::text NOT NULL,
    quantity_available integer DEFAULT 1 NOT NULL,
    location text,
    country_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    specifics_sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_service boolean DEFAULT false NOT NULL,
    cities jsonb DEFAULT '[]'::jsonb NOT NULL,
    category_id uuid NOT NULL,
    sub_category_id uuid NOT NULL,
    is_fragile boolean,
    validity_period integer,
    origin text,
    destination jsonb,
    total_rating_score integer DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    video text,
    brand text,
    model text,
    supplier_role text,
    production_capacity text,
    lead_time text,
    min_order_quantity integer,
    certification text,
    incoterm text,
    launch_date date,
    gs1_reference text,
    internal_reference text,
    region text,
    exposure public.listing_exposure,
    short_description text,
    hs_code text,
    ean13 text,
    cup_code text,
    ready_to_ship boolean,
    available_on public.listing_availability_channel,
    storage_location text,
    out_of_stock_policy public.listing_stock_policy,
    special_delivery_time text,
    transporters text,
    logistics jsonb,
    editorial jsonb,
    seo jsonb,
    certificates jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT listings_min_order_quantity_non_negative_check CHECK ((min_order_quantity >= 0)),
    CONSTRAINT listings_quantity_available_positive_check CHECK ((quantity_available > 0)),
    CONSTRAINT listings_review_count_non_negative_check CHECK ((review_count >= 0)),
    CONSTRAINT listings_total_rating_score_non_negative_check CHECK ((total_rating_score >= 0)),
    CONSTRAINT listings_validity_period_non_negative_check CHECK ((validity_period >= 0))
);


ALTER TABLE public.listings OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    type public.message_type DEFAULT 'TEXT'::public.message_type NOT NULL,
    content text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    channel public.notification_channel DEFAULT 'IN_APP'::public.notification_channel NOT NULL,
    title text NOT NULL,
    body text,
    data jsonb DEFAULT '{}'::jsonb,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: operator_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operator_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operator_user_id uuid NOT NULL,
    business_id uuid NOT NULL,
    assigned_by_user_id uuid NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.operator_assignments OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price_minor integer NOT NULL,
    total_price_minor integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_items_quantity_positive_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_total_price_non_negative_check CHECK ((total_price_minor >= 0)),
    CONSTRAINT order_items_unit_price_non_negative_check CHECK ((unit_price_minor >= 0))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    from_status public.order_status,
    to_status public.order_status NOT NULL,
    changed_by_user_id uuid,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_status_history OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid NOT NULL,
    business_id uuid NOT NULL,
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    total_amount_minor integer NOT NULL,
    currency text DEFAULT 'XOF'::text NOT NULL,
    shipping_address jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_method public.payment_method DEFAULT 'CASH'::public.payment_method NOT NULL,
    CONSTRAINT orders_total_amount_positive_check CHECK ((total_amount_minor > 0))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: otps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    identifier text NOT NULL,
    code_hash text NOT NULL,
    purpose public.otp_purpose DEFAULT 'LOGIN'::public.otp_purpose NOT NULL,
    destination public.otp_destination_type NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT otps_attempt_count_non_negative_check CHECK ((attempt_count >= 0))
);


ALTER TABLE public.otps OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    payer_user_id uuid NOT NULL,
    method public.payment_method NOT NULL,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    amount_minor integer NOT NULL,
    currency text NOT NULL,
    transaction_reference text,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payments_amount_positive_check CHECK ((amount_minor > 0)),
    CONSTRAINT payments_failure_reason_check CHECK ((((status = ANY (ARRAY['CANCELLED'::public.payment_status, 'ERRORED'::public.payment_status])) AND (failure_reason IS NOT NULL)) OR ((status <> ALL (ARRAY['CANCELLED'::public.payment_status, 'ERRORED'::public.payment_status])) AND (failure_reason IS NULL)))),
    CONSTRAINT payments_transaction_reference_check CHECK ((((method = 'CASH'::public.payment_method) AND (transaction_reference IS NULL)) OR ((method = ANY (ARRAY['WAVE'::public.payment_method, 'ORANGE_MONEY'::public.payment_method])) AND (transaction_reference IS NOT NULL))))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: popular_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.popular_categories (
    country_code text NOT NULL,
    category_id uuid NOT NULL,
    rank integer NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT popular_categories_rank_check CHECK (((rank >= 1) AND (rank <= 3)))
);


ALTER TABLE public.popular_categories OWNER TO postgres;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid NOT NULL,
    type public.report_type NOT NULL,
    target_id uuid NOT NULL,
    reason text NOT NULL,
    description text,
    status public.report_status DEFAULT 'PENDING'::public.report_status NOT NULL,
    resolved_by_user_id uuid,
    resolution_note text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: review_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    responder_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.review_responses OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reviewer_id uuid NOT NULL,
    business_id uuid NOT NULL,
    listing_id uuid,
    order_id uuid,
    rating integer NOT NULL,
    title text,
    comment text,
    is_verified_purchase boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    media jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT reviews_rating_range_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    refresh_token_hash text NOT NULL,
    device public.auth_device_type NOT NULL,
    origin text NOT NULL,
    ip_address text,
    user_agent text,
    status public.session_status DEFAULT 'ACTIVE'::public.session_status NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    last_used_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sessions_expiry_after_creation_check CHECK ((expires_at >= created_at))
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: sub_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sub_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_service boolean DEFAULT false NOT NULL
);


ALTER TABLE public.sub_categories OWNER TO postgres;

--
-- Name: tender_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tender_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tender_id uuid NOT NULL,
    responder_business_id uuid NOT NULL,
    responder_user_id uuid NOT NULL,
    cover_letter text,
    proposed_amount_minor integer NOT NULL,
    currency text DEFAULT 'XOF'::text NOT NULL,
    documents jsonb DEFAULT '[]'::jsonb NOT NULL,
    status public.tender_response_status DEFAULT 'SUBMITTED'::public.tender_response_status NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tender_responses_amount_positive_check CHECK ((proposed_amount_minor > 0))
);


ALTER TABLE public.tender_responses OWNER TO postgres;

--
-- Name: tenders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    publisher_user_id uuid NOT NULL,
    publisher_business_id uuid,
    title text NOT NULL,
    description text,
    type public.tender_type NOT NULL,
    status public.tender_status DEFAULT 'DRAFT'::public.tender_status NOT NULL,
    budget_min_minor integer,
    budget_max_minor integer,
    currency text DEFAULT 'XOF'::text NOT NULL,
    requirements jsonb DEFAULT '[]'::jsonb NOT NULL,
    documents jsonb DEFAULT '[]'::jsonb NOT NULL,
    location text,
    country_code text NOT NULL,
    submission_deadline timestamp with time zone NOT NULL,
    evaluation_deadline timestamp with time zone,
    awarded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category_id uuid NOT NULL,
    sub_category_id uuid NOT NULL,
    CONSTRAINT tenders_budget_range_check CHECK (((budget_min_minor IS NULL) OR (budget_max_minor IS NULL) OR (budget_max_minor >= budget_min_minor))),
    CONSTRAINT tenders_deadline_after_creation_check CHECK ((submission_deadline > created_at))
);


ALTER TABLE public.tenders OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    phone_number text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    profile_image text,
    country_code text,
    role public.user_role DEFAULT 'CLIENT'::public.user_role NOT NULL,
    password_hash text NOT NULL,
    status public.user_status DEFAULT 'PENDING_VERIFICATION'::public.user_status NOT NULL,
    email_verified_at timestamp with time zone,
    phone_verified_at timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notification_token text,
    CONSTRAINT users_contact_required_check CHECK (((email IS NOT NULL) OR (phone_number IS NOT NULL)))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wishlists OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: advertisements advertisements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertisements
    ADD CONSTRAINT advertisements_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: business_members business_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_members
    ADD CONSTRAINT business_members_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (slug);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (code);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: listing_market_prices listing_market_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_market_prices
    ADD CONSTRAINT listing_market_prices_pkey PRIMARY KEY (id);


--
-- Name: listings listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: operator_assignments operator_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_assignments
    ADD CONSTRAINT operator_assignments_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: popular_categories popular_categories_country_code_rank_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.popular_categories
    ADD CONSTRAINT popular_categories_country_code_rank_pk PRIMARY KEY (country_code, rank);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: review_responses review_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sub_categories sub_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT sub_categories_pkey PRIMARY KEY (id);


--
-- Name: tender_responses tender_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tender_responses
    ADD CONSTRAINT tender_responses_pkey PRIMARY KEY (id);


--
-- Name: tenders tenders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: addresses_business_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX addresses_business_id_idx ON public.addresses USING btree (business_id);


--
-- Name: addresses_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX addresses_user_id_idx ON public.addresses USING btree (user_id);


--
-- Name: advertisements_business_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX advertisements_business_id_idx ON public.advertisements USING btree (business_id);


--
-- Name: advertisements_dates_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX advertisements_dates_idx ON public.advertisements USING btree (starts_at, ends_at);


--
-- Name: advertisements_placement_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX advertisements_placement_active_idx ON public.advertisements USING btree (placement, is_active);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_entity_idx ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: bids_bidder_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bids_bidder_id_idx ON public.bids USING btree (bidder_id);


--
-- Name: bids_listing_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bids_listing_status_idx ON public.bids USING btree (listing_id, status);


--
-- Name: business_members_business_user_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX business_members_business_user_unique_idx ON public.business_members USING btree (business_id, user_id);


--
-- Name: business_members_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX business_members_status_idx ON public.business_members USING btree (status);


--
-- Name: business_members_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX business_members_user_id_idx ON public.business_members USING btree (user_id);


--
-- Name: businesses_city_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX businesses_city_slug_idx ON public.businesses USING btree (city_slug);


--
-- Name: businesses_country_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX businesses_country_code_idx ON public.businesses USING btree (country_code);


--
-- Name: businesses_country_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX businesses_country_status_idx ON public.businesses USING btree (country_code, status);


--
-- Name: businesses_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX businesses_name_idx ON public.businesses USING btree (name);


--
-- Name: businesses_business_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX businesses_business_category_idx ON public.businesses USING btree (business_category);


--
-- Name: businesses_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX businesses_slug_idx ON public.businesses USING btree (slug);


--
-- Name: businesses_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX businesses_status_idx ON public.businesses USING btree (status);


--
-- Name: cart_items_cart_listing_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cart_items_cart_listing_unique_idx ON public.cart_items USING btree (cart_id, listing_id);


--
-- Name: cart_items_listing_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cart_items_listing_id_idx ON public.cart_items USING btree (listing_id);


--
-- Name: carts_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX carts_status_idx ON public.carts USING btree (status);


--
-- Name: carts_user_id_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX carts_user_id_unique_idx ON public.carts USING btree (user_id);


--
-- Name: categories_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_is_active_idx ON public.categories USING btree (is_active);


--
-- Name: categories_is_service_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_is_service_idx ON public.categories USING btree (is_service);


--
-- Name: categories_slug_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_slug_unique_idx ON public.categories USING btree (slug);


--
-- Name: cities_country_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cities_country_code_idx ON public.cities USING btree (country_code);


--
-- Name: cities_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cities_is_active_idx ON public.cities USING btree (is_active);


--
-- Name: conversation_participants_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX conversation_participants_unique_idx ON public.conversation_participants USING btree (conversation_id, user_id);


--
-- Name: conversation_participants_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversation_participants_user_id_idx ON public.conversation_participants USING btree (user_id);


--
-- Name: conversations_business_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_business_id_idx ON public.conversations USING btree (business_id);


--
-- Name: conversations_customer_business_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX conversations_customer_business_unique_idx ON public.conversations USING btree (customer_id, business_id);


--
-- Name: conversations_customer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_customer_id_idx ON public.conversations USING btree (customer_id);


--
-- Name: conversations_reference_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_reference_id_idx ON public.conversations USING btree (reference_id);


--
-- Name: conversations_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_type_idx ON public.conversations USING btree (type);


--
-- Name: countries_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX countries_is_active_idx ON public.countries USING btree (is_active);


--
-- Name: favorites_user_business_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX favorites_user_business_unique_idx ON public.favorites USING btree (user_id, business_id) WHERE (business_id IS NOT NULL);


--
-- Name: favorites_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX favorites_user_id_idx ON public.favorites USING btree (user_id);


--
-- Name: favorites_user_listing_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX favorites_user_listing_unique_idx ON public.favorites USING btree (user_id, listing_id) WHERE (listing_id IS NOT NULL);


--
-- Name: favorites_user_tender_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX favorites_user_tender_unique_idx ON public.favorites USING btree (user_id, tender_id) WHERE (tender_id IS NOT NULL);


--
-- Name: listings_business_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_business_status_idx ON public.listings USING btree (business_id, status);


--
-- Name: listings_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_category_id_idx ON public.listings USING btree (category_id);


--
-- Name: listings_country_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_country_code_idx ON public.listings USING btree (country_code);


--
-- Name: listings_country_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_country_status_idx ON public.listings USING btree (country_code, status);


--
-- Name: listings_created_by_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_created_by_user_id_idx ON public.listings USING btree (created_by_user_id);


--
-- Name: listings_is_service_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_is_service_idx ON public.listings USING btree (is_service);


--
-- Name: listings_price_amount_minor_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_price_amount_minor_idx ON public.listings USING btree (price_amount_minor);


--
-- Name: listing_market_prices_country_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listing_market_prices_country_type_idx ON public.listing_market_prices USING btree (country_code, price_type);


--
-- Name: listing_market_prices_listing_country_type_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX listing_market_prices_listing_country_type_unique_idx ON public.listing_market_prices USING btree (listing_id, country_code, price_type);


--
-- Name: listing_market_prices_listing_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listing_market_prices_listing_id_idx ON public.listing_market_prices USING btree (listing_id);


--
-- Name: listings_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_status_idx ON public.listings USING btree (status);


--
-- Name: listings_sub_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_sub_category_id_idx ON public.listings USING btree (sub_category_id);


--
-- Name: messages_conversation_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_conversation_created_idx ON public.messages USING btree (conversation_id, created_at);


--
-- Name: messages_sender_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_sender_id_idx ON public.messages USING btree (sender_id);


--
-- Name: notifications_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_type_idx ON public.notifications USING btree (type);


--
-- Name: notifications_user_created_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_created_idx ON public.notifications USING btree (user_id, created_at);


--
-- Name: notifications_user_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_read_idx ON public.notifications USING btree (user_id, read_at);


--
-- Name: operator_assignments_business_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX operator_assignments_business_active_idx ON public.operator_assignments USING btree (business_id, is_active);


--
-- Name: operator_assignments_operator_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX operator_assignments_operator_active_idx ON public.operator_assignments USING btree (operator_user_id, is_active);


--
-- Name: operator_assignments_operator_business_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX operator_assignments_operator_business_unique_idx ON public.operator_assignments USING btree (operator_user_id, business_id);


--
-- Name: order_items_listing_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_listing_id_idx ON public.order_items USING btree (listing_id);


--
-- Name: order_items_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);


--
-- Name: order_status_history_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_status_history_created_at_idx ON public.order_status_history USING btree (created_at);


--
-- Name: order_status_history_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX order_status_history_order_id_idx ON public.order_status_history USING btree (order_id);


--
-- Name: orders_business_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_business_id_status_idx ON public.orders USING btree (business_id, status);


--
-- Name: orders_buyer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_buyer_id_idx ON public.orders USING btree (buyer_id);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: otps_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otps_expires_at_idx ON public.otps USING btree (expires_at);


--
-- Name: otps_identifier_lookup_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otps_identifier_lookup_idx ON public.otps USING btree (identifier, purpose, destination);


--
-- Name: otps_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX otps_user_id_idx ON public.otps USING btree (user_id);


--
-- Name: payments_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_created_at_idx ON public.payments USING btree (created_at);


--
-- Name: payments_method_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_method_status_idx ON public.payments USING btree (method, status);


--
-- Name: payments_order_id_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_order_id_unique_idx ON public.payments USING btree (order_id);


--
-- Name: payments_payer_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_payer_user_id_idx ON public.payments USING btree (payer_user_id);


--
-- Name: payments_transaction_reference_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_transaction_reference_unique_idx ON public.payments USING btree (transaction_reference);


--
-- Name: popular_categories_country_category_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX popular_categories_country_category_unique_idx ON public.popular_categories USING btree (country_code, category_id);


--
-- Name: reports_reporter_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_reporter_id_idx ON public.reports USING btree (reporter_id);


--
-- Name: reports_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_status_idx ON public.reports USING btree (status);


--
-- Name: reports_target_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_target_id_idx ON public.reports USING btree (target_id);


--
-- Name: reports_type_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_type_status_idx ON public.reports USING btree (type, status);


--
-- Name: review_responses_responder_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_responses_responder_id_idx ON public.review_responses USING btree (responder_id);


--
-- Name: review_responses_review_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX review_responses_review_unique_idx ON public.review_responses USING btree (review_id);


--
-- Name: reviews_business_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_business_id_idx ON public.reviews USING btree (business_id);


--
-- Name: reviews_listing_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_listing_id_idx ON public.reviews USING btree (listing_id);


--
-- Name: reviews_reviewer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_reviewer_id_idx ON public.reviews USING btree (reviewer_id);


--
-- Name: reviews_reviewer_listing_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX reviews_reviewer_listing_unique_idx ON public.reviews USING btree (reviewer_id, listing_id);


--
-- Name: sessions_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_expires_at_idx ON public.sessions USING btree (expires_at);


--
-- Name: sessions_refresh_token_hash_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sessions_refresh_token_hash_unique_idx ON public.sessions USING btree (refresh_token_hash);


--
-- Name: sessions_token_hash_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sessions_token_hash_unique_idx ON public.sessions USING btree (token_hash);


--
-- Name: sessions_user_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_status_idx ON public.sessions USING btree (user_id, status);


--
-- Name: sub_categories_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sub_categories_category_id_idx ON public.sub_categories USING btree (category_id);


--
-- Name: sub_categories_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sub_categories_is_active_idx ON public.sub_categories USING btree (is_active);


--
-- Name: sub_categories_is_service_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sub_categories_is_service_idx ON public.sub_categories USING btree (is_service);


--
-- Name: sub_categories_slug_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sub_categories_slug_unique_idx ON public.sub_categories USING btree (slug);


--
-- Name: tender_responses_responder_business_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tender_responses_responder_business_idx ON public.tender_responses USING btree (responder_business_id);


--
-- Name: tender_responses_tender_business_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tender_responses_tender_business_unique_idx ON public.tender_responses USING btree (tender_id, responder_business_id);


--
-- Name: tender_responses_tender_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tender_responses_tender_status_idx ON public.tender_responses USING btree (tender_id, status);


--
-- Name: tenders_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenders_category_id_idx ON public.tenders USING btree (category_id);


--
-- Name: tenders_country_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenders_country_code_idx ON public.tenders USING btree (country_code);


--
-- Name: tenders_publisher_business_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenders_publisher_business_status_idx ON public.tenders USING btree (publisher_business_id, status);


--
-- Name: tenders_publisher_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenders_publisher_user_id_idx ON public.tenders USING btree (publisher_user_id);


--
-- Name: tenders_sub_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenders_sub_category_id_idx ON public.tenders USING btree (sub_category_id);


--
-- Name: tenders_submission_deadline_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenders_submission_deadline_idx ON public.tenders USING btree (submission_deadline);


--
-- Name: tenders_type_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenders_type_status_idx ON public.tenders USING btree (type, status);


--
-- Name: users_country_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_country_code_idx ON public.users USING btree (country_code);


--
-- Name: users_email_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_unique_idx ON public.users USING btree (email);


--
-- Name: users_phone_number_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_phone_number_unique_idx ON public.users USING btree (phone_number);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: users_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_status_idx ON public.users USING btree (status);


--
-- Name: wishlists_user_listing_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wishlists_user_listing_unique_idx ON public.wishlists USING btree (user_id, listing_id);


--
-- Name: addresses addresses_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: addresses addresses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: advertisements advertisements_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advertisements
    ADD CONSTRAINT advertisements_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: bids bids_bidder_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_bidder_id_users_id_fk FOREIGN KEY (bidder_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bids bids_listing_id_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_listing_id_listings_id_fk FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: business_members business_members_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_members
    ADD CONSTRAINT business_members_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: business_members business_members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_members
    ADD CONSTRAINT business_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: businesses businesses_city_slug_cities_slug_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_city_slug_cities_slug_fk FOREIGN KEY (city_slug) REFERENCES public.cities(slug);


--
-- Name: businesses businesses_country_code_countries_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_country_code_countries_code_fk FOREIGN KEY (country_code) REFERENCES public.countries(code);


--
-- Name: cart_items cart_items_cart_id_carts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_carts_id_fk FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_listing_id_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_listing_id_listings_id_fk FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: carts carts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cities cities_country_code_countries_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_country_code_countries_code_fk FOREIGN KEY (country_code) REFERENCES public.countries(code) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_listing_id_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_listing_id_listings_id_fk FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_tender_id_tenders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_tender_id_tenders_id_fk FOREIGN KEY (tender_id) REFERENCES public.tenders(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: listing_market_prices listing_market_prices_country_code_countries_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_market_prices
    ADD CONSTRAINT listing_market_prices_country_code_countries_code_fk FOREIGN KEY (country_code) REFERENCES public.countries(code);


--
-- Name: listing_market_prices listing_market_prices_listing_id_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_market_prices
    ADD CONSTRAINT listing_market_prices_listing_id_listings_id_fk FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: listings listings_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: listings listings_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: listings listings_country_code_countries_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_country_code_countries_code_fk FOREIGN KEY (country_code) REFERENCES public.countries(code);


--
-- Name: listings listings_created_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_created_by_user_id_users_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: listings listings_sub_category_id_sub_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listings
    ADD CONSTRAINT listings_sub_category_id_sub_categories_id_fk FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(id);


--
-- Name: messages messages_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: operator_assignments operator_assignments_assigned_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_assignments
    ADD CONSTRAINT operator_assignments_assigned_by_user_id_users_id_fk FOREIGN KEY (assigned_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: operator_assignments operator_assignments_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_assignments
    ADD CONSTRAINT operator_assignments_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: operator_assignments operator_assignments_operator_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator_assignments
    ADD CONSTRAINT operator_assignments_operator_user_id_users_id_fk FOREIGN KEY (operator_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_listing_id_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_listing_id_listings_id_fk FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_changed_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_changed_by_user_id_users_id_fk FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: order_status_history order_status_history_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: orders orders_buyer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_users_id_fk FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: otps otps_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: payments payments_payer_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payer_user_id_users_id_fk FOREIGN KEY (payer_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: popular_categories popular_categories_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.popular_categories
    ADD CONSTRAINT popular_categories_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: popular_categories popular_categories_country_code_countries_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.popular_categories
    ADD CONSTRAINT popular_categories_country_code_countries_code_fk FOREIGN KEY (country_code) REFERENCES public.countries(code) ON DELETE CASCADE;


--
-- Name: reports reports_reporter_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_users_id_fk FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_resolved_by_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_resolved_by_user_id_users_id_fk FOREIGN KEY (resolved_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: review_responses review_responses_responder_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_responder_id_users_id_fk FOREIGN KEY (responder_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: review_responses review_responses_review_id_reviews_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review_responses
    ADD CONSTRAINT review_responses_review_id_reviews_id_fk FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_listing_id_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_listing_id_listings_id_fk FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_reviewer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_users_id_fk FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sub_categories sub_categories_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT sub_categories_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: tender_responses tender_responses_responder_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tender_responses
    ADD CONSTRAINT tender_responses_responder_business_id_businesses_id_fk FOREIGN KEY (responder_business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: tender_responses tender_responses_responder_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tender_responses
    ADD CONSTRAINT tender_responses_responder_user_id_users_id_fk FOREIGN KEY (responder_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tender_responses tender_responses_tender_id_tenders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tender_responses
    ADD CONSTRAINT tender_responses_tender_id_tenders_id_fk FOREIGN KEY (tender_id) REFERENCES public.tenders(id) ON DELETE CASCADE;


--
-- Name: tenders tenders_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: tenders tenders_country_code_countries_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_country_code_countries_code_fk FOREIGN KEY (country_code) REFERENCES public.countries(code);


--
-- Name: tenders tenders_publisher_business_id_businesses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_publisher_business_id_businesses_id_fk FOREIGN KEY (publisher_business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: tenders tenders_publisher_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_publisher_user_id_users_id_fk FOREIGN KEY (publisher_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tenders tenders_sub_category_id_sub_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenders
    ADD CONSTRAINT tenders_sub_category_id_sub_categories_id_fk FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(id);


--
-- Name: users users_country_code_countries_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_country_code_countries_code_fk FOREIGN KEY (country_code) REFERENCES public.countries(code);


--
-- Name: wishlists wishlists_listing_id_listings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_listing_id_listings_id_fk FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ynQgVJHdc6Zz7ltNLWQkFnsAYSc56u8Tnes7mWcdojZsJVKrt4DK0VlskUb213Y

