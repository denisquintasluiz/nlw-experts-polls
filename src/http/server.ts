import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { z } from 'zod'
import { createPoll } from './routes/create-poll'
import { getPoll } from './routes/get-poll'
import { voteOnPoll } from './routes/vote-on-poll'

//instancied fastify framework
const app = fastify()

//config cookies
app.register(cookie, {
    secret: "nlw-poll-exports-nodejs",
    hook: 'onRequest'
})

//registed all aplication routes
app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)

//open the aplication listening port
app.listen({ port: 3333}).then(()=>{console.log("Http server is running!")})