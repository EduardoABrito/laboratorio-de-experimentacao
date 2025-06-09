const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

const users = [
    { id: 1, name: "João", email: "joao@gmail.com" },
    { id: 2, name: "Maria", email: "maria@gmail.com" },
    { id: 3, name: "Carlos", email: "carlos@gmail.com" },
    { id: 4, name: "Ana", email: "ana@gmail.com" },
];

app.get("/api/users", (req, res) => {
  res.json(users);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`REST API rodando em http://localhost:${PORT}/api/users`);
});
