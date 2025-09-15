# VIC State District API

A simple Node.js ES2023 headless API with Drizzle ORM for Victorian state district postcode lookup.

## Features

- **Postcode Lookup**: Look up district information by postcode
- **PostgreSQL**: Uses PostgreSQL database with Drizzle ORM
- **ES2023**: Modern JavaScript with ES modules
- **Express**: RESTful API with Express.js
- **CORS**: Cross-origin resource sharing enabled

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Setup

1. **Clone and install dependencies**:
   ```bash
   cd vic-state-district-api
   npm install
   ```

2. **Create PostgreSQL database**:
   ```bash
   createdb vic-state-districts
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your database credentials if needed
   ```

4. **Generate and run database migrations**:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the server**:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Health Check
- **GET** `/health` - Check if the API is running

### Postcode Lookup
- **POST** `/api/postcode_lookup` - Lookup district by postcode
- **GET** `/api/postcode_lookup/:postcode` - Lookup district by postcode (URL parameter)

#### POST /api/postcode_lookup
```json
{
  "postcode": "3000"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "postcode": 3000,
    "districts": [
      {
        "name": "Melbourne",
        "id": 1,
        "mp": {
          "name": "John Smith",
          "party": "Labor",
          "phoneNumber": "+61 3 1234 5678"
        }
      },
      {
        "name": "Richmond",
        "id": 2,
        "mp": {
          "name": "Jane Doe",
          "party": "Liberal",
          "phoneNumber": "+61 3 9876 5432"
        }
      }
    ]
  }
}
```

## Database Schema

### Tables

#### `postcodes`
- `id` (serial, primary key)
- `postcode_number` (integer, unique)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `districts`
- `id` (serial, primary key)
- `name` (text)
- `district_id` (integer, unique)
- `mp_id` (integer, foreign key to mps.id)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `mps`
- `id` (serial, primary key)
- `name` (text)
- `party` (text)
- `phone_number` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `postcode_districts` (Junction Table)
- `postcode_id` (integer, foreign key to postcodes.id)
- `district_id` (integer, foreign key to districts.id)
- `created_at` (timestamp)
- Primary key: (`postcode_id`, `district_id`)

### Relationships
- **Many-to-Many**: `postcodes` ↔ `districts` (via `postcode_districts`)
- **One-to-Many**: `mps` → `districts`

## Development

### Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start with auto-reload
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

### Project Structure

```
vic-state-district-api/
├── src/
│   ├── db/
│   │   ├── connection.js    # Database connection
│   │   └── schema.js        # Database schema
│   ├── routes/
│   │   └── postcode.js      # Postcode lookup routes
│   └── server.js            # Main server file
├── drizzle/                 # Generated migrations
├── drizzle.config.js        # Drizzle configuration
├── package.json
└── README.md
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://localhost:5432/vic-state-districts`)
- `PORT` - Server port (default: 3000)

## License

MIT
