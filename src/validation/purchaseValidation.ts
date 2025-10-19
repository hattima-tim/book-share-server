import Joi from "joi";
import { joiSchemaValidator } from "../middleware/joiSchemaValidator.ts";

const purchaseSchema = Joi.object().keys({
  productId: Joi.string().required(),
  productName: Joi.string().required(),
  amount: Joi.number().required().min(0),
});

export default joiSchemaValidator(purchaseSchema);
