# Fullstack application with .NET backend and Angular frontend

## Project description

Backend provides CRUD for adding, searching and sorting notes. Frontend executes adding, editing, and summary generation for notes.

### Execution

#### Run Postgres instance on docker

```bash
docker run -d -p 5432:5432 --name pg-local -e POSTGRES_PASSWORD=postgres postgres:16
```
#### Run backend

```bash
// Add migration if any changes in schema
dotnet ef migrations add MigrationMessage
// Apply migrations to create database and tables
dotnet ef database update
// trust local certificate
dotnet dev-certs https --trust
dotnet run
```

### Swagger UI

[-] http://localhost:5000/swagger/index.html