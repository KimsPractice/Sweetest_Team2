import express from "express";
import socketIO from "socket.io";
import logger from "morgan";
import pug from "pug";

const app = express();
const PORT = 4000;

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);

app.use(logger("dev"));

app.get("/", (req, res) => {
  res.render("layout");
});

const server = app.listen(PORT, () =>
  console.log(`Server is running... PORT:${PORT}`)
);

const io = socketIO.listen(server);
