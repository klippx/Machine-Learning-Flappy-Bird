import express from 'express'
import path from 'path'

const app = express()

app.use(express.static('./'))
// FIXME: Dont serve everything
// app.use(express.static(path.join(__dirname, "..", "public")));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

app.listen(8080, () => {
  console.log('App listening on http://localhost:8080')
})
