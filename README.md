# Workout Tracker API

Project based on: [Fitness Workout Tracker Project](https://roadmap.sh/projects/fitness-workout-tracker)

## Description

A RESTful API for tracking workouts and exercise progress. Users can create workout plans, schedule workouts, and track their progress over time.

## Features

- User authentication using JWT
- Exercise management with categories
- Workout plan creation and scheduling
- Progress tracking and reporting
- Swagger/OpenAPI documentation

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT for authentication
- Swagger for API documentation

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create `.env` file with required environment variables:

```env
PORT=3000
DB_USER=your_username
DB_HOST=localhost
DB_NAME=workout_tracker
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key
```

4. Initialize database:

```bash
npm run seed
```

5. Start the server:

```bash
npm run dev
```

## API Documentation

Access the Swagger documentation at: `http://localhost:3000/api-docs`

## Testing

Run tests using:

```bash
npm test
```

## License

MIT
