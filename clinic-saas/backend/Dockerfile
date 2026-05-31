# ── Stage 1: Build ────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Cache dependency layer independently from source
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

COPY src ./src
RUN mvn package -DskipTests -B -q

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=builder /app/target/*.jar app.jar
RUN chown spring:spring app.jar

USER spring

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
