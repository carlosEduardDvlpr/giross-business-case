CREATE UNLOGGED TABLE ceps_import (
  cep text,
  logradouro text,
  localidade text,
  id_municipio text,
  nome_municipio text,
  sigla_uf text,
  lat text,
  lon text
);

COPY ceps_import (
  cep,
  logradouro,
  localidade,
  id_municipio,
  nome_municipio,
  sigla_uf,
  lat,
  lon
)
FROM PROGRAM 'gzip -dc /data/ceps.csv.gz'
WITH (
  FORMAT csv,
  HEADER true,
  ENCODING 'UTF8'
);

INSERT INTO ceps (
  cep,
  logradouro,
  bairro,
  cidade,
  estado,
  latitude,
  longitude
)
SELECT DISTINCT ON (trim(cep))
  trim(cep),
  trim(logradouro),
  trim(localidade),
  trim(nome_municipio),
  upper(trim(sigla_uf)),
  trim(lat)::double precision,
  trim(lon)::double precision
FROM ceps_import
WHERE trim(cep) ~ '^[0-9]{8}$'
  AND trim(logradouro) <> ''
  AND trim(localidade) <> ''
  AND trim(nome_municipio) <> ''
  AND upper(trim(sigla_uf)) ~ '^[A-Z]{2}$'
  AND pg_input_is_valid(trim(lat), 'double precision')
  AND pg_input_is_valid(trim(lon), 'double precision')
  AND trim(lat)::double precision BETWEEN -90 AND 90
  AND trim(lon)::double precision BETWEEN -180 AND 180
ORDER BY trim(cep)
ON CONFLICT (cep) DO UPDATE
SET
  logradouro = EXCLUDED.logradouro,
  bairro = EXCLUDED.bairro,
  cidade = EXCLUDED.cidade,
  estado = EXCLUDED.estado,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

DROP TABLE ceps_import;

CREATE INDEX IF NOT EXISTS ceps_location_gist_idx
  ON ceps
  USING GIST (location);

ANALYZE ceps;
