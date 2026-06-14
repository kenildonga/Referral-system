# Project Structure Reference

This document outlines the directory structure of the **Referral-system** project. It is intended to provide context for AI models and developers navigating the codebase.

## Directory Tree

```text
Referral-system/
├── docs/                     # Project documentation
│   ├── api-reference.md      # Frontend API reference
│   └── project_structure.md  # This file
├── src/                      # Application source code (NestJS)
│   ├── common/               # Shared cross-cutting code
│   │   ├── constants/        # App-wide constants and enums
│   │   ├── decorators/       # Route decorators (auth, super-admin)
│   │   ├── filters/          # Global exception filters
│   │   ├── guards/           # Authentication & authorization guards
│   │   ├── helpers/          # Shared helper services (OTP, etc.)
│   │   ├── interfaces/       # Shared TypeScript interfaces
│   │   ├── responses/        # API response type definitions
│   │   ├── utils/            # Utility helpers (reserved)
│   │   └── common.module.ts
│   ├── controllers/          # Route controllers
│   │   ├── admin.controller.ts
│   │   └── agent.controller.ts
│   ├── dto/                  # Data Transfer Objects (validation & typing)
│   │   ├── admin.dto.ts
│   │   └── agent.dto.ts
│   ├── entities/             # Database entities/models
│   │   ├── admins.entity.ts
│   │   ├── agents.entity.ts
│   │   └── password-reset-otp.entity.ts
│   ├── i18n/                 # Internationalization (en, hi, gu)
│   │   ├── messages/
│   │   ├── i18n.module.ts
│   │   ├── i18n.service.ts
│   │   ├── locale.interceptor.ts
│   │   ├── locale.context.ts
│   │   ├── locale.types.ts
│   │   └── parse-locale.ts
│   ├── services/             # Business logic
│   │   ├── admin.service.ts
│   │   └── agent.service.ts
│   ├── app.module.ts         # Main application module
│   ├── main.ts               # Application entry point
│   └── seed.ts               # Database seeding script
├── .env                      # Environment variables (local)
├── .env.example              # Example environment variables
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

## Architectural Overview

- **Framework**: [NestJS](https://nestjs.com/) with a layered architecture.
- **Controllers** (`src/controllers/`): Handle incoming HTTP requests and return responses.
- **Services** (`src/services/`): Core business logic.
- **DTOs** (`src/dto/`): Input validation and request/response typing (Zod).
- **Entities** (`src/entities/`): TypeORM database models.
- **Common** (`src/common/`): Shared decorators, guards, filters, helpers, constants, interfaces, and response types. Registered via `CommonModule`.
- **Security**: JWT authentication and role-based authorization via guards in `src/common/guards/`.
- **Error Handling**: Centralized in `src/common/filters/http-exception.filter.ts`.
- **Internationalization**: `src/i18n/` — `Accept-Language` header drives localized API messages (`en`, `hi`, `gu`).
