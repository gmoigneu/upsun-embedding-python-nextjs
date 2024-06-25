# Leveraging open-source LLM models to create a product recommendation engine on Next.js

![Demo](assets/demo.gif)

## How does it work?

The data located in `vectorize/data` is a [dataset from Kaggle](https://www.kaggle.com/datasets/rkiattisak/luxury-watches-price-dataset/data).

This example uses a local Ollama server:
- `vectorize.py` uses the `all-minilm` model run `feature_extractor` with the `all-MiniLM-L6-v2` model locally (CPU). The model is downloaded (88MB) on the first run in the `~/.cache/huggingface/` folder. The embeddings are then stored in the postgres database. `vectorize.py` also migrates the database schema if it does not exist.
- When the user inputs a prompt, the `recommend` action will first run `featureExtraction` on the serverless HuggingFace inference API with the same model `all-MiniLM-L6-v2` to get the embedding.
- The `recommend` action then query the database using the vector to get 5 similar watches.
- The last step of the action is to query a text generation model on HuggingFace inference API to generate a proper text answer. We are using `mistralai/Mistral-7B-Instruct-v0.2` in this example.
- The generated answer is streamed from the action to our client component.

The `openai` branch does the same but relies on the OpenAI API for all the LLM actions.

## To run it locally
### Prepare our python virtualenv

```
cd vectorize
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt
```

### Install dependencies and run services

```
export FORWARD_DB_PORT=8090
docker compose up -d
cd vectorize/
source ../.env.local
DB_PORT=$FORWARD_DB_PORT DB_PATH=watches DB_HOST=127.0.0.1 DB_USERNAME=watches DB_PASSWORD=watches python3 vectorize.py
cd ../
npm install
npm rum dev
```

## To deploy on Upsun

```
upsun project:create
upsun variable:create --name env:EMBEDDING_MODEL --level project --visible-build=true --value=all-minilm
upsun variable:create --name env:CHAT_MODEL --level project --visible-build=true --value=tinyllama:1.1b-chat-v1-q2_K
upsun push --resources-init=manual
```

The `vectorize.py` script is included in the `deploy` hook meaning that it will be triggered on every deploy. This is for demo purposes. You can run it manually instead to avoid delays in deployments.
