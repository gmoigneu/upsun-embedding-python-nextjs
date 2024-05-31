# Embeddings example running on Upsun.com

## To run it locally
### Prepare our python virtualenv

```
cd vectorize
python3 -m venv venv
source ./venv/bin/activate
pip install
```

### Install dependencies and run services

```
docker-compose up
cd vectorize/
DB_PATH=watches DB_HOST=127.0.0.1 DB_USERNAME=watches DB_PASSWORD=watches OPENAI_API_KEY=sk-proj-****** python3 vectorize.py
cd ../
npm install
npm rum dev
```

## To deploy on Upsun

```
upsun project:create
upsun variable:create --name OPENAI_API_KEY --prefix env: --level project
upsun push
```