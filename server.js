const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const app = next({ dev: false })
const handle = app.getRequestHandler()
const rawPort = process.env.PORT ?? '3000'
const socketPath = /^\d+$/.test(rawPort) ? parseInt(rawPort) : rawPort

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url ?? '/', true)
        handle(req, res, parsedUrl)
    })

    server.listen(socketPath, () => {
        console.log('> Beetle in a Box ready on', socketPath)
    })
})
