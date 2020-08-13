import express from "express";
import socketIO from "socket.io";
import logger from "morgan";
import socketController from "./socketController";

const app = express();
const PORT = 4000;

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);

app.use(logger("dev"));
app.use(express.static(`${__dirname}/static`));

app.get("/", (req, res) => res.render("index"));
app.get("/halli", (req, res) => {
  const { userNickname } = req.query;
  res.render("halli", { userNickname });
});

const server = app.listen(PORT, () =>
  console.log(`Server is running... PORT:${PORT}`)
);

const io = socketIO.listen(server);

io.on("connection", (socket) => socketController(socket, io));
