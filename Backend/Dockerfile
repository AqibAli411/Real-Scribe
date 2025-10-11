# Step 1: Use Maven with Java 17 LTS to build the project
FROM maven:3.9.6-eclipse-temurin-17 AS build

# Set the working directory
WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .

# Copy source code
COPY src ./src

# Build the project (skipping tests)
RUN mvn clean package -DskipTests

# Step 2: Use lightweight JRE 17 to run the jar
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Create a non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

# Expose the Spring Boot port
EXPOSE 8080

# Command to run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
