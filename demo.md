# Demo process - 12 minutes + 8 minutes Q&A

Time is calculated from an average of 100 wpm which is overall considered slow.

## Objectives

x Managed services & "Multi-runtimes"/ Nix image
x Preview environments
x Show green regions / multicloud
x LLMs: CPU local model for embedding & external APIs for inference
x Next.js is easy on Upsun (upsun ify - config-next.example)
x Scalability?

## Introduction
F/ 1 minute
    
    Good morning! Let's start by quickly introducing ourselves. I'm Fabien Potentier and I'm mostly known for my contributions these last twenty years on the Symfony framework.

    I'm joined today by Guillaume who has also been developing apps for a couple decades mostly focused on eCommerce. 

    We both work for for the advocacy team of a cloud application platform called Upsun but more on that later.

## Project architecture

F/ 1.4 minute

Show final project - "An elegant watch with a blue dial with only a date complication"

    The goal for this talk is to present the different way to leverage open-source AI models in your projects. Then deploy and run everything from a cloud application platform. Let's start by showing you the actual result. Our simple example app is able to find the best watch out of a local CSV based on the user query using classification.
    
    In order to achieve this, we transform all records and queries in vectors that stored locally on a postgres instance with the vector extension. Once you have that, you can pull the most similar records with a K-nearest-neighbors query on postgres.
    
    We then inject the results into the prompt of an open-source LLM model. For that example, we are using Mistral 7x8b on HuggingFace to generate a few sentences explaining why this is the "best" result for the user query.

## Project creation

0. F/ 20 seconds. Everything can be done through the console or the CLI/API

    While every action you will see in this talk can be done through either the Web GUI or the API, we wanted to show you how we do it on the daily with the CLI.

1. F/ 46 seconds. `upsun project:create`

    So let's start by creating a new empty project to deploy our Next.js app. As you can see we have to select the region we want to deploy our application to. A region is a specific location of a IaaS provider where our platform is deployed. 

2. F/ 1 minute. Select region (`ch-1`). Explain Multi-cloud + Green regions
    
    We will select our `ch-1` region running on GCP. While it is provisioning, let's get deeper into this list. We are able to run on the 3 hyperscalers (AWS, GCP and Azure) but also on two french sovereign region that are Orange and OVH. 

    You can also note that we do provide information on the average carbon emission generation per kWh for these regions. Our most efficient regions highlighted in green also bundle an additional discount on the resource prices. Our goal is to incentivize users to make the right decision when deploying their project when they are not under strict country specific regulations.

4. G/ 1.1 minute `upsun push` & explain git-based workflow

    Our project is now provisioned and ready to use. As this is a short talk, we will get right to the deploying our app with `upsun push`.

    If we use the term `push`, it's simply because everything is based on git. When we created our project, a new git remote was added to our repository. This allows us to directly push our code to the Upsun servers. This is great for a simple example but you can obviously setup advanced integrations with any hosted git solution like Github and Gitlab.

    For every git branch, we will get a new preview environment running that specific code but we will show you that right after.

## Configuration (while pushing)

1. G/ 1.6 minute - Review `config-next.example`
    - Nix / Composable
    - Explain build/deploy "a la docker"

    Everything based on git also means that the configuration for the infrastructure side of our project is also part of that project as a yaml file. And I hear you already thinking "Oh like the insane Kubernetes configs". Well not exactly.

    This is the configuration in order to run a Next.js app. Pretty straightforward right?

    You can notice that we use a base image you can customize. We use Nix behind the scenes so any Nix packages can be used to augment your container. This is great because that means you can mix and match runtimes if needed. Say for example you need to run a python or go script inside your node.js environment.

    An interesting thing is also the build and deploy steps. The build needs to list all the actions you need in order to convert your source repository into an actual runnable app. So for us here, it's basically installing the packages and running our Next.js build script.

2. F/ 1.7 minute - Explain what we added with `config.yaml`

    But the project we are showing you today is a bit more advanced than this. Because we need to populate our database of watches, we will run a python script during the deploy phase.

    Our vectorize script relies on a local model that generates the vectors from a CSV file of watches and create the records on postgres. We use the `vector` extension to store the embeddings generated by the model.

    We need to do three changes for that to work:

    - Adding a `python` stack to our container image
    - Provisioning a `postgres` service. Note that Upsun manages your services and they are all run directly on the same platform. No need to get your data services on a third party service.
    - For the last step, we leverage the deploy hook that is bein run when the container is actually started on the cluster. We are adding our `vectorize` script so the databased is seeded everytime we deploy. In a real production app, this is where you would run migrations.

3. G/ 1.3 minutes - The next.js side

    On the next.js side we rely on HuggingFace API endpoints. The first one is using the same model than vectorize and convert the user query into a vector used for our postgres query.

    The second is a classic LLM model, Mistral in that example. Where we inject our query and results in the prompt to generate and stream the final answer shown to the user.

    Our project is fully deployed and we can run another query to check its behavior.

    "A watch for deep divers with a water resistance of at least 100m."

## Preview environments

1. Switch sur https://console.upsun.com/nls/bjnplsov6xx2u/main

2. F/ 1.4 minutes Show PR on github & Explain vectorize -> Search similarities between the query and the records

    While you are used to being able to view your developments on preview branches, we can go a lot deeper with Upsun. Let's take a way more complex example for this one.

    https://github.com/gmoigneu/upsun-embedding-python-nextjs/pull/3/commits/136d4824aebea3517ab31cc32fc034a1131da2f1

    We decided to try a version of this app where every model was actually run on Upsun directly. For that, we have to setup a new container running alongside our app that will run ollama and the 

    In our config.yaml file, we add a new app that includes the `ollama` nix stack and pulls the all-minilm model to run it.

    Our main app gets a new relationship to this container to be able to query it internally.

    Our vectorize script is updated to use directly. Our Next.js `action` is also now querying our locally run LLM model instead of an external endpoint.

    Your preview environments can also include architectural and infrastructure changes whether they are straightforward upgrades or adding new services.


3. F/ 40 seconds

    But on top of that, your data also follows your branches. We are able to clone all the databases, files, cache, queues, etc. from a parent branch to another one in seconds no matter the size. That way, it's easy to test and review new features and bug fixes on real data instead of lorem ipsum content. 

4. G/ 48 seconds `upsun resources:set` on ollama app and explain h/v scalability 

    One last thing. As your resources needs may be different for every environments or if you need to scale one, you can always set the resources for a specific container on the fly through the CLI or the UI. Let's boost the resources of our ollama app by increasing the CPU per container but also replicating it to scale horizontally. And all of that in seconds without any need to configure anything at the app level. Everything is taken care of.


**Total time: 13 minutes.**