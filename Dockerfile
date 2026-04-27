# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy projects and restore dependencies
COPY ["Poyezd.Api/Poyezd.Api.csproj", "Poyezd.Api/"]
COPY ["Poyezd.Domain/Poyezd.Domain.csproj", "Poyezd.Domain/"]
RUN dotnet restore "Poyezd.Api/Poyezd.Api.csproj"

# Copy everything and build
COPY . .
WORKDIR "/src/Poyezd.Api"
RUN dotnet build "Poyezd.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Poyezd.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Poyezd.Api.dll"]
