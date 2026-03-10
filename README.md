# Fullstack application with .NET backend and Angular frontend

## Project description

Backend provides CRUD for adding, searching and sorting notes. Frontend executes adding, editing, deleting, and summary generation for notes.

<img src=Swagger.PNG alt="Swagger UI">

### Execution

#### Run Postgres instance on docker

```bash
docker run -d -p 5432:5432 --name pg-local -e POSTGRES_PASSWORD=postgres postgres:16
```


#### Hugging Face API Token

To use Hugging Face models in this project, you need an **API token**. Follow these steps to create one:

1. Go to the Hugging Face token page:  
   [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

2. Log in with your Hugging Face account (or create a free account if you don’t have one).

3. Click **“New token”**.

4. Enter a **name** for your token (e.g., `note-app-demo`) and select the **scope**:
   - **Read** – to download models and datasets.

5. Click **Generate**.

6. **Copy the token** and replace it with ApiToken" value in **backend/appsettings.json** file.

#### Run backend service

```bash
cd backend
```

##### Add migration if any changes in schema
```bash
dotnet ef migrations add MigrationMessage
```
##### Apply migrations to create database and tables
```bash
dotnet ef database update
```
##### Trust local certificates
```bash
dotnet dev-certs https --trust
```
##### Run backend service
```bash
dotnet run
```

### Swagger UI

- http://localhost:5000/swagger/index.html

#### Run frontend

```bash
cd frontend
ng serve
```

- http://localhost:4200

