import mongoose from "mongoose"

const precipitationScheme = new mongoose.Schema({
    sensor: String,
    date: Date,
    value: String
});
const precipitationModel = mongoose.model("Precipitations", precipitationScheme);
module.exports = { precipitationModel }