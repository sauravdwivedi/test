# test

docker run -d -p 5432:5432 --name pg-local -e POSTGRES_PASSWORD=postgres postgres:16

# 3. Apply migrations to create tables in the database
dotnet ef database update

dotnet dev-certs https --trust

dotnet run

dotnet run --urls "http://localhost:5100;https://localhost:5101" --no-https