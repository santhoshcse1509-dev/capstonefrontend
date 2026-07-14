# AI-Powered Insurance Policy Management System

An enterprise-ready, role-based insurance policy management portal built with Spring Boot, Spring AI, PostgreSQL, and React.

## System Architecture

```
[React Frontend] (Port 3000)
       │ (REST APIs + JWT Bearer Token)
       ▼
[Spring Boot Backend] (Port 8080)
       ├─► [Spring Security + JWT Authentication]
       ├─► [Spring AI + OpenAI / Fallback Simulation]
       ├─► [PostgreSQL Database (JPA / pgvector)]
       └─► [Redis Session/Cache Memory]
```

## Features

1. **Authentication & RBAC**: Secure email registration, password login, token refresh mechanism, and role-based permissions (Customer, Agent, Claims Officer, Admin).
2. **Policy Lifecycle**: Browsing policy categories, purchase workflows with Nominee details, policy active status, premium billing, and auto renewals.
3. **Claims Management**: Submit claims with invoice amounts and descriptions. AI Verification processes details, estimates fraud risk, and reports reasons. Claims Officer reviews and resolves claims.
4. **AI Policy Assistant**: Natural language dialogue assistant. Converses, explains policy terminology, guides claim filing, and compares different coverages.
5. **AI Policy Recommendation**: Recommends personalized coverage plans based on age, salary, lifestyle habits, and assets (car/home ownership).
6. **Billing & Receipts**: Premium deposit simulation, auto generation of transactions, and linkable PDF receipts.
7. **Interactive Dashboard**: Interactive charts tracking premium revenue growth, claims category distributions, and policy active status.

## Technologies Used

* **Backend**: Spring Boot 3.3.0, Spring Security, Spring AI, JPA/Hibernate, PostgreSQL, pgvector, Maven, Lombok, JWT.
* **Frontend**: React 19, React Router, TailwindCSS, Recharts, Framer Motion, Axios.
* **Infrastructure**: Docker, Docker Compose.

## How to Run

### Prerequisite
Ensure you have Docker and Docker Desktop installed.

### 1. Launch Infrastructures (Postgres & Redis)
From the root directory, start the database and cache memory:
```bash
docker-compose up -d
```

### 2. Run the Spring Boot Backend
From the `InsuranceWebProject/InsuranceWebProject` directory, compile and launch the server:
```bash
mvn clean install
mvn spring-boot:run
```
* **API Documentation (Swagger)**: http://localhost:8080/swagger-ui.html

### 3. Run the React Frontend
From the `insurancepolicymang` directory, download node modules and run the hot-reloading dev server:
```bash
npm install
npm start
```
* **Client App URL**: http://localhost:3000

### Seed Login Credentials
* **Admin**: `admin@insurancepro.com` / `Admin@123`
