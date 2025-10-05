# Step 1: Use Maven to build the project
FROM maven:3.9.6-eclipse-temurin-17 AS build

# Set the working directory
WORKDIR /app

# Copy everything from backend
COPY . .

# Build the project (skipping tests)
RUN mvn clean package -DskipTests

# Step 2: Use lightweight JDK to run the jar
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy the built jar from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose the Spring Boot port
EXPOSE 8080

# Command to run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
