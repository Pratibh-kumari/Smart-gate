# Smart Gate Backend

Node.js + Express backend for Smart Gate visitor management.

## Start

```bash
npm install
npm start
```

Server entrypoint:

- `scr/server.js`

## Environment Variables

Create `.env` in this folder:

```env
MONGO_URI=mongodb://127.0.0.1:27017/smart-gate
JWT_SECRET=your_secret_key
PORT=5000
```

## Test API Collection

```bash
npm run test:postman:cli
```


