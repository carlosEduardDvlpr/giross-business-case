<p align="center" style="margin-top:20px">
  <img src="https://giross.com.br/assets/images/logo2.png" alt="Logo Giross" width="200" />
</p>

# Business Case - Giross

## Contexto

A Giross precisa localizar regiões de entrega próximas a um CEP de referência,
seja para agrupar entregas de uma mesma área ou avaliar a cobertura de uma nova
praça.
Este case simula esse problema através de uma API REST.

## Desafio

Construir uma API REST em Node.js, sem front-end, que receba um CEP e devolva
todos os CEPs localizados num raio de 1 km, cada um com a distância calculada
até o CEP de origem.

---

## API disponível em produção

A aplicação está disponível para testes através do link abaixo:

<a href="https://giross-business-case.onrender.com/ceps-proximos/12950310" style="color: #0969da; text-decoration: underline;"><u>Testar a API em produção</u></a>

## Stack e fonte de dados escolhida

- API Node.js com Express.js e TypeScript;
- Banco PostgreSQL com a extensão PostGIS (para suporte a coordenadas e indexação espacial);
- Prisma ORM para comunicação com o banco;
- Redis para cache e rate limiting;
- Docker para execução do ambiente;

- <a href="https://docs.awesomeapi.com.br/api-cep" style="color: #0969da; text-decoration: underline;"><u>AwesomeAPI</u></a> - API externa para geolocalização do CEP informado (primeira camada da consulta);
- Tabela 'ceps' no banco PostgreSQL populada com dados baseados no DNE (Diretório Nacional de Endereços), base oficial dos
  Correios.

#### OBSERVAÇÕES SOBRE A TABELA DE CEPs:

- *Os dados populados no banco são provenientes de um arquivo CSV que conta com mais de 904 mil registros de CEPs de todo o Brasil. Ele foi adquirido a partir de um repositório público e contém CEP, logradouro, bairro, município, estado, latitude e longitude. Link do <a href="https://github.com/polvoazul/CEPS-Brasil" style="color: #0969da; text-decoration: underline;"><u>Repositório CEPS-Brasil, onde está disponível o CSV original</u></a>.*
- *Na seção <a href="#executar-com-docker" style="color: #0969da; text-decoration: underline;"><u>"Como executar com Docker"</u></a>, fica melhor explicado como esse arquivo está sendo utilizado.*

<br />

---

## Estratégia utilizada

O CEP recebido é normalizado e validado pela aplicação.
Em seguida, a API externa AwesomeAPI é chamada para consulta da latitude e a longitude do CEP.

Com as coordenadas do CEP de origem, a aplicação consulta o PostgreSQL usando
as funções geográficas do PostGIS:

- `ST_DWithin` localiza os CEPs dentro do raio de 1.000 metros;
- `ST_Distance` calcula a distância entre cada CEP e o ponto de origem;
- o resultado é convertido para quilômetros e arredondado para duas casas
  decimais;
- os registros são ordenados pela distância e, em caso de empate, pelo CEP.

A coluna geográfica utiliza o tipo `geography(Point, 4326)`. Dessa forma, as
distâncias são calculadas em metros e consideram a superfície terrestre.

Esse tipo de coluna não é diretamente suportado pelo Prisma ORM, então a consulta é feita por SQL diretamente no banco através do método `$queryRaw`.

Também foi criado um índice espacial GiST para reduzir o número de registros
avaliados durante a busca por raio.

## Cache Redis

Foram implementados dois tipos de cache no Redis:

- coordenadas de CEPs já consultados na AwesomeAPI;
- resultado completo da busca de CEPs próximos.

Foram definidos tempos de expiração diferentes de acordo com a natureza dos
dados armazenados. As coordenadas retornadas pela AwesomeAPI permanecem no
cache por sete dias, pois a latitude e a longitude de um CEP raramente mudam.
Esse período reduz a dependência do serviço externo sem manter o dado em cache
indefinidamente.

O resultado da consulta de CEPs próximos permanece no cache por 24 horas. Esse
resultado ocupa mais espaço e depende diretamente da versão da base local.
Quando a base de CEPs é atualizada, esse cache deve ser invalidado para evitar
o retorno de resultados antigos.

Caso o Redis fique indisponível, consultas e gravações de cache são ignoradas
e o fluxo principal continua utilizando a API externa e os dados do Banco PostgreSQL.

## Rate limiting

A aplicação utiliza Redis para controlar:

- quantidade de requisições ao endpoint principal por endereço IP;
- quantidade de chamadas à AwesomeAPI;
- quantidade de chamadas ao endpoint de limpeza de cache.

Quando a AwesomeAPI retorna HTTP `429`, a aplicação respeita o header
`Retry-After` e pausa temporariamente novas chamadas ao serviço externo.

Os limites são configuráveis através das variáveis de ambiente.

## Fluxo da requisição

