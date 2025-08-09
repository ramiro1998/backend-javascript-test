# 🚀 Contentful Products API Challenge

![Node.js](https://img.shields.io/badge/Node.js-Active%20LTS-green)
![NestJS](https://img.shields.io/badge/NestJS-Framework-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Swagger](https://img.shields.io/badge/Swagger-API%20Docs-brightgreen)

## 📌 Description

This project is part of a **backend challenge** to test knowledge of API development and related technologies.  
The API automatically fetches product data from **Contentful** every hour, stores it in a **PostgreSQL** database, and exposes both **public** and **private** endpoints for retrieving, filtering, and reporting data.

### Key Features

- ⏳ **Scheduled data fetch**: every hour, the API requests the latest `Product` entries from Contentful.
- 📦 **Persistent storage** using PostgreSQL and TypeORM.
- 🔍 **Public endpoints** with pagination (max 5 items/page) and filtering by:
  - Name
  - Category
  - Price range
- 🗑 **Product deletion**: removed products will not reappear after restart.
- 📊 **Private reports**:
  1. Percentage of deleted products.
  2. Percentage of non-deleted products with:
     - Price / without price.
     - Custom date range.
  3. A custom report.
- 🔐 **JWT-based authentication** for private endpoints.
- 📜 **Swagger API documentation**.
- 🐳 **Dockerized** for easy deployment.

---

## 🛠 Technologies Used

- **Active LTS version of Node.js + NestJS**
- **PostgreSQL**
- **TypeORM**
- **Swagger**
- **Docker & Docker Compose**

---

## ⚙️ Environment Setup

Before starting the application, create a `.env` file in the project root with the following variables:

### Contentful API credentials

```env
CONTENTFUL_SPACE_ID=9xs1613l9f7v
CONTENTFUL_ACCESS_TOKEN=I-ThsT55eE_B3sCUWEQyDT4VqVO3x__20ufuie9usns
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_CONTENT_TYPE=product
```

## Database configuration (for Docker PostgreSQL)

### Database

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=super-password
DB_DATABASE=products_challenge
```

### JWT Secret

```env
JWT_SECRET=super-secret
```

## 🐳 Running with Docker

Once the .env file is created, start the containers with:

```env
docker-compose up --build
```

This will create:

PostgreSQL container (official image)

Application container (NestJS backend)

After the build, the API will be accessible at:

http://localhost:3000/api

## Swagger documentation:

```env
http://localhost:3000/api/docs
```

## 🌱 Seeding the Database

To populate the database with initial data from Contentful:

Obtain a JWT token from the login endpoint:

```env
POST http://localhost:3000/api/auth/login
```

Body:

```env
{
"secret": "secret-password"
}
```

(The secret must match the JWT_SECRET in .env)

Run the seed endpoint:

```env
POST http://localhost:3000/api/admin/seed
```

Add Authorization: Bearer <your-token> header.

This will fetch and store all products from Contentful.

## 🔒 Authentication

Public module: No authentication required.

Private module: Requires JWT in the Authorization header.

Example:

```env
Authorization: Bearer <your-token>
```

## 📊 Reports

Private endpoints include:

Deleted products percentage

Non-deleted products percentage (by price presence and custom date range)

Custom report (implementation-specific)

## 📄 API Documentation

Swagger is available at:

```env
http://localhost:3000/api
```

## 💡 Assumptions and Design Decisions

Soft Deletion: Instead of permanently removing products from the database, a softDeletedAt column is used. This approach allows for data preservation and accurate historical reporting on deleted items. Using a timestamp (Date) instead of a boolean (isDeleted) provides a more scalable and informative solution, as it records when an item was deleted, which is essential for audit trails and time-based reports.

Custom Report: The chosen custom report calculates the percentage of deleted products by category and within a specified date range. This demonstrates the private module's ability to handle complex, filtered queries and provides valuable business insights that go beyond simple data retrieval.

Public and Private Modules: The API is designed with a clear separation of concerns. The GET /products endpoint is public because it serves general product information to any user. All other sensitive actions, such as deleting products (DELETE /admin/products) and accessing detailed reports (GET /admin/reports), are protected within the private module and require JWT authentication. This ensures data integrity and security by restricting administrative actions to authorized users only.

## 📜 License

This project is for challenge purposes only.
