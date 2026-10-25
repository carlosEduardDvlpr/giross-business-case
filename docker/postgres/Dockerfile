FROM postgis/postgis:17-3.6

COPY docker/ceps.csv.gz /data/ceps.csv.gz
COPY docker/postgres/init/ /docker-entrypoint-initdb.d/

EXPOSE 5432
