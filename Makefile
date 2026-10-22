COMPOSE	=	docker compose
COMPOSE_DEV	=	docker compose -f docker-compose.dev.yml

.DEFAULT_GOAL := help

help: ## Prints help for targets with comments
	@cat $(MAKEFILE_LIST) | grep -E '^[a-zA-Z_-]+:.*?## .*$$' | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

env: ## Creat .env from .env.example if it is not exist
	@test -f .env || (cp .env.example .env && echo ".env created: fill in the secrets, then run make up again")

up: env ## Build and start the full stack (https://localhost)
	$(COMPOSE) up --build -d

down: ## Stop the continer and keep data
	$(COMPOSE) down

build: ## Build the images
	$(COMPOSE) build

logs: ## Display logs
	$(COMPOSE) logs -f --tail=100

ps: ## Continer status and health
	$(COMPOSE) ps

db: env ## Start only PostgreSQL
	$(COMPOSE) up -d postgres

clean: ## Stop and delete all data after asking
	@read -p "This deletes the database and photos. Type y to continue: " ans && [ "$$ans" = "y" ]
	$(COMPOSE) down -v --remove-orphans
	$(COMPOSE_DEV) down -v --remove-orphans

dev: env ## Development workground with hot reload (http://localhost:5173)
	$(COMPOSE_DEV) up --build

dev-down: ## Stop the development continers, keep data
	$(COMPOSE_DEV) down

dev-logs: ## Display the development logs
	$(COMPOSE_DEV) logs -f --tail=100

migration: ## Create migration: make migration name=add_friends
	@test -n "$(name)" || (echo "usage: make migration name=<name>" && exit 1)
	$(COMPOSE_DEV) exec backend npx prisma migrate dev --name $(name)



