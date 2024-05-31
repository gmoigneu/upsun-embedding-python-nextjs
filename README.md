# Embeddings example running on Upsun.com

## Prepare our python virtualenv

```
cd vectorize
python3 -m venv venv
source ./venv/bin/activate
pip install
```

## To run it locally

```
docker-compose up
cd vectorize/
DATABASE_PATH=watches DATABASE_HOST=127.0.0.1 DATABASE_USERNAME=watches DATABASE_PASSWORD=watches OPENAI_API_KEY=sk-proj-****** python3 vectorize.py
cd ../
npm install
npm rum dev
```