import express from "express";
import mongoose from "mongoose";
import joi from "joi";
import Data from "../schemas/products.schema.js";

const router = express.Router();

const postProducts = joi.object({
  title: joi.string().min(1).max(100).required(),
  content: joi.string().min(1).max(200).required(),
  author: joi.string(),
  password: joi.string().min(4).required(),
  status: joi.string(),
});
// 상품 조회
router.post("/products", async (req, res, next) => {
  try {
    const validation = await postProducts.validateAsync(req.body);
    const { title, content, author, password } = validation;
    const productsMaxOrder = await Data.findOne().sort("-order").exec();
    const order = productsMaxOrder ? productsMaxOrder.order + 1 : 1;
    const data = new Data({ title, content, author, password, order });
    await data.save();
    return res.status(201).json({ message: "상품을 등록하였습니다." });
  } catch (error) {
    next(error);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const data = await Data.find().sort("-order").exec();
    return res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
});

// 상세조회
router.get("/products/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;

    const data = await Data.findById(productId).select("+content").exec();
    if (!data) {
      return res.status(404).json({ message: "상품 조회에 실패하였습니다." });
    }
    return res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
});

router.put("/products/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const validation = await postProducts.validateAsync(req.body);
    const { title, content, password, status } = validation;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ message: "데이터 형식이 올바르지 않습니다." });
    }

    const curProduct = await Data.findById(productId)
      .select("+password")
      .exec();

    if (!curProduct) {
      return res.status(404).json({ message: "상품 조회에 실패했습니다." });
    }

    if (curProduct.password !== password) {
      return res
        .status(401)
        .json({ message: "상품을 수정할 권한이 존재하지 않습니다." });
    }

    curProduct.title = title;
    curProduct.content = content;
    curProduct.status = status;

    await curProduct.save();

    return res.status(200).json({ message: "상품 정보를 수정하였습니다." });
  } catch (error) {
    next(error);
  }
});

/**product 삭제 */
router.delete("/products/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { password } = req.body;

    const product = await Data.findById(productId).select("+password").exec();
    if (!product) {
      return res.status(404).json({ message: "상품 조회에 실패하였습니다." });
    }
    if (product.password !== password) {
      return res
        .status(401)
        .json({ message: "상품을 삭제할 권한이 없습니다." });
    }
    await Data.deleteOne({ _id: productId });
    return res.status(200).json({ message: "상품을 삭제하였습니다." });
  } catch (error) {
    next(error);
  }
});

export default router;
