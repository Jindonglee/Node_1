import express from "express";
import mongoose from "mongoose";
import joi from "joi";
import Products from "../schemas/products.schema.js";
import bcrypt from "bcrypt";

const router = express.Router();

const postProducts = joi.object({
  title: joi.string().min(1).max(100).required(),
  content: joi.string().min(1).max(200).required(),
  author: joi.string(),
  password: joi.string().min(4).required(),
  status: joi.string(),
});
const saltRounds = 10;

// 상품 게시
router.post("/products", async (req, res, next) => {
  try {
    const validation = await postProducts.validateAsync(req.body);
    let { title, content, author, password } = validation;
    // 비밀번호 암호화
    try {
      password = await bcrypt.hash(password, saltRounds);
    } catch (error) {
      next(error);
    }
    const productsMaxOrder = await Products.findOne().sort("-order").exec();
    const order = productsMaxOrder ? productsMaxOrder.order + 1 : 1;
    const data = new Products({ title, content, author, password, order });
    await data.save();
    return res.status(201).json({ message: "상품을 등록하였습니다." });
  } catch (error) {
    next(error);
  }
});

// 상품 조회
router.get("/products", async (req, res, next) => {
  try {
    const data = await Products.find().sort("-createdAt").exec();
    return res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
});

// 상세조회
router.get("/products/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;

    const data = await Products.findById(productId).select("+content").exec();
    if (!data) {
      return res.status(404).json({ message: "상품 조회에 실패하였습니다." });
    }
    return res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
});

// 상품 수정
router.put("/products/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const validation = await postProducts.validateAsync(req.body);
    let { title, content, password, status } = validation;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ message: "데이터 형식이 올바르지 않습니다." });
    }
    const product = await Products.findById(productId)
      .select("+password")
      .exec();

    if (!product) {
      return res.status(404).json({ message: "상품 조회에 실패했습니다." });
    }

    try {
      const result = await bcrypt.compare(password, product.password);
      if (result) {
      } else {
        return res
          .status(401)
          .json({ message: "상품을 수정할 권한이 존재하지 않습니다." });
      }
    } catch (err) {
      return next(err);
    }

    product.title = title;
    product.content = content;
    product.status = status;

    await product.save();

    return res.status(200).json({ message: "상품 정보를 수정하였습니다." });
  } catch (error) {
    next(error);
  }
});

// 상품 삭제
router.delete("/products/:productId", async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { password } = req.body;

    const product = await Products.findById(productId)
      .select("+password")
      .exec();
    if (!product) {
      return res.status(404).json({ message: "상품 조회에 실패하였습니다." });
    }
    try {
      const result = await bcrypt.compare(password, product.password);
      if (result) {
      } else {
        return res
          .status(401)
          .json({ message: "상품을 삭제할 권한이 존재하지 않습니다." });
      }
    } catch (err) {
      return next(err);
    }
    await Products.deleteOne({ _id: productId });
    return res.status(200).json({ message: "상품을 삭제하였습니다." });
  } catch (error) {
    next(error);
  }
});

export default router;
