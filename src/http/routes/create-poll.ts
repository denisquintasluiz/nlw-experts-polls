import { z } from "zod"
import { prisma } from "../../lib/prisma"
import { FastifyInstance } from "fastify"

export async function createPoll(app: FastifyInstance) {
    app.post("/polls", async (request, reply)=>{
        //validanting data type
        const createPollBody = z.object({
            title: z.string(),
            options: z.array(z.string()),
        })
        //get data requested for client
        const { title, options } = createPollBody.parse(request.body)
    
        //created poll on the databse
       const poll = await prisma.poll.create({
            data: {
                title,
                options:{
                    createMany:{
                        data: options.map(options => {
                            return {
                                title: options
                            }
                        })
                    }
                }
            }
        })

        return reply.status(201).send({"pollId": poll.id})
    
    })
}
