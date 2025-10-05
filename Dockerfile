# Use an official OpenJDK image as base
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Install Maven and build the app (skip tests for faster build)
RUN apt-get update && apt-get install -y maven && mvn clean package -DskipTests

# Expose the port your app runs on (usually 8080)
EXPOSE 8080

# Run the app
CMD ["java", "-jar", "target/*.jar"]