```text
  -> validação e normalização do CEP

  -> consulta do cache das coordenadas retornadas pela AwesomeAPI
  -> consulta do cache da lista de CEPs próximos
  ou
  -> Busca em AwesomeAPI
  -> Busca Registros no Banco PostgreSQL/PostGIS
  -> armazenamento do resultado no Redis
  -> resposta da lista de ceps próximos ordenada por distância
```

Se a AwesomeAPI estiver temporariamente indisponível e o CEP existir na base
local, a aplicação utiliza as coordenadas armazenadas no PostgreSQL como
fallback.

<br />

---

## Endpoints

### Buscar CEPs próximos

```http
GET /ceps-proximos/:cep
```

O CEP pode ser informado com ou sem hífen.

Exemplo:

```http
GET /ceps-proximos/69927-000
```

Resposta padrão (lista de CEPs próximos):

```json
[
  {
    "cep": "69927010",
    "distancia_km": 0.18
  },
  {
    "cep": "69927020",
    "distancia_km": 0.43
  }
]
```

Para retornar também os dados cadastrais, utilize `completo=true`:

```http
GET /ceps-proximos/69927000?completo=true
```

Resposta:

```json
[
  {
    "cep": "69927010",
    "distancia_km": 0.18,
    "logradouro": "Exemplo de logradouro",
    "bairro": "Exemplo de bairro",
    "cidade": "Porto Acre",
    "estado": "AC"
  }
]
```

### Limpar cache de um CEP

```http
DELETE /cache/:cep
```

Remove os dois caches relacionados ao CEP informado: as coordenadas retornadas pela API externa e o resultado da busca de proximidade no PostgreSQL.

## Tratamento de erros

A API trata os seguintes cenários:

- CEP inválido;
- parâmetro de query inválido (completo=true);
- CEP inexistente;
- coordenadas inválidas ou indisponíveis;
- timeout ou indisponibilidade da API externa AwesomeAPI;
- limite de requisições atingido;
- indisponibilidade do Redis;
- rota inexistente;
- erro interno inesperado.

As respostas de erro seguem o formato:

```json
{
  "erro": "CEP inválido",
  "mensagem": "O CEP fornecido não é válido."
}
```

<br />

---

<a id="executar-com-docker"></a>

## Como executar com Docker

### 1. Clonar o repositório

Clone o projeto e acesse o diretório criado:

```bash
git clone https://github.com/carlosEduardDvlpr/giross-business-case.git
cd giross-business-case
```

### 2. Criar o arquivo de ambiente

Copie `.env.example` para `.env`:

IMPORTANTE: para reproduzir os mesmos resultados, o arquivo `.env` deve conter as variáveis indicadas no `.env.example`, explicadas na próxima seção.

### 3. Subir os serviços

```bash
docker compose up -d --build
```

O Compose inicia os serviços do Redis, PostgreSQL com PostGIS e a API.

O arquivo CSV contendo os 904 mil registros é usado nesse momento. Ele está no diretório `./docker/ceps.csv.gz` e foi compactado para ficar mais leve, ocupando aproximadamente 34 MB em vez dos 90 MB originais.
Na primeira inicialização, o PostgreSQL cria a tabela `ceps`, descompacta o arquivo CSV, importa os registros e cria o índice espacial.

IMPORTANTE: por conta dos 904 mil registros, o container leva aproximadamente de dois a três minutos para inicializar pela primeira vez.
Nas demais inicializações, os dados permanecem no volume do PostgreSQL, por isso o banco não importa o CSV novamente e os serviços ficam disponíveis em poucos segundos.

### 4. Consultar a API

A aplicação é inicializada em localhost:3000 após serviços do Redis e PostgreSQL subirem.

```bash
curl http://localhost:3000/ceps-proximos/69927000
```

## Para executar sem o container da API

Para executar a API fora do serviço docker, deve subir apenas PostgreSQL e Redis:

```bash
docker compose up -d database redis
```

Em seguida:

```bash
npm install
npm run prisma:generate
npm run dev
```

Para produção: 

```bash
npm run build
npm start
```

<br />

---

## Deploy da aplicação

Para deixar a solução disponível para testes sem a necessidade de executar o
projeto localmente, os serviços foram distribuídos entre três plataformas:

- <a href="https://render.com" style="color: #0969da; text-decoration: underline;"><u>Render</u></a> para executar e disponibilizar a API Node.js;
- <a href="https://neon.com" style="color: #0969da; text-decoration: underline;"><u>Neon</u></a> para hospedar o PostgreSQL com a extensão PostGIS e a base completa de CEPs;
- <a href="https://redis.io/pt/" style="color: #0969da; text-decoration: underline;"><u>Redis</u></a> para hospedar o cache e os controles de rate limiting.

Acesse para testes através do link abaixo:

<a href="https://giross-business-case.onrender.com/ceps-proximos/12950310" style="color: #0969da; text-decoration: underline;"><u>Testar a API em produção</u></a>

<br />

## Variáveis de ambiente

