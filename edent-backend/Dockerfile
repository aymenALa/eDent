# Stage 1: Build with Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY ./pom.xml .
COPY ./src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the final minimal runtime image (tuned for 512 MB RAM containers)
FROM eclipse-temurin:17-jre-alpine
VOLUME /tmp
COPY --from=builder /app/target/*.jar /app.jar
EXPOSE 5050
ENTRYPOINT ["sh", "-c", "java -Xms128m -Xmx320m -XX:+UseSerialGC -Dserver.port=${PORT:-5050} -jar /app.jar"]
