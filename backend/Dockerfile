FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven files
COPY pom.xml ./
COPY src ./src

# Install maven and package
RUN apk add --no-cache maven && \
    mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S payshield && adduser -S payshield -G payshield
USER payshield:payshield

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
