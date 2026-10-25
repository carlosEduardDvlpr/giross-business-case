CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS ceps (
  cep varchar(8) PRIMARY KEY,
  logradouro text NOT NULL,
  bairro text NOT NULL,
  cidade text NOT NULL,
  estado char(2) NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  location geography(Point, 4326)
    GENERATED ALWAYS AS (
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
  CONSTRAINT ceps_cep_format CHECK (cep ~ '^[0-9]{8}$'),
  CONSTRAINT ceps_estado_format CHECK (estado ~ '^[A-Z]{2}$'),
  CONSTRAINT ceps_latitude_range CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT ceps_longitude_range CHECK (longitude BETWEEN -180 AND 180)
);