| Variável | Descrição | Valor local padrão sugerido |
| --- | --- | --- |
| `PORT` | Porta HTTP da aplicação | `3000` |
| `POSTGRES_DB` | Nome do banco PostgreSQL | `giross` |
| `POSTGRES_USER` | Usuário do PostgreSQL | `giross` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `giross_dev` |
| `POSTGRES_PORT` | Porta local do PostgreSQL | `5432` |
| `DATABASE_URL` | URL de conexão usada pelo Prisma | `postgresql://giross:giross_dev@localhost:5432/giross` |
| `REDIS_PORT` | Porta local do Redis | `6379` |
| `REDIS_PASSWORD` | Senha do Redis | `giross_redis_dev` |
| `REDIS_URL` | URL de conexão com o Redis | `redis://default:giross_redis_dev@localhost:6379` |
| `GEOCODING_API_URL` | URL da AwesomeAPI | `https://cep.awesomeapi.com.br/json/` |
| `GEOCODING_TIMEOUT_MS` | Timeout da consulta a API externa | `5000` |
| `API_RATE_LIMIT_PER_MINUTE` | Limite do endpoint principal | `60` |
| `CACHE_DELETE_RATE_LIMIT_PER_MINUTE` | Limite da limpeza de cache | `5` |
| `GEOCODING_RATE_LIMIT_PER_MINUTE` | Limite interno da AwesomeAPI | `30` |
| `TRUST_PROXY` | Número de proxies na frente da API | importante manter zerado. Usado apenas em deploy |

## Estrutura principal

```text
src/
  config/         Variáveis de ambiente
  controllers/    Entrada e saída HTTP
  errors/         Erros conhecidos da aplicação
  lib/            Prisma, Redis, cache e rate limit
  middlewares/    Erros, rate limiting e rotas indisponíveis
  routes/         Definição dos endpoints
  services/       Geocodificação e busca por ceps próximos
  utils/          Normalização e validação de CEP e query

docker/
  api/            Imagem da aplicação
  postgres/       Imagem e scripts de inicialização do PostGIS
  ceps.csv.gz     Base compactada CSV de CEPs

prisma/
  schema.prisma   Modelo introspectado do PostgreSQL
```

<br />

---

## Decisões e trade-offs

### 904 mil registros em CSV e PostGIS

Os resultados retornados dependem da abrangência e da qualidade da base utilizada. A solução poderia depender totalmente de uma API de terceiros, mas optei por manter uma base própria com mais de 904 mil registros. Quanto mais completa for essa base, melhor será a cobertura da aplicação.

Para o desafio, considero essa base uma boa demonstração da solução e também uma forma de permitir que o projeto seja reproduzido localmente sem depender de outra infraestrutura. Como trade-off, o arquivo aumenta o tamanho do repositório e da imagem Docker e na primeira inicialização, é necessário descompactar o CSV, importar os registros e criar o índice espacial, o que leva aproximadamente de dois a três minutos.

O PostGIS foi escolhido para executar a busca por raio no banco, evitando
carregar o CSV em memória ou calcular a distância contra todos os registros
na aplicação. Essa abordagem aumenta a eficiência das consultas por regra geográfica.

### Base própria e AwesomeAPI

Para atender ao requisito de geolocalização, optei por utilizar a AwesomeAPI
como fonte primária da latitude e longitude do CEP informado. Como essa API já
retorna diretamente as coordenadas, não foi necessário combinar o ViaCEP para
os dados cadastrais com um segundo serviço de geocoding.

A base própria não substitui essa consulta no fluxo principal. Ela é utilizada
para localizar os CEPs próximos por meio do PostGIS e também funciona como
fallback quando a API externa está temporariamente indisponível e o CEP de
origem existe no banco.

Essa decisão atende à integração com uma API pública, reduz a dependência do
serviço externo e permite executar as consultas geoespaciais de forma
eficiente sobre uma base controlada pela aplicação.

### Redis

O Redis adiciona uma nova camada na aplicação, mas evita consultas repetidas e
permite compartilhar cache e rate limiting entre múltiplas instâncias da API.
Em caso de falha, o cache não impede o funcionamento do endpoint principal.

### Precisão e performance

As buscas usam o tipo `geography` e o cálculo padrão do PostGIS, priorizando
precisão. O filtro `ST_DWithin` utiliza o índice GiST antes do cálculo final da
distância, reduzindo o custo da consulta.
O cache no Redis reduz a latência das chamadas repetidas e evita novas consultas à API externa e ao banco enquanto o resultado ainda estiver válido.

<br />

---

## Considerações finais

- O projeto foi concluido atendendo os critérios do teste, e creio que através dele consegui entregar um bom resultado.
- Durante o desenvolvimento, adquiri novos conhecimentos sobre o tipo `geography` do PostGIS, proxy e rate limiting. Também me familiarizei melhor com o Redis e com o funcionamento de um armazenamento chave-valor.
- Utilizei IA de forma assistida durante o desenvolvimento, principalmente para pesquisar os conceitos que eu ainda não conhecia, apoiar na configuração do ambiente Docker, elaborar e executar teste e revisar a solução. As decisões de arquitetura, implementação, validação e integração foram analisadas e executadas por mim.
