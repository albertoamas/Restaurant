-- Migration: add ticket delivery tracking
-- Safe for production: pure ADD COLUMN operations, no table rewrite.
-- PostgreSQL handles NOT NULL DEFAULT without rewriting data (PG11+).
-- Existing raffle_tickets rows → delivered = false, delivered_at = NULL.

ALTER TABLE "raffle_tickets" ADD COLUMN "delivered" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "raffle_tickets" ADD COLUMN "delivered_at" TIMESTAMPTZ;
