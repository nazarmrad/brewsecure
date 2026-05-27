module.exports = function mcpAuth(req, res, next) {
  const key = process.env.MCP_API_KEY
  if (!key) return next()
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || token !== key) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
