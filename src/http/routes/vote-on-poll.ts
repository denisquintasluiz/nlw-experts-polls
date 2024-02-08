import { z } from "zod"
import { randomUUID } from "node:crypto"
import { prisma } from "../../lib/prisma"
import { FastifyInstance } from "fastify"
import { redis } from "../../lib/redis"
import { voting } from "../../utils/voting-pub-sub"

export async function voteOnPoll(app: FastifyInstance) {
    app.post("/polls/:pollId/votes", async (request, reply)=>{
        //validanting data type from request body
        const voteOnPollBody = z.object({
            pollOptionId: z.string().uuid()
        })

         //validating data types from request params
         const voteOnPollParams = z.object({
            pollId: z.string().uuid()
         })

         const sessionParams = z.object({
            sessionId: z.string()
         })

        //get data requested by client on request body
        const { pollOptionId } = voteOnPollBody.parse(request.body)

       //get data requested by client on request params
       const { pollId } = voteOnPollParams.parse(request.params)

        //created logic to vote on pollOptions
        const { sessionId } = sessionParams.parse(request.cookies)

        //verified if the user had a vote
        if(sessionId) {
            const userpreviusVoteOnPoll = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId
                    }
                }
            })
            //verify if the user want tho make vote at another poll option
            if(userpreviusVoteOnPoll && userpreviusVoteOnPoll.pollOptionId != pollOptionId){
              //if the condiction satisfy, delete the poll option previous
              await prisma.vote.delete({
                where: {
                  id: userpreviusVoteOnPoll.id,
                },
              });

              //decremente the rank of votes, if the user want to change their pollOption
             const votes = await redis.zincrby(
                pollId,
                -1,
                userpreviusVoteOnPoll.pollOptionId
              );

              //published message when the user vote on an pull or change thier twoice
              voting.publish(pollId, {
                pollOptionId: userpreviusVoteOnPoll.pollOptionId,
                votes: Number(votes),
              });
              
            } else if(userpreviusVoteOnPoll){
                return reply.status(400).send({message: "You already vote on this poll."})
            }
        }
        //make the user session if he dont have
        if(!sessionId){
            const sessionId = randomUUID();

            reply.setCookie("sessionId", sessionId, {
              path: "/",
              maxAge: 60 * 60 * 24 * 30, // 30 days
              signed: true,
              httpOnly: true,
            });
        }
       //make it vote at the poll option
       await prisma.vote.create({
           data: {
                sessionId,
                pollId,
                pollOptionId
           }
       })

       //created rank of votes for all pollOptions 
       const votes = await redis.zincrby(pollId, 1, pollOptionId)

       //published message when the user vote on an pull or change thier twoice
       voting.publish(pollId, {
            pollOptionId,
            votes: Number(votes)
       })

        return reply.status(201).send()
    })
}
