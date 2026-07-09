# Stage 1: Build the application using .NET 10 SDK
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution file and project files for restoration
COPY ["Veterinaria.sln", "./"]
COPY ["Veterinaria.Domain/Veterinaria.Domain.csproj", "Veterinaria.Domain/"]
COPY ["Veterinaria.Application/Veterinaria.Application.csproj", "Veterinaria.Application/"]
COPY ["Veterinaria.Infrastructure/Veterinaria.Infrastructure.csproj", "Veterinaria.Infrastructure/"]
COPY ["Veterinaria.Web/Veterinaria.Web.csproj", "Veterinaria.Web/"]

# Restore dependencies
RUN dotnet restore "Veterinaria.Web/Veterinaria.Web.csproj"

# Copy all source files
COPY . .

# Build and publish the release
RUN dotnet publish "Veterinaria.Web/Veterinaria.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime image using .NET 10 ASP.NET Core runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Configure container port (ASP.NET Core 8/10 default port)
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Veterinaria.Web.dll"]
