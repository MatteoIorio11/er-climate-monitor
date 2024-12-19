import { precipitationModel } from "../models/precipitationModel"
module.exports.get = (request, response) => {
    precipitationModel.find()
}