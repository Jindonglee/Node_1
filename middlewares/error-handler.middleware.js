export default (err, req, res, next) => {
  console.error(err);

  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ message: "데이터 형식이 올바르지 않습니다." });
  }

  return res.status(500).json({ message: "서버에서 에러가 발생했습니다." });
};
