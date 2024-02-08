import { FastifyInstance } from "fastify";
import { voting } from "../../utils/voting-pub-sub";
import { z } from "zod";


export async function pollResults(app: FastifyInstance){
    app.get('/polls/:pollId/results', { websocket: true}, (connection, request) => {
            //validanting data type
            const createPollParams = z.object({
                pollId: z.string().uuid(),
            })
            //get data requested for client
            const { pollId } = createPollParams.parse(request.params)

           voting.subscribe(pollId, (message) => {
              connection.socket.send(JSON.stringify(message))
           })
           
    })
}