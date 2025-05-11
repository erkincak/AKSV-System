# Backend API Documentation

## CORS Policy

- CORS is enabled using the `cors` middleware in Express.
- Default policy allows requests from all origins.

## Base URL

- All API endpoints are prefixed with `/api`.

## Endpoints

### GET /api/mock

- Returns mock data for testing.
- Response:
  ```json
  {
    "message": "This is mock data from the backend",
    "data": {
      "id": 1,
      "name": "Sample Item",
      "description": "This is a sample description"
    }
  }
  ```

### CRUD for Items

#### POST /api/items

- Create a new item.
- Request body:
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)"
  }
  ```
- Response: Created item with id.
- Status codes: 201 (Created), 400 (Validation error)

#### GET /api/items

- Get all items.
- Response: Array of items.

#### GET /api/items/:id

- Get item by id.
- Response: Item object.
- Status codes: 404 (Not found)

#### PUT /api/items/:id

- Update item by id.
- Request body same as POST.
- Response: Updated item.
- Status codes: 404 (Not found), 400 (Validation error)

#### DELETE /api/items/:id

- Delete item by id.
- Response: No content.
- Status codes: 204 (No content), 404 (Not found)

## Error Handling

- 500 Internal Server Error for unexpected errors.

---

# Frontend Integration Notes

- Use fetch API to interact with backend endpoints.
- Base URL for API calls: `http://localhost:3000/api`

# Optional Deployment

- Backend can be deployed on platforms like Render or Railway.
- For local tunneling, use ngrok to expose local server.
