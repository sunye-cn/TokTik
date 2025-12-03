# TokTik Server

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure environment variables:
    Copy `.env` (or create one) and set your database credentials.
    ```
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=postgres
    DB_NAME=toktik
    JWT_SECRET=your_secret
    ```

3.  Run the server:
    ```bash
    npm run dev
    ```

## API Endpoints

### Auth
-   `POST /api/auth/register` - { username, password }
-   `POST /api/auth/login` - { username, password }

### Videos
-   `GET /api/videos` - List all videos
-   `POST /api/videos` - Upload video (multipart/form-data, fields: title, description, video)
-   `GET /api/videos/:id` - Get video details
-   `DELETE /api/videos/:id` - Delete video
-   `POST /api/videos/:id/like` - Like video
-   `DELETE /api/videos/:id/like` - Unlike video

### Users
-   `GET /api/users/:id` - Get user profile
-   `GET /api/users/:id/videos` - Get user's videos
