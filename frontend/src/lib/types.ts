export type IngredientType =
  | 'base'
  | 'liquid'
  | 'salt'
  | 'yeast'
  | 'sweetener'
  | 'fat'
  | 'spice'
  | 'grain'
  | 'starter'
  | 'add-in';

export interface Ingredient {
  name: string;
  type: IngredientType;
  percentage: number;
  weight: number;
}

export interface Recipe {
	name: string;
	quantity: number;         
	weightPerUnit: number;    
	totalWeight: number;
	ingredients: Ingredient[];
	instructions: string;
}

// frontend/src/lib/api.ts
import type { Recipe } from './types';

const API = 'http://localhost:3000/recipes';

export async function getRecipes(): Promise<Recipe[]> {
  const res = await fetch(API);
  return res.json();
}

export async function getRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`${API}/${id}`);
  return res.json();
}

export async function createRecipe(recipe: Recipe) {
	//const res = await fetch('/api/recipes', {
  const res = await fetch(`${API}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(recipe)
	});
	if (!res.ok) {
		throw new Error('Failed to create recipe');
	}
	return await res.json();
}

export async function updateRecipe(id: string, recipe: Recipe): Promise<Recipe> {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe)
  });
  return res.json();
}

export async function deleteRecipe(id: string): Promise<void> {
  await fetch(`${API}/${id}`, { method: 'DELETE' });
}