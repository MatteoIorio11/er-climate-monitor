import { precipitationModel } from "../models/precipitationModel"
import { Request, Response } from "express"


const getLatestX = (request: Request, response: Response) => {
    response.send()
}

const postNewData = (request: Request, response: Response) => {
    const modelData = request.body;
    const newData = new precipitationModel(modelData);
    newData.save();
    response.send(201);
}

export { getLatestX }