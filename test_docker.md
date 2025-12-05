 docker run --rm -t \
    -v "$(pwd):/usr/src/app" \
    -v /usr/src/app/node_modules \
    --env-file .env.test \
    -e DB_HOST=host.docker.internal \
    auth-service:dev \
    npm test


     docker run --rm -t \
    --name auth-service-dev \
    -p 5501:5501 \
    -v "$(pwd):/usr/src/app" \
    -v /usr/src/app/node_modules \
    --env-file .env.dev \
    -e DB_HOST=host.docker.internal \
    auth-service:dev


      curl -X POST http://localhost:5501/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "password": "Password123"
    }'




