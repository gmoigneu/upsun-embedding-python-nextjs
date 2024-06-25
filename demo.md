# Demo process - 12 minutes + 8 minutes Q&A

## Objectives

x Managed services & "Multi-runtimes"/ Nix image
x Preview environments
x Show green regions / multicloud
x LLMs: CPU local model for embedding & external APIs for inference
x Next.js is easy on Upsun (upsun ify - config-next.example)
x Scalability?

## Project architecture

1. F/ Show final project - "blue dial rolex"
    - Query HF inference endpoint -> nearest neighbors
    - Inject results into a LLM model (Mistral on HF) to generate a few sentences explaining why this is the "best" result.

## Project creation

0. F/ Everything can be done through the console or the CLI/API
1. `upsun project:create`
2. Select region (`ch-1`)
3. F/ Provision - Explain Multi-cloud + Green regions
4. G/ `upsun push` & explain git-based workflow

## Configuration (while pushing)

1. G/ Review `config-next.example`
    - Nix / Composable
    - Explain build/deploy "a la docker"
2. F/ Explain what we added with `config.yaml`
    - `python` stack
    - `postgres` service - managed service
    - `vectorize` during deploy

## Preview environments

1. Switch sur https://console.upsun.com/nls/bjnplsov6xx2u/main

2. F/ Show PR on github & Explain vectorize -> Search similarities between the query and the records
    - Start from a CSV file
    - Create the vectors with a local CPU-bound model (sentence-transformer or ollama - multi-app) 
    - Store the computation in PG Vector
    - How data works on preview and how other changes are done (service versions)

3. G/ `upsun resources:set` on ollama app and explain h/v scalability 
