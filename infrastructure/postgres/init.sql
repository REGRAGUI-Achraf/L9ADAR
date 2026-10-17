-- Runs once when the database volume is created for the first time.
CREATE EXTENSION IF NOT EXISTS vector; -- pgvector stores embeddings for AI features
CREATE SCHEMA IF NOT EXISTS ai; -- table owned by ai-service
-- Application tables are created by Prisma migrations in the public schema
