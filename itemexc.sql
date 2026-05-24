-- Item Exchange System - Database Setup

CREATE TABLE IF NOT EXISTS event (
    _id character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    notice text DEFAULT '',
    start bigint NOT NULL,
    "end" bigint NOT NULL,
    expmul double precision NOT NULL DEFAULT 1,
    mnymul double precision NOT NULL DEFAULT 1,
    eventitem json DEFAULT NULL,
    itemmul double precision NOT NULL DEFAULT 0,
    PRIMARY KEY (_id)
);

ALTER TABLE event ADD COLUMN IF NOT EXISTS eventitem json DEFAULT NULL;
ALTER TABLE event ADD COLUMN IF NOT EXISTS itemmul double precision NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS itemexc (
    _id serial PRIMARY KEY,
    recipe json NOT NULL,
    result character varying(64) NOT NULL,
    eventid character varying(64) DEFAULT NULL
);
