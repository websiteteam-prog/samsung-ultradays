export function requirePartner(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required"
    });
  }

  const token = auth.replace("Bearer ", "");

  if (token !== process.env.PARTNER_API_TOKEN) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

  next();
}