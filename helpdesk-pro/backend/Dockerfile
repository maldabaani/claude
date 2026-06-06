FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S helpdesk && adduser -S helpdesk -G helpdesk
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads && chown helpdesk:helpdesk /app/uploads
USER helpdesk
ENTRYPOINT ["java", "-jar", "app.jar"]
