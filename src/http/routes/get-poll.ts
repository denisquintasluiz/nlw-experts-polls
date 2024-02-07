import { z } from "zod"
import { prisma } from "../../lib/prisma"
import { FastifyInstance } from "fastify"

export async function getPoll(app: FastifyInstance) {
    app.get("/polls/:pollId", async (request, reply)=>{
        //validanting data type
        const createPollParams = z.object({
            pollId: z.string().uuid(),
        })
        //get data requested for client
        const { pollId } = createPollParams.parse(request.params)

        console.log(pollId)
    
        //find poll on the databse
       const poll = await prisma.poll.findUnique({
            where: {
                id: pollId,
            },
            include: {
                options: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        })

        return reply.send({ poll })
    
    })
}
