import { Schema, model } from 'mongoose';

export type IngredientType =
  | 'flour'
  | 'liquid'
  | 'salt'
  | 'yeast'
  | 'sweetener'
  | 'fat'
  | 'spice'
  | 'grain'
  | 'starter'
  | 'add-in';

interface Ingredient {
  name: string;
  type: IngredientType;
  percentage: number;
  weight: number;
}

export interface IRecipe {
  name: string;
  ingredients: Ingredient[];
  instructions: string;
}

const IngredientSchema = new Schema<Ingredient>({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'flour', 'liquid', 'salt', 'yeast', 'sweetener',
      'fat', 'spice', 'grain', 'starter', 'add-in'
    ],
    required: true
  },
  percentage: { type: Number, required: true },
  weight: { type: Number, required: true }
});

const RecipeSchema = new Schema<IRecipe>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },        
	weightPerUnit: { type: Number, required: true },   
	totalWeight: { type: Number, required: true },      
  ingredients: { type: [IngredientSchema], required: true },
  instructions: { type: String, required: true }

});

export default model<IRecipe>('Recipe', RecipeSchema);