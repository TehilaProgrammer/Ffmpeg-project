const convertR = require("./convertJsonToFfmpegCommand");
const statusR = require("./status");


exports.routesInit=(app)=>{

app.use("/", convertR);
app.use("/", statusR);
}

