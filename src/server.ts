import "dotenv/config";

import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`CRM API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});

export default server;