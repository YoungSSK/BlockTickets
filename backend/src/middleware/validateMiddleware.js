export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu đầu vào không hợp lệ.",
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (result.data.body) req.body = result.data.body;
  req.validated = result.data;
  return next();
};
