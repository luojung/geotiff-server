// import rgbTiles from './rgb'
import rgbTiles_local from './rgb1'
// import calculate from './calculate'
// import metadata from './metadata'
import express from 'express'

export const routes = express.Router()

routes.get('/', (req, res) => { res.status(200).json({ message: 'Connected!' }) })
routes.get('/tiles/:x/:y/:z.png', rgbTiles_local)
// routes.get('/metadata', metadata)
// routes.get('/tiles/:x/:y/:z.jpeg', rgbTiles)
// routes.get('/tiles/calculate/:x/:y/:z.jpeg', calculate)
