# Database Layer

The database layer is driven by **Prisma** and targets **MySQL**. The Prisma schema is the single source of truth, and migrations are generated from it.

**What Lives Here**
- `schema.prisma` Prisma schema for all models, enums, and relations
- `migrations/` Prisma-generated SQL migrations
- `schemas/estatehub.sql` Human-readable MySQL DDL reference

## Requirements

- A MySQL database (local or hosted)
- `DATABASE_URL` configured in `server/.env`

Example `DATABASE_URL`:

```sh
DATABASE_URL=mysql://estatehub_app:password@localhost:3306/estatehub
```

**Common Commands**
Run from the repo root with workspace flags:
```sh
npm run prisma:generate -w server
npm run prisma:migrate -w server
npm run prisma:deploy -w server
npm run prisma:studio -w server
```

## Typical Local Flow

1) Create a database in MySQL (e.g. `estatehub`).
2) Update `venture_plus/server/.env` with `DATABASE_URL`.
3) Run migrations:
```sh
npm run prisma:migrate -w server
```
4) (Optional) Seed sample data:
```sh
npm run seed -w server
```

**Notes**
- Update `DATABASE_URL` in `server/.env` before running migrations.
- Do not hand-edit files in `migrations/`; regenerate them via Prisma instead.
- If you change the database provider, update `schema.prisma` and re-run migrations.
