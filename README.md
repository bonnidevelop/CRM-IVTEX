# CRM Sales Management System - Backend API

A production-grade RESTful backend for a CRM Sales Management System built with Node.js, Express.js, TypeScript, and MongoDB. The system orchestrates the complete sales process: **Lead Generation &rarr; Lead Qualification &rarr; Customer Conversion &rarr; Deal Management &rarr; Deal Closure**, coupled with sales follow-up activities, timeline audit logs, and analytics.

---

## 1. Technologies Used

- **Runtime & Language:** Node.js (ES Modules), TypeScript
- **Web Framework:** Express.js 5
- **Database & ODM:** MongoDB, Mongoose 9
- **Validation:** Zod 4
- **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `express-rate-limit`
- **Testing:** Vitest

---

## 2. Project Architecture & Directory Structure

```text
crm-sales-management/
├── docs/
│   └── postman_collection.json  # Comprehensive Postman Collection (v2.1.0)
├── src/
│   ├── config/                  # Database connectivity and configuration
│   ├── constants/               # System enums (user roles, lead sources/statuses, deal stages)
│   ├── controllers/             # Express route controllers
│   ├── middleware/              # Auth, RBAC, error handler, and request validators
│   ├── models/                  # Mongoose models (User, Lead, Customer, Deal, Activity, Timeline, Config)
│   ├── routes/                  # Express routes organized by resource
│   ├── services/                # Business logic, aggregations, and MongoDB transactions
│   ├── types/                   # TypeScript interfaces and module augmentations
│   ├── utils/                   # Standard API response formatting and AppError class
│   ├── validators/              # Zod validation schemas
│   ├── app.ts                   # Express application setup and middleware mounts
│   └── server.ts                # Server entrypoint and graceful shutdown listeners
├── tests/                       # Unit and integration test suites
├── .env.example                 # Environment variables specification
└── package.json
```

---

## 3. Installation & Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (or npm / yarn)
- MongoDB instance running locally (e.g., `mongodb://localhost:27017/crm_sales_db`) or MongoDB Atlas URI

### Steps

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repo-url>
   cd crm-sales-management
   pnpm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your database credentials and a 32+ character JWT secret:
   ```env
   NODE_ENV=development
   PORT=5000
   CORS_ORIGIN=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/crm_sales_db
   JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
   ```

3. **Run the development server:**
   ```bash
   pnpm dev
   ```
   The API will be available at: `http://localhost:5000/api/v1`

4. **Run Typecheck & Tests:**
   ```bash
   pnpm typecheck
   pnpm test
   ```

5. **Build for Production:**
   ```bash
   pnpm build
   pnpm start
   ```

---

## 4. User Roles & Permission Model (RBAC)

The system enforces strict multi-tenant and role-based access rules:

| Role | Permissions & Access Scope |
| :--- | :--- |
| **Admin** | Full system access. Create, list, edit, toggle, and delete users. Access all leads, customers, deals, activities, and audit logs. Delete entities. Manage CRM global configuration. |
| **Sales Manager** | View team leads, customers, and deals. Assign and reassign leads/deals to sales executives. View team-level performance analytics and overdue activities. Manage activities. Cannot manage users or delete core entities. |
| **Sales Executive** | Scoped access only. Can view and modify only leads, customers, and deals assigned to them. Auto-assigned to self-created leads. Convert qualified leads. Log activities and mark follow-ups completed. Cannot reassign leads or access other executives' resources. |

---

## 5. Key Business Rules & Workflows

1. **Lead Assignment:**
   - Only `admin` and `sales_manager` can assign or reassign leads.
   - Lead reassignments require an active user account and are recorded in the timeline audit log.
2. **Lead Conversion (ACID Transaction):**
   - Only eligible leads (`status === 'qualified'`) can be converted.
   - Performed inside a MongoDB session transaction: atomically creates a `Customer` and a `Deal`, updates the `Lead` status to `converted`, links all 3 entity IDs, and writes 3 timeline audit events.
   - Converted leads cannot be converted a second time.
3. **Deal Business Rules:**
   - Deal values must be greater than 0.
   - Probability must be between 0 and 100%.
   - `expectedRevenue` is automatically calculated backend-side: `(dealValue * probability) / 100`.
   - Deals closed as `won` or `lost` cannot be reopened to an active stage by non-admin users.
   - Setting a deal to `won` locks probability to 100%.
   - Setting a deal to `lost` strictly requires a `lostReason` (minimum 3 characters) and sets probability to 0%.
4. **Activity Overdue Detection:**
   - Backend dynamically computes whether pending tasks are overdue based on `dueDate < now()` and `status !== 'completed'`.
   - Completing an activity sets `completedDate` and records a timeline log.
5. **Timeline / Audit History:**
   - Centralized audit trail records actor, entity type, entity ID, previous value, new value, and metadata for all key actions (`lead_created`, `lead_assigned`, `lead_status_changed`, `lead_converted`, `deal_created`, `deal_stage_changed`, `deal_won`, `deal_lost`, `follow_up_created`, `follow_up_completed`).

---

## 6. Database Design & Indexing Decisions

All collections feature targeted indexing for maximum query performance:

- **Users:** Unique index on `email`, compound index on `role` and `isActive`.
- **Leads:** Text search index on `{ name: "text", email: "text", company: "text" }`, indexes on `assignedSalesExecutive`, `status`, `source`, `priority`, and `createdAt: -1`.
- **Customers:** Text search index on name, email, company; index on `assignedSalesExecutive` and `originalLeadReference`.
- **Deals:** Compound index on `{ currentStage: 1, assignedEmployee: 1 }`, index on `customerReference`, `leadReference`, `expectedClosingDate`, and `createdAt: -1`.
- **Activities:** Compound indexes on `{ relatedEntityType: 1, relatedEntityId: 1 }` and `{ assignedUser: 1, status: 1, dueDate: 1 }`.
- **Timeline:** Compound index on `{ entityType: 1, entityId: 1, createdAt: -1 }` for sub-millisecond audit history lookups.

---

## 7. Standard API Response Structure

All endpoints return a uniform JSON format:

### Success Response
```json
{
  "success": true,
  "message": "Lead converted successfully to Customer and Deal",
  "data": {
    "lead": { "id": "...", "status": "converted" },
    "customer": { "id": "...", "name": "Global Dynamics Inc" },
    "deal": { "id": "...", "dealName": "Enterprise Contract", "dealValue": 75000 }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "A Lost deal must contain an appropriate reason (minimum 3 characters)"
}
```

---

## 8. Postman Collection

A complete Postman collection configured with collection variables and automated JWT token extraction is located at:

📁 **[`docs/postman_collection.json`](./docs/postman_collection.json)**

### How to use in Postman:
1. Open Postman &rarr; Click **Import** &rarr; Select `docs/postman_collection.json`.
2. Under collection variables, verify `baseUrl` points to `http://localhost:5000/api/v1`.
3. Run the **Authentication / Login User** request. The test script will automatically capture and inject the JWT Bearer token into all subsequent requests.
