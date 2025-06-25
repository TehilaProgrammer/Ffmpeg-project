const convertR = require("./convertJsonToFfmpegCommand");
const convertUR = require("./convertJsonToFfmpegCommandUpload");
const generateR=require("./generateFfmpegCommandForClient");
const statusR = require("./status");


exports.routesInit=(app)=>{

app.use("/", convertR);
app.use("/", convertUR);
app.use("/", statusR);
app.use("/",generateR);
}

