import { Http2ServerResponse } from "http2"
import { precipitationModel } from "../models/precipitationModel"
import { Request, Response } from "express"
import HttpStatus from "http-status-codes"



const getLatestX = (request: Request, response: Response) => {
    response.send()
}

const postNewData = (request: Request, response: Response) => {
    const modelData = request.body;
    const newData = new precipitationModel(modelData);
    newData.save();
    response.send(HttpStatus.CREATED);
}

export { getLatestX, postNewData }